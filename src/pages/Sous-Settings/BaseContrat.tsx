/**
 * BaseContrat — Référentiel contrats V3
 *
 * Page /settings/base-contrat.
 * Remplace ProductCatalog.tsx (conservé intact pour rollback).
 *
 * Layout: accordion par produit → 3 colonnes (constitution / sortie / décès).
 * Versioning: rulesets[] trié effectiveDate DESC. rulesets[0] = éditable.
 */

import React, { useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { useBaseContratSettings } from '@/hooks/useBaseContratSettings';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import {
  PHASE_LABELS,
  HOLDERS_LABELS,
  CONFIDENCE_LABELS,
  CONFIDENCE_ICONS,
  ACTION_LABELS,
  FORM_LABELS,
  MISC_LABELS,
  FAMILY_OPTIONS,
} from '@/constants/baseContratLabels';
import type {
  BaseContratProduct,
  BaseContratSettings,
  VersionedRuleset,
  Phase,
  Block,
  FieldDef,
  Holders,
  ProductFamily,
} from '@/types/baseContratSettings';
import { EMPTY_PRODUCT, EMPTY_RULESET } from '@/types/baseContratSettings';
import { buildTemplateRuleset, TEMPLATE_KEYS, TEMPLATE_LABELS } from '@/constants/baseContratTemplates';
import type { TemplateKey } from '@/constants/baseContratTemplates';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const PHASE_KEYS = ['constitution', 'sortie', 'deces'] as const;

const HOLDERS_OPTIONS: Holders[] = ['PP', 'PM', 'PP+PM'];

function chipStyle(bg: string, fg: string): React.CSSProperties {
  return { fontSize: 11, padding: '2px 8px', borderRadius: 4, background: bg, color: fg, fontWeight: 600, lineHeight: '18px' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Field renderer
// ─────────────────────────────────────────────────────────────────────────────

function FieldRenderer({
  fieldKey,
  def,
  disabled,
  onChange,
}: {
  fieldKey: string;
  def: FieldDef;
  disabled: boolean;
  onChange: (_key: string, _value: unknown) => void;
}) {
  const isRef = def.type === 'ref';
  const label = fieldKey;

  if (def.type === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <input
          type="checkbox"
          checked={!!def.value}
          disabled={disabled || isRef}
          onChange={(e) => onChange(fieldKey, e.target.checked)}
        />
        <span style={{ fontSize: 13, color: 'var(--color-c10)' }}>{label}</span>
        {def.calc && <span style={chipStyle('var(--color-c3)', '#FFFFFF')}>{MISC_LABELS.calcBadge}</span>}
        {isRef && <span title={MISC_LABELS.refTooltip} style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic', cursor: 'help' }}>↗ ref</span>}
      </div>
    );
  }

  if (def.type === 'enum' && def.options) {
    return (
      <div style={{ marginBottom: 6 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>
          {label} {def.calc && <span style={chipStyle('var(--color-c3)', '#FFFFFF')}>{MISC_LABELS.calcBadge}</span>}
        </label>
        <select
          value={String(def.value ?? '')}
          disabled={disabled}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          style={{ fontSize: 13, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
        >
          {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (def.type === 'brackets' && Array.isArray(def.value)) {
    return (
      <div style={{ marginBottom: 6 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 4 }}>
          {label} {def.calc && <span style={chipStyle('var(--color-c3)', '#FFFFFF')}>{MISC_LABELS.calcBadge}</span>}
        </label>
        <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--color-c8)' }}>Jusqu&apos;à</th>
              <th style={{ textAlign: 'right', padding: '4px 8px', borderBottom: '1px solid var(--color-c8)' }}>Taux %</th>
            </tr>
          </thead>
          <tbody>
            {(def.value as Array<{ upTo: number | null; ratePercent: number }>).map((row, i) => (
              <tr key={i}>
                <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--color-c8)' }}>
                  {row.upTo === null ? '∞' : row.upTo.toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'right', borderBottom: '1px solid var(--color-c8)' }}>
                  <input
                    type="number"
                    value={row.ratePercent}
                    disabled={disabled}
                    step="0.01"
                    onChange={(e) => {
                      const updated = [...(def.value as Array<{ upTo: number | null; ratePercent: number }>)];
                      updated[i] = { ...updated[i], ratePercent: Number(e.target.value) };
                      onChange(fieldKey, updated);
                    }}
                    style={{ width: 70, textAlign: 'right', fontSize: 12, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Default: number / string / ref
  const displayValue = isRef ? String(def.value ?? '') : (def.value ?? '');
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--color-c9)', marginBottom: 2 }}>
        {label}
        {def.unit && <span style={{ marginLeft: 4, fontSize: 11 }}>({def.unit})</span>}
        {def.calc && <span style={{ ...chipStyle('var(--color-c3)', '#FFFFFF'), marginLeft: 4 }}>{MISC_LABELS.calcBadge}</span>}
        {isRef && <span title={MISC_LABELS.refTooltip} style={{ marginLeft: 4, fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic', cursor: 'help' }}>↗ ref</span>}
      </label>
      <input
        type={def.type === 'number' ? 'number' : 'text'}
        value={String(displayValue)}
        disabled={disabled || isRef}
        step={def.type === 'number' ? '0.01' : undefined}
        onChange={(e) => onChange(fieldKey, def.type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: isRef ? 'var(--color-c8)' : '#FFFFFF', fontStyle: isRef ? 'italic' : 'normal' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase column
// ─────────────────────────────────────────────────────────────────────────────

function PhaseColumn({
  phaseKey,
  phase,
  disabled,
  onFieldChange,
}: {
  phaseKey: string;
  phase: Phase;
  disabled: boolean;
  onFieldChange: (_blockId: string, _fieldKey: string, _value: unknown) => void;
}) {
  if (!phase.applicable) {
    return (
      <div style={{ flex: 1, minWidth: 240 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-c10)', marginBottom: 8 }}>{PHASE_LABELS[phaseKey]}</h4>
        <span style={chipStyle('var(--color-c8)', 'var(--color-c9)')}>{MISC_LABELS.phaseNotApplicable}</span>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-c10)', marginBottom: 8 }}>{PHASE_LABELS[phaseKey]}</h4>
      {phase.blocks.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--color-c9)', fontStyle: 'italic' }}>{MISC_LABELS.noBlocks}</p>
      ) : (
        phase.blocks.map((block) => (
          <div
            key={block.blockId}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-c8)',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-c10)', marginBottom: 6 }}>
              {block.uiTitle}
              {block.audience !== 'all' && (
                <span style={{ ...chipStyle('var(--color-c8)', 'var(--color-c9)'), marginLeft: 6 }}>{block.audience}</span>
              )}
            </div>
            {Object.entries(block.payload).map(([fKey, fDef]) => (
              <FieldRenderer
                key={fKey}
                fieldKey={fKey}
                def={fDef}
                disabled={disabled}
                onChange={(k, v) => onFieldChange(block.blockId, k, v)}
              />
            ))}
            {block.notes && (
              <p style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic', margin: '6px 0 0' }}>
                {block.notes}
              </p>
            )}
            {block.dependencies && block.dependencies.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--color-c9)', margin: '4px 0 0' }}>
                Conditions : {block.dependencies.join(' · ')}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function BaseContrat() {
  const { isAdmin } = useUserRole();
  const { settings, loading, saving, message, save, setSettings, setMessage } =
    useBaseContratSettings();

  // UI state
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BaseContratProduct | null>(null);
  const [closingProduct, setClosingProduct] = useState<BaseContratProduct | null>(null);
  const [newVersionProduct, setNewVersionProduct] = useState<BaseContratProduct | null>(null);

  // Add/Edit form state
  const [formId, setFormId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formFamily, setFormFamily] = useState<ProductFamily>('Autres');
  const [formHolders, setFormHolders] = useState<Holders>('PP');
  const [formEnvelope, setFormEnvelope] = useState('');
  const [formTemplate, setFormTemplate] = useState('');
  const [newVersionDate, setNewVersionDate] = useState('');

  if (loading) return <p>Chargement…</p>;
  if (!settings) return <p>Aucune donnée.</p>;

  const products = settings.products ?? [];
  const activeProducts = products.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const closedProducts = products.filter((p) => !p.isActive);

  // ─── Mutations (local state, persisted on Save) ───

  function updateSettings(fn: (_prev: BaseContratSettings) => BaseContratSettings) {
    setSettings((prev) => (prev ? fn(prev) : prev));
    setMessage('');
  }

  function handleFieldChange(productId: string, rulesetIdx: number, blockId: string, fieldKey: string, value: unknown) {
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          rulesets: p.rulesets.map((rs, ri) => {
            if (ri !== rulesetIdx) return rs;
            return {
              ...rs,
              phases: PHASE_KEYS.reduce((acc, pk) => {
                const phase = rs.phases[pk];
                acc[pk] = {
                  ...phase,
                  blocks: phase.blocks.map((b: Block) => {
                    if (b.blockId !== blockId) return b;
                    return {
                      ...b,
                      payload: {
                        ...b.payload,
                        [fieldKey]: { ...b.payload[fieldKey], value },
                      },
                    };
                  }),
                };
                return acc;
              }, { ...rs.phases } as VersionedRuleset['phases']),
            };
          }),
        };
      }),
    }));
  }

  function handleAddProduct() {
    if (!formId || !formLabel) return;
    const exists = products.some((p) => p.id === formId);
    if (exists) { setMessage('Erreur : cet identifiant existe déjà.'); return; }
    const maxSort = products.reduce((m, p) => Math.max(m, p.sortOrder), 0);
    const today = new Date().toISOString().slice(0, 10);
    const initialRuleset = formTemplate && TEMPLATE_KEYS.includes(formTemplate as TemplateKey)
      ? buildTemplateRuleset(formTemplate as TemplateKey, today)
      : { ...EMPTY_RULESET, effectiveDate: today };
    const newProduct: BaseContratProduct = {
      ...EMPTY_PRODUCT,
      id: formId,
      label: formLabel,
      family: formFamily,
      holders: formHolders,
      envelopeType: formEnvelope || formId,
      templateKey: formTemplate || null,
      sortOrder: maxSort + 1,
      rulesets: [initialRuleset],
    };
    updateSettings((prev) => ({ ...prev, products: [...prev.products, newProduct] }));
    setShowAddModal(false);
    resetForm();
  }

  function handleEditProduct() {
    if (!editingProduct) return;
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === editingProduct.id
          ? { ...p, label: formLabel, family: formFamily, holders: formHolders }
          : p,
      ),
    }));
    setEditingProduct(null);
    resetForm();
  }

  function handleCloseProduct() {
    if (!closingProduct) return;
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === closingProduct.id
          ? { ...p, isActive: false, closedDate: new Date().toISOString().slice(0, 10) }
          : p,
      ),
    }));
    setClosingProduct(null);
  }

  function handleNewVersion() {
    if (!newVersionProduct || !newVersionDate) return;
    updateSettings((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== newVersionProduct.id) return p;
        const copied: VersionedRuleset = JSON.parse(JSON.stringify(p.rulesets[0] ?? EMPTY_RULESET));
        copied.effectiveDate = newVersionDate;
        return { ...p, rulesets: [copied, ...p.rulesets] };
      }),
    }));
    setSelectedVersionIdx((prev) => ({ ...prev, [newVersionProduct.id]: 0 }));
    setNewVersionProduct(null);
    setNewVersionDate('');
  }

  async function handleSave() {
    if (!isAdmin || !settings) return;
    await save(settings);
  }

  function resetForm() {
    setFormId('');
    setFormLabel('');
    setFormFamily('Autres');
    setFormHolders('PP');
    setFormEnvelope('');
    setFormTemplate('');
  }

  function openEditModal(p: BaseContratProduct) {
    setFormLabel(p.label);
    setFormFamily(p.family);
    setFormHolders(p.holders);
    setEditingProduct(p);
  }

  // ─── Render ───

  return (
    <div style={{ marginTop: 16 }}>
      <UserInfoBanner />

      <div style={{ fontSize: 15, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div className="settings-premium-card" style={{ padding: '20px 24px' }}>
          <h2 className="settings-premium-title" style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--color-c10)' }}>
            Référentiel contrats
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-c9)' }}>
            Catalogue des produits d&apos;investissement et de leurs règles fiscales par phase (constitution, sortie, décès).
          </p>
        </div>

        {/* CTA Add */}
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="chip" onClick={() => { resetForm(); setShowAddModal(true); }} style={{ padding: '8px 20px', fontWeight: 600 }}>
              + {ACTION_LABELS.addProduct}
            </button>
          </div>
        )}

        {/* Empty state */}
        {activeProducts.length === 0 && (
          <div className="settings-premium-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-c9)', fontSize: 14, margin: 0 }}>
              {isAdmin ? MISC_LABELS.noProductsAdmin : MISC_LABELS.noProducts}
            </p>
          </div>
        )}

        {/* Product accordions */}
        {activeProducts.map((product) => {
          const isOpen = openProductId === product.id;
          const vIdx = selectedVersionIdx[product.id] ?? 0;
          const ruleset = product.rulesets[vIdx];
          const isEditableVersion = vIdx === 0;

          return (
            <div key={product.id} className="settings-premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Accordion header */}
              <div
                onClick={() => setOpenProductId(isOpen ? null : product.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', cursor: 'pointer', flexWrap: 'wrap' }}
              >
                <span style={chipStyle('var(--color-c3)', '#FFFFFF')}>{product.holders}</span>
                <span style={chipStyle('var(--color-c8)', 'var(--color-c10)')}>{product.family}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-c10)', fontSize: 15 }}>{product.label}</span>
                <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>({product.id})</span>
                {ruleset && (
                  <span style={{ fontSize: 11, color: 'var(--color-c9)', fontStyle: 'italic' }}>
                    {MISC_LABELS.activeVersion} : {ruleset.effectiveDate}
                  </span>
                )}
                <span style={chipStyle(
                  product.confidenceLevel === 'confirmed' ? 'var(--color-c3)' : 'var(--color-c8)',
                  product.confidenceLevel === 'confirmed' ? '#FFFFFF' : 'var(--color-c10)',
                )}>
                  {CONFIDENCE_ICONS[product.confidenceLevel]} {CONFIDENCE_LABELS[product.confidenceLevel]}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--color-c9)' }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {/* Accordion body */}
              {isOpen && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-c8)' }}>
                  {/* Admin bar + version selector */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12, marginBottom: 16 }}>
                    {/* Version selector */}
                    {product.rulesets.length > 1 && (
                      <select
                        value={vIdx}
                        onChange={(e) => setSelectedVersionIdx((prev) => ({ ...prev, [product.id]: Number(e.target.value) }))}
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#FFFFFF' }}
                      >
                        {product.rulesets.map((rs, i) => (
                          <option key={i} value={i}>
                            {rs.effectiveDate}{i === 0 ? ' (active)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>{MISC_LABELS.versionCount(product.rulesets.length)}</span>

                    {isAdmin && (
                      <>
                        <button className="chip" onClick={() => openEditModal(product)} style={{ padding: '4px 12px', fontSize: 12 }}>{ACTION_LABELS.editProduct}</button>
                        <button className="chip" onClick={() => { setNewVersionProduct(product); setNewVersionDate(''); }} style={{ padding: '4px 12px', fontSize: 12 }}>{ACTION_LABELS.newVersion}</button>
                        <button className="chip" onClick={() => setClosingProduct(product)} style={{ padding: '4px 12px', fontSize: 12 }}>{ACTION_LABELS.closeProduct}</button>
                      </>
                    )}
                  </div>

                  {/* 3-column phases */}
                  {ruleset ? (
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      {PHASE_KEYS.map((pk) => (
                        <PhaseColumn
                          key={pk}
                          phaseKey={pk}
                          phase={ruleset.phases[pk]}
                          disabled={!isAdmin || !isEditableVersion}
                          onFieldChange={(blockId, fieldKey, value) =>
                            handleFieldChange(product.id, vIdx, blockId, fieldKey, value)
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--color-c9)', fontStyle: 'italic' }}>Aucune version définie.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Closed products */}
        {closedProducts.length > 0 && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--color-c9)', fontWeight: 600 }}>
              {MISC_LABELS.closedProducts} ({closedProducts.length})
            </summary>
            {closedProducts.map((p) => (
              <div key={p.id} style={{ padding: '8px 0', fontSize: 13, color: 'var(--color-c9)' }}>
                {p.label} ({p.id}) — clôturé le {p.closedDate}
              </div>
            ))}
          </details>
        )}

        {/* Save */}
        {isAdmin && (
          <button
            type="button"
            className="chip"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 28px', fontWeight: 600, alignSelf: 'flex-end' }}
          >
            {saving ? ACTION_LABELS.saving : ACTION_LABELS.save}
          </button>
        )}

        {/* Message */}
        {message && (
          <p style={{ fontSize: 13, color: 'var(--color-c9)', fontStyle: 'italic' }}>{message}</p>
        )}
      </div>

      {/* ──── Modal: Ajouter un produit ──── */}
      {showAddModal && (
        <div className="report-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.addProduct}</h3>
              <button className="report-modal-close" onClick={() => setShowAddModal(false)}>&#x2715;</button>
            </div>
            <div className="report-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productId} *</label>
              <input value={formId} onChange={(e) => setFormId(e.target.value)} placeholder="ex : assuranceVie" style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }} />
              <span style={{ fontSize: 11, color: 'var(--color-c9)' }}>{FORM_LABELS.productIdHint}</span>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productLabel} *</label>
              <input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Assurance-vie" style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }} />

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productFamily}</label>
              <select value={formFamily} onChange={(e) => setFormFamily(e.target.value as ProductFamily)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                {FAMILY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productHolders}</label>
              <select value={formHolders} onChange={(e) => setFormHolders(e.target.value as Holders)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                {HOLDERS_OPTIONS.map((h) => <option key={h} value={h}>{HOLDERS_LABELS[h]}</option>)}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.templateKey}</label>
              <select value={formTemplate} onChange={(e) => setFormTemplate(e.target.value)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                <option value="">{FORM_LABELS.templateNone}</option>
                {TEMPLATE_KEYS.map((k) => <option key={k} value={k}>{TEMPLATE_LABELS[k]}</option>)}
              </select>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setShowAddModal(false)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleAddProduct} disabled={!formId || !formLabel} style={{ padding: '8px 20px', fontWeight: 600 }}>
                {ACTION_LABELS.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Modifier ──── */}
      {editingProduct && (
        <div className="report-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.editProduct} — {editingProduct.label}</h3>
              <button className="report-modal-close" onClick={() => setEditingProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productLabel}</label>
              <input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }} />

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productFamily}</label>
              <select value={formFamily} onChange={(e) => setFormFamily(e.target.value as ProductFamily)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                {FAMILY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600 }}>{FORM_LABELS.productHolders}</label>
              <select value={formHolders} onChange={(e) => setFormHolders(e.target.value as Holders)} style={{ fontSize: 13, padding: '8px 10px', border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}>
                {HOLDERS_OPTIONS.map((h) => <option key={h} value={h}>{HOLDERS_LABELS[h]}</option>)}
              </select>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setEditingProduct(null)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleEditProduct} style={{ padding: '8px 20px', fontWeight: 600 }}>{ACTION_LABELS.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Nouvelle version ──── */}
      {newVersionProduct && (
        <div className="report-modal-overlay" onClick={() => setNewVersionProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.newVersion} — {newVersionProduct.label}</h3>
              <button className="report-modal-close" onClick={() => setNewVersionProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <p style={{ fontSize: 13, color: 'var(--color-c9)', margin: '0 0 12px' }}>{FORM_LABELS.effectiveDateHint}</p>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>{FORM_LABELS.effectiveDate} *</label>
              <input
                type="date"
                value={newVersionDate}
                onChange={(e) => setNewVersionDate(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-c8)', borderRadius: 6, backgroundColor: '#FFFFFF' }}
              />
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setNewVersionProduct(null)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleNewVersion} disabled={!newVersionDate} style={{ padding: '8px 20px', fontWeight: 600 }}>
                {ACTION_LABELS.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Modal: Clôturer ──── */}
      {closingProduct && (
        <div className="report-modal-overlay" onClick={() => setClosingProduct(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="report-modal-header">
              <h3>{ACTION_LABELS.closeProduct} — {closingProduct.label}</h3>
              <button className="report-modal-close" onClick={() => setClosingProduct(null)}>&#x2715;</button>
            </div>
            <div className="report-modal-content">
              <p style={{ fontSize: 13, color: 'var(--color-c9)' }}>{FORM_LABELS.confirmClose}</p>
            </div>
            <div className="report-modal-actions">
              <button onClick={() => setClosingProduct(null)}>{ACTION_LABELS.cancel}</button>
              <button className="chip" onClick={handleCloseProduct} style={{ padding: '8px 20px', fontWeight: 600 }}>{ACTION_LABELS.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
