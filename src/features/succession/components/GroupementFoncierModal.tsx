/**
 * GroupementFoncierModal — Saisie des groupements fonciers (GFA/GFV/GFF/GF)
 *
 * Art. 793 bis CGI : exonération 75% DMTG ≤ 600 000 € / bénéficiaire (LF 2025),
 * puis 50% au-delà.
 */

import { useState } from 'react';
import type { SuccessionGroupementFoncierEntry, GroupementFoncierType } from '../successionDraft';
import { ScNumericInput } from './ScNumericInput';
import { ScSelect } from './ScSelect';
import '../Succession.css';

const SEUIL_EXONERATION = 600_000;

const TYPE_OPTIONS: { value: GroupementFoncierType; label: string }[] = [
  { value: 'GFA', label: 'GFA (Groupement Foncier Agricole)' },
  { value: 'GFV', label: 'GFV (Groupement Foncier Viticole)' },
  { value: 'GFF', label: 'GFF (Groupement Foncier Forestier)' },
  { value: 'GF', label: 'GF (Groupement Forestier)' },
];

const OWNER_OPTIONS: { value: 'epoux1' | 'epoux2'; label: string }[] = [
  { value: 'epoux1', label: 'Époux 1' },
  { value: 'epoux2', label: 'Époux 2' },
];

function computeExoneration(valeur: number): { exonere: number; taxable: number } {
  if (valeur <= 0) return { exonere: 0, taxable: 0 };
  if (valeur <= SEUIL_EXONERATION) {
    const exonere = Math.round(valeur * 0.75);
    return { exonere, taxable: valeur - exonere };
  }
  const exonereTranche1 = Math.round(SEUIL_EXONERATION * 0.75);
  const exonereTranche2 = Math.round((valeur - SEUIL_EXONERATION) * 0.50);
  const exonere = exonereTranche1 + exonereTranche2;
  return { exonere, taxable: valeur - exonere };
}

interface GroupementFoncierModalProps {
  entries: SuccessionGroupementFoncierEntry[];
  ownerOptions: { value: 'epoux1' | 'epoux2'; label: string }[];
  onClose: () => void;
  onValidate: (_entries: SuccessionGroupementFoncierEntry[]) => void;
}

export function GroupementFoncierModal({
  entries: initialEntries,
  ownerOptions,
  onClose,
  onValidate,
}: GroupementFoncierModalProps) {
  const [draft, setDraft] = useState<SuccessionGroupementFoncierEntry[]>(
    initialEntries.length > 0 ? initialEntries.map((e) => ({ ...e })) : [],
  );

  const partyOptions = ownerOptions.length > 0 ? ownerOptions : OWNER_OPTIONS;

  const addEntry = () => {
    setDraft((prev) => [...prev, {
      id: `gf-${Date.now()}`,
      type: 'GFA' as GroupementFoncierType,
      valeurTotale: 0,
      owner: partyOptions[0].value,
    }]);
  };

  const updateEntry = (id: string, field: keyof SuccessionGroupementFoncierEntry, value: string | number) => {
    setDraft((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEntry = (id: string) => {
    setDraft((prev) => prev.filter((e) => e.id !== id));
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <div className="sc-modal-overlay" onClick={() => {}}>
      <div className="sc-modal sc-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal__header">
          <h3 className="sc-modal__title">Groupements fonciers (art. 793 bis CGI)</h3>
          <button type="button" className="sc-member-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="sc-modal__body">
          <p className="sc-hint" style={{ marginBottom: 16 }}>
            Les parts de GFA/GFV/GFF/GF bénéficient d&apos;une exonération de 75% des DMTG
            jusqu&apos;à 600 000 € par bénéficiaire (LF 2025 art. 70), puis 50% au-delà.
          </p>

          {draft.length === 0 ? (
            <div className="vcm__empty">
              <p>Aucun groupement foncier déclaré.</p>
              <button type="button" className="sc-child-add-btn" onClick={addEntry}>
                + Ajouter un groupement
              </button>
            </div>
          ) : (
            <>
              {draft.map((entry) => {
                const { exonere, taxable } = computeExoneration(entry.valeurTotale);
                return (
                  <div key={entry.id} className="sc-asset-row" style={{ marginBottom: 16 }}>
                    <div className="sc-asset-row sc-asset-row--three-cols">
                      <div className="sc-field">
                        <label>Type</label>
                        <ScSelect
                          value={entry.type}
                          onChange={(v) => updateEntry(entry.id, 'type', v)}
                          options={TYPE_OPTIONS}
                        />
                      </div>
                      <div className="sc-field">
                        <label>Valeur totale (€)</label>
                        <ScNumericInput
                          value={entry.valeurTotale}
                          min={0}
                          onChange={(v) => updateEntry(entry.id, 'valeurTotale', v)}
                        />
                      </div>
                      <div className="sc-field">
                        <label>Masse de rattachement</label>
                        <ScSelect
                          value={entry.owner}
                          onChange={(v) => updateEntry(entry.id, 'owner', v)}
                          options={partyOptions}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-c9)', marginTop: 6 }}>
                      <span>Exonéré : {fmt(exonere)} €</span>
                      <span>Taxable : {fmt(taxable)} €</span>
                      <button type="button" className="sc-child-remove-btn" onClick={() => removeEntry(entry.id)} aria-label="Supprimer">✕</button>
                    </div>
                  </div>
                );
              })}
              <button type="button" className="sc-child-add-btn" onClick={addEntry} style={{ marginTop: 8 }}>
                + Ajouter un groupement
              </button>
            </>
          )}
        </div>

        <div className="sc-modal__footer">
          <button type="button" className="sc-modal__btn sc-modal__btn--secondary" onClick={onClose}>Annuler</button>
          <button type="button" className="sc-modal__btn sc-modal__btn--primary" onClick={() => onValidate(draft)}>Valider</button>
        </div>
      </div>
    </div>
  );
}
