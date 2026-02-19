/**
 * ConfigureRulesModal — Modal guidé "Configurer les règles" (P1-03g).
 *
 * Parcours 3 étapes (aucun JSON / aucune clé technique visible) :
 *  1. Choisir la phase (si non pré-sélectionnée)
 *  2. Sélectionner les blocs de règles (filtrés par GrandeFamille + phase)
 *  3. Compléter les champs (labels FR, valeurs auto en lecture seule)
 */

import React, { useState, useMemo } from 'react';
import type { BaseContratProduct, VersionedRuleset, Block, FieldDef } from '@/types/baseContratSettings';
import { PHASE_LABELS } from '@/constants/baseContratLabels';
import { BLOCK_TEMPLATES, getTemplatesForContext } from '@/constants/base-contrat/blockTemplates';
import { humanizeFieldKey, formatRefLabel } from '@/constants/base-contrat/fieldLabels.fr';
import {
  countBlocksByTemplateId,
  getNextBlockIndex,
  getNextSortOrder,
  getExistingTemplateIds,
  canAddTemplate,
} from '../utils/configureRules';

type PhaseKey = 'constitution' | 'sortie' | 'deces';
const PHASE_KEYS: PhaseKey[] = ['constitution', 'sortie', 'deces'];

function phaseStateLabel(phase: { applicable: boolean; blocks: { length: number } }): string {
  if (!phase.applicable) return 'Sans objet';
  if (phase.blocks.length === 0) return 'Vide — aucun bloc';
  return `${phase.blocks.length} bloc${phase.blocks.length > 1 ? 's' : ''} configuré${phase.blocks.length > 1 ? 's' : ''}`;
}

const inputCss: React.CSSProperties = {
  fontSize: 13, padding: '5px 8px', borderRadius: 6,
  border: '1px solid var(--color-c8)', width: '100%',
  boxSizing: 'border-box', backgroundColor: '#FFFFFF',
};

// ---------------------------------------------------------------------------
// Inline field editor (step 3)
// ---------------------------------------------------------------------------

function DraftField({ fieldKey, def, onChange }: { fieldKey: string; def: FieldDef; onChange: (_k: string, _v: unknown) => void }) {
  const label = humanizeFieldKey(fieldKey);

  if (def.type === 'ref') {
    const meta = formatRefLabel(String(def.value ?? ''));
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--color-c9)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--color-c3)' }}>★</span>
          <strong style={{ color: 'var(--color-c10)' }}>{meta.label}</strong>
          <span>({meta.source})</span>
          {meta.settingsRoute && <a href={meta.settingsRoute} style={{ fontSize: 11, color: 'var(--color-c3)', textDecoration: 'underline' }}>↗ Ouvrir</a>}
        </div>
      </div>
    );
  }

  if (def.type === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <input type="checkbox" checked={!!def.value} onChange={(e) => onChange(fieldKey, e.target.checked)} />
        <span style={{ fontSize: 13, color: 'var(--color-c10)' }}>{label}</span>
      </div>
    );
  }

  if (def.type === 'enum' && def.options) {
    return (
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>{label}</label>
        <select value={String(def.value ?? '')} onChange={(e) => onChange(fieldKey, e.target.value)} style={inputCss}>
          {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>
        {label}{def.unit ? ` (${def.unit})` : ''}
      </label>
      <input
        type={def.type === 'number' ? 'number' : 'text'}
        value={String(def.value ?? '')}
        step={def.type === 'number' ? '0.01' : undefined}
        onChange={(e) => onChange(fieldKey, def.type === 'number' ? Number(e.target.value) : e.target.value)}
        style={inputCss}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export interface ConfigureRulesModalProps {
  product: BaseContratProduct;
  ruleset: VersionedRuleset;
  initialPhase?: PhaseKey;
  onClose: () => void;
  onSave: (_phaseKey: PhaseKey, _newBlocks: Block[]) => void;
}

export function ConfigureRulesModal({ product, ruleset, initialPhase, onClose, onSave }: ConfigureRulesModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialPhase ? 2 : 1);
  const [selectedPhase, setSelectedPhase] = useState<PhaseKey | null>(initialPhase ?? null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [blockDrafts, setBlockDrafts] = useState<Record<string, Block>>({});

  // Phase actuelle (pour anti-doublon)
  const currentPhase = selectedPhase ? ruleset.phases[selectedPhase] : null;

  // ── Step 1 ──
  function handlePhaseSelect(pk: PhaseKey) {
    setSelectedPhase(pk);
    setSelectedIds([]);
    setBlockDrafts({});
    setStep(2);
  }

  // ── Step 2 ──
  const availableTemplates = selectedPhase
    ? getTemplatesForContext(product.grandeFamille, selectedPhase)
    : [];

  // note-libre toujours dispo en escape hatch (si pas déjà listée)
  const noteFreeAlreadyListed = availableTemplates.some((t) => t.templateId === 'note-libre');
  const noteFreeTemplate = BLOCK_TEMPLATES.find((t) => t.templateId === 'note-libre')!;
  const allTemplates = noteFreeAlreadyListed ? availableTemplates : [...availableTemplates, noteFreeTemplate];

  // Anti-doublon : templateIds déjà présents dans la phase
  const existingTemplateIds = useMemo(
    () => getExistingTemplateIds(currentPhase?.blocks ?? []),
    [currentPhase],
  );

  // Compter les notes libres existantes (pour affichage informatif)
  const noteFreeCount = currentPhase ? countBlocksByTemplateId(currentPhase.blocks, 'note-libre') : 0;

  function handleTemplateToggle(templateId: string) {
    // Anti-doublon : 1 seul bloc par templateId par phase (y compris note-libre)
    const alreadyInPhase = !canAddTemplate(currentPhase?.blocks ?? [], templateId);
    if (alreadyInPhase) return;

    if (selectedIds.includes(templateId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== templateId));
      setBlockDrafts((prev) => { const next = { ...prev }; delete next[templateId]; return next; });
    } else {
      const tmpl = BLOCK_TEMPLATES.find((t) => t.templateId === templateId);
      if (!tmpl || !selectedPhase) return;

      // blockId déterministe : {templateId}__{phaseKey}__{index}
      const index = getNextBlockIndex(currentPhase?.blocks ?? [], tmpl.templateId, selectedPhase);
      const blockId = `${tmpl.templateId}__${selectedPhase}__${index}`;
      const sortOrder = getNextSortOrder(currentPhase?.blocks ?? []);

      const payload = JSON.parse(JSON.stringify(tmpl.defaultBlock.payload));
      const block: Block = {
        blockId,
        blockKind: tmpl.defaultBlock.blockKind,
        uiTitle: tmpl.defaultBlock.uiTitle,
        audience: tmpl.defaultBlock.audience,
        payload,
        notes: tmpl.defaultBlock.notes,
        dependencies: tmpl.defaultBlock.dependencies,
        sortOrder,
      };
      setSelectedIds((prev) => [...prev, templateId]);
      setBlockDrafts((prev) => ({ ...prev, [templateId]: block }));
    }
  }

  // ── Step 3 ──
  function handleFieldChange(templateId: string, fieldKey: string, value: unknown) {
    setBlockDrafts((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        payload: { ...prev[templateId].payload, [fieldKey]: { ...prev[templateId].payload[fieldKey], value } },
      },
    }));
  }

  function handleTitleChange(templateId: string, title: string) {
    setBlockDrafts((prev) => ({ ...prev, [templateId]: { ...prev[templateId], uiTitle: title } }));
  }

  function handleNotesChange(templateId: string, notes: string) {
    setBlockDrafts((prev) => ({ ...prev, [templateId]: { ...prev[templateId], notes } }));
  }

  function handleSave() {
    if (!selectedPhase || selectedIds.length === 0) return;
    const blocks = selectedIds.map((id) => blockDrafts[id]).filter(Boolean);
    onSave(selectedPhase, blocks);
    onClose();
  }

  // ── Styles ──
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const panel: React.CSSProperties = {
    background: 'var(--color-c7)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    width: 560, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', padding: '28px 32px',
  };
  const btnPrimary: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 6,
    border: 'none', cursor: 'pointer', background: 'var(--color-c3)', color: '#FFFFFF',
  };
  const btnSecondary: React.CSSProperties = {
    fontSize: 13, padding: '8px 16px', borderRadius: 6,
    border: '1px solid var(--color-c8)', background: 'none', cursor: 'pointer', color: 'var(--color-c9)',
  };

  const stepLabel = step === 1
    ? 'Étape 1 / 3 — Choisir la phase'
    : step === 2
    ? `Étape 2 / 3 — Sélectionner les blocs${selectedPhase ? ` (${PHASE_LABELS[selectedPhase]})` : ''}`
    : `Étape 3 / 3 — Compléter les champs (${PHASE_LABELS[selectedPhase!]})`;

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={panel}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-c10)' }}>Configurer les règles</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-c9)' }}>{product.label} — {stepLabel}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-c9)', lineHeight: 1 }}>✕</button>
        </div>

        {/* ── Étape 1 : Phase selector ── */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>Sélectionnez la phase à configurer.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PHASE_KEYS.map((pk) => {
                const isEmpty = ruleset.phases[pk].applicable && ruleset.phases[pk].blocks.length === 0;
                return (
                  <button key={pk} type="button" onClick={() => handlePhaseSelect(pk)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 8, textAlign: 'left', cursor: 'pointer', border: `1px solid ${isEmpty ? 'var(--color-c3)' : 'var(--color-c8)'}`, background: isEmpty ? 'rgba(0,0,0,0.02)' : 'var(--color-c7)' }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-c10)' }}>{PHASE_LABELS[pk]}</span>
                    <span style={{ fontSize: 12, color: isEmpty ? 'var(--color-c3)' : 'var(--color-c9)' }}>{phaseStateLabel(ruleset.phases[pk])}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Étape 2 : Block selector ── */}
        {step === 2 && selectedPhase && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 12 }}>
              Cochez les blocs à ajouter. Les valeurs seront ajustables à l'étape suivante.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allTemplates.map((tmpl) => {
                const checked = selectedIds.includes(tmpl.templateId);
                const isDisabled = existingTemplateIds.has(tmpl.templateId);
                return (
                  <label key={tmpl.templateId}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      border: `1px solid ${checked ? 'var(--color-c3)' : 'var(--color-c8)'}`,
                      background: isDisabled ? 'var(--color-c8)' : checked ? 'rgba(0,0,0,0.03)' : 'var(--color-c7)',
                      opacity: isDisabled ? 0.65 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isDisabled}
                      onChange={() => handleTemplateToggle(tmpl.templateId)}
                      style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-c10)' }}>
                        {tmpl.uiTitle}
                        {isDisabled && (
                          <span style={{ fontSize: 11, color: 'var(--color-c9)', marginLeft: 8, fontStyle: 'italic' }}>(Déjà ajouté)</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-c9)', marginTop: 2 }}>{tmpl.description}</div>
                      {tmpl.templateId === 'note-libre' && noteFreeCount > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--color-c3)', marginTop: 2 }}>
                          {noteFreeCount} note{noteFreeCount > 1 ? 's' : ''} déjà présente{noteFreeCount > 1 ? 's' : ''} dans cette phase
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button onClick={() => !initialPhase && setStep(1)} style={{ ...btnSecondary, opacity: initialPhase ? 0.4 : 1, cursor: initialPhase ? 'default' : 'pointer' }} disabled={!!initialPhase}>← Retour</button>
              <button onClick={() => selectedIds.length > 0 && setStep(3)} disabled={selectedIds.length === 0}
                style={{ ...btnPrimary, opacity: selectedIds.length === 0 ? 0.5 : 1, cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer' }}>
                Suivant ({selectedIds.length} bloc{selectedIds.length > 1 ? 's' : ''}) →
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Field editor ── */}
        {step === 3 && selectedPhase && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
              Les valeurs avec ★ sont lues automatiquement depuis vos Paramètres — elles ne sont pas modifiables ici.
            </p>
            {selectedIds.map((id) => {
              const draft = blockDrafts[id];
              if (!draft) return null;
              const isNote = draft.blockKind === 'note';
              return (
                <div key={id} style={{ border: '1px solid var(--color-c8)', borderRadius: 8, padding: '14px 16px', marginBottom: 14, background: 'var(--color-c7)' }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>Titre du bloc</label>
                    <input value={draft.uiTitle} onChange={(e) => handleTitleChange(id, e.target.value)} style={inputCss} />
                  </div>
                  {!isNote && Object.entries(draft.payload).map(([fKey, fDef]) => (
                    <DraftField key={fKey} fieldKey={fKey} def={fDef} onChange={(k, v) => handleFieldChange(id, k, v)} />
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>Note complémentaire (optionnel)</label>
                    <textarea
                      value={String(draft.notes ?? '')}
                      onChange={(e) => handleNotesChange(id, e.target.value)}
                      rows={2}
                      placeholder="Précisions réglementaires, cas particuliers…"
                      style={{ ...inputCss, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>← Modifier la sélection</button>
              <button onClick={handleSave} style={btnPrimary} data-testid="configure-rules-save">Enregistrer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
