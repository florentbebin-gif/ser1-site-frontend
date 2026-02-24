/**
 * BaseContrat  Référentiel contrats (pivot hybride — PR5)
 *
 * Page /settings/base-contrat.
 * Catalogue hardcodé (domain/base-contrat/catalog.ts) + overrides Supabase.
 * Règles fiscales hardcodées (domain/base-contrat/rules/).
 * UI read-only : seule action admin = clôturer / rouvrir un produit avec date.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import { CATALOG } from '@/domain/base-contrat/catalog';
import type { CatalogProduct } from '@/domain/base-contrat/catalog';
import { isProductClosed } from '@/domain/base-contrat/overrides';
import type { BaseContratOverride, OverrideMap } from '@/domain/base-contrat/overrides';
import { getRules, hasSocleRules } from '@/domain/base-contrat/rules/index';
import type { ProductRules, RuleBlock, Audience } from '@/domain/base-contrat/rules/index';
import {
  getBaseContratOverrides,
  upsertBaseContratOverride,
} from '@/utils/baseContratOverridesCache';
import { GRANDE_FAMILLE_OPTIONS, PHASE_LABELS } from '@/constants/baseContratLabels';

// ─────────────────────────────────────────────────────────────
// Hook: overrides
// ─────────────────────────────────────────────────────────────

function useOverrides() {
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    getBaseContratOverrides().then((data) => {
      setOverrides(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    getBaseContratOverrides().then((data) => {
      if (mounted) { setOverrides(data); setLoading(false); }
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return { overrides, loading, reload };
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function RuleBlockCard({ block }: { block: RuleBlock }) {
  return (
    <div style={{
      background: 'var(--color-c7)',
      border: '1px solid var(--color-c8)',
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-c10)', marginBottom: 6 }}>
        {block.title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {block.bullets.map((bullet, i) => (
          <li key={i} style={{ fontSize: 12, color: 'var(--color-c9)', marginBottom: 3, lineHeight: 1.5 }}>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaceholderCard() {
  return (
    <div style={{
      background: 'var(--color-c7)',
      border: '1px dashed var(--color-c8)',
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-c9)', fontStyle: 'italic' }}>
        Règles à compléter
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-c9)', marginTop: 4 }}>
        Les règles fiscales détaillées seront disponibles dans une prochaine mise à jour.
      </div>
    </div>
  );
}

function PhaseColumn({
  phaseKey,
  blocks,
  isPlaceholder,
}: {
  phaseKey: 'constitution' | 'sortie' | 'deces';
  blocks: RuleBlock[];
  isPlaceholder: boolean;
}) {
  const colorMap: Record<typeof phaseKey, string> = {
    constitution: 'var(--color-c3)',
    sortie: 'var(--color-c2)',
    deces: 'var(--color-c1)',
  };

  return (
    <div style={{ flex: '1 1 0', minWidth: 180 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: colorMap[phaseKey],
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: `2px solid ${colorMap[phaseKey]}`,
      }}>
        {PHASE_LABELS[phaseKey]}
      </div>
      {isPlaceholder
        ? <PlaceholderCard />
        : blocks.map((block, i) => <RuleBlockCard key={i} block={block} />)
      }
    </div>
  );
}

function RulesPanel({ rules, closed }: { rules: ProductRules; closed: boolean }) {
  return (
    <div style={{
      padding: '14px 20px 16px',
      borderTop: '1px solid var(--color-c8)',
      opacity: closed ? 0.55 : 1,
    }}>
      <div style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {(['constitution', 'sortie', 'deces'] as const).map((pk) => (
          <PhaseColumn
            key={pk}
            phaseKey={pk}
            blocks={rules[pk]}
            isPlaceholder={!!rules.isPlaceholder}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal: Clôturer / Rouvrir
// ─────────────────────────────────────────────────────────────

function OverrideModal({
  product,
  override,
  onClose,
  onSave,
}: {
  product: CatalogProduct;
  override: BaseContratOverride | undefined;
  onClose: () => void;
  onSave: (_o: Pick<BaseContratOverride, 'product_id' | 'closed_date' | 'note_admin'>) => void;
}) {
  const isClosed = override?.closed_date != null;
  const [closedDate, setClosedDate] = useState(override?.closed_date ?? '');
  const [note, setNote] = useState(override?.note_admin ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({
      product_id: product.id,
      closed_date: closedDate || null,
      note_admin: note.trim() || null,
    });
    setSaving(false);
  }

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="report-modal-header">
          <h3>{isClosed ? 'Rouvrir' : 'Clôturer'} — {product.label}</h3>
          <button className="report-modal-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="report-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Date de clôture <span style={{ fontWeight: 400, color: 'var(--color-c9)' }}>(laisser vide = produit ouvert)</span>
          </label>
          <input
            type="date"
            value={closedDate}
            onChange={(e) => setClosedDate(e.target.value)}
            style={{ fontFamily: 'inherit', fontSize: 13, padding: '3px 4px', border: '1px solid var(--color-c8)', borderRadius: 4, backgroundColor: '#fff' }}
          />
          <label style={{ fontSize: 13, fontWeight: 600 }}>Note admin <span style={{ fontWeight: 400, color: 'var(--color-c9)' }}>(optionnel)</span></label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ex : Dispositif supprimé par la loi de finances 2025"
            style={{ fontFamily: 'inherit', fontSize: 13, padding: '3px 4px', border: '1px solid var(--color-c8)', borderRadius: 4, backgroundColor: '#fff', resize: 'vertical' }}
          />
        </div>
        <div className="report-modal-actions">
          <button onClick={onClose}>Annuler</button>
          <button
            className="chip"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '8px 20px', fontWeight: 600 }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function BaseContrat() {
  const { isAdmin } = useUserRole();
  const { overrides, loading, reload } = useOverrides();

  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [openFamilyId, setOpenFamilyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFamille, setFilterFamille] = useState('');
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [togglePPPM, setTogglePPPM] = useState<Audience>('pp');
  const [overrideTarget, setOverrideTarget] = useState<CatalogProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const filteredCatalog = useMemo(() => {
    return CATALOG.filter((p) => {
      if (togglePPPM === 'pp' && !p.ppEligible) return false;
      if (togglePPPM === 'pm' && !p.pmEligible) return false;
      if (filterFamille && p.grandeFamille !== filterFamille) return false;
      if (filterIncomplete && hasSocleRules(p.id)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.label.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [togglePPPM, filterFamille, filterIncomplete, searchQuery]);

  const groupedByFamily = useMemo(() => {
    const map = new Map<string, CatalogProduct[]>();
    for (const gf of GRANDE_FAMILLE_OPTIONS) {
      const inGroup = filteredCatalog.filter((p) => p.grandeFamille === gf);
      if (inGroup.length > 0) map.set(gf, inGroup);
    }
    const unclassified = filteredCatalog.filter(
      (p) => !(GRANDE_FAMILLE_OPTIONS as readonly string[]).includes(p.grandeFamille),
    );
    if (unclassified.length > 0) map.set('Autres', unclassified);
    return map;
  }, [filteredCatalog]);

  const activeCount = useMemo(
    () => CATALOG.filter((p) => !isProductClosed(p.id, overrides, today)).length,
    [overrides, today],
  );
  const closedCount = CATALOG.length - activeCount;
  const incompleteCount = useMemo(
    () => CATALOG.filter((p) => !hasSocleRules(p.id)).length,
    [],
  );

  async function handleSaveOverride(
    data: Pick<BaseContratOverride, 'product_id' | 'closed_date' | 'note_admin'>,
  ) {
    try {
      await upsertBaseContratOverride(data);
      reload();
      setOverrideTarget(null);
    } catch (e) {
      setErrorMsg((e as Error).message ?? 'Erreur lors de la sauvegarde.');
    }
  }

  if (loading) return <p style={{ padding: 24, color: 'var(--color-c9)' }}>Chargement…</p>;

  return (
    <div style={{ marginTop: 16 }}>
      <UserInfoBanner />

      <div style={{ fontSize: 15, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ── */}
        <div className="settings-premium-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h2 className="settings-premium-title" style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--color-c10)' }}>
                Référentiel contrats
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-c9)' }}>
                {CATALOG.length} produits · {activeCount} ouverts · {closedCount} clôturés
                {incompleteCount > 0 && (
                  <span style={{ marginLeft: 8, color: 'var(--color-c1)', fontStyle: 'italic' }}>
                    · {incompleteCount} règles à compléter
                  </span>
                )}
              </p>
            </div>
            {/* Toggle PP / Entreprise */}
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-c8)' }}>
              {(['pp', 'pm'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTogglePPPM(v)}
                  style={{
                    padding: '7px 18px',
                    fontSize: 13,
                    fontWeight: togglePPPM === v ? 600 : 400,
                    background: togglePPPM === v ? 'var(--color-c3)' : 'transparent',
                    color: togglePPPM === v ? '#fff' : 'var(--color-c9)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {v === 'pp' ? 'Particulier' : 'Entreprise'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filtres ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit"
            style={{ fontFamily: 'inherit', flex: '1 1 200px', fontSize: 13, padding: '7px 12px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#fff' }}
          />
          <select
            value={filterFamille}
            onChange={(e) => setFilterFamille(e.target.value)}
            style={{ fontFamily: 'inherit', fontSize: 12, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', backgroundColor: '#fff' }}
          >
            <option value="">Toutes les familles</option>
            {GRANDE_FAMILLE_OPTIONS.map((gf) => <option key={gf} value={gf}>{gf}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-c9)', cursor: 'pointer', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', background: filterIncomplete ? 'var(--color-c6)' : 'transparent' }}>
            <input
              type="checkbox"
              checked={filterIncomplete}
              onChange={(e) => setFilterIncomplete(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Règles à compléter uniquement
          </label>
          {(searchQuery || filterFamille || filterIncomplete) && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setFilterFamille(''); setFilterIncomplete(false); }}
              style={{ fontSize: 12, padding: '7px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', background: 'none', color: 'var(--color-c9)', cursor: 'pointer' }}
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* ── Empty state ── */}
        {groupedByFamily.size === 0 && (
          <div className="settings-premium-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-c9)', fontSize: 14, margin: 0 }}>Aucun produit ne correspond aux filtres.</p>
          </div>
        )}

        {/* ── Groupes par famille ── */}
        {Array.from(groupedByFamily.entries()).map(([famille, familyProducts]) => {
          const isFamilyOpen = openFamilyId === famille;
          const closedInFamily = familyProducts.filter((p) => isProductClosed(p.id, overrides, today)).length;
          return (
            <div key={famille} className="settings-premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Family header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpenFamilyId(isFamilyOpen ? null : famille)}
                onKeyDown={(e) => e.key === 'Enter' && setOpenFamilyId(isFamilyOpen ? null : famille)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', cursor: 'pointer', background: 'var(--color-c7)', borderBottom: isFamilyOpen ? '1px solid var(--color-c8)' : 'none' }}
              >
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-c10)' }}>{famille}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--color-c8)', color: 'var(--color-c9)', fontWeight: 600 }}>
                  {familyProducts.length - closedInFamily} ouvert{familyProducts.length - closedInFamily !== 1 ? 's' : ''}
                </span>
                {closedInFamily > 0 && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--color-c6)', color: 'var(--color-c10)', fontWeight: 600 }}>
                    {closedInFamily} clôturé{closedInFamily > 1 ? 's' : ''}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--color-c9)' }}>{isFamilyOpen ? '▴' : '▾'}</span>
              </div>

              {isFamilyOpen && (
                <div style={{ padding: '4px 0' }}>
                  {familyProducts.map((product) => {
                    const isOpen = openProductId === product.id;
                    const closed = isProductClosed(product.id, overrides, today);
                    const override = overrides[product.id];
                    const rules = getRules(product.id, togglePPPM);

                    return (
                      <div key={product.id} style={{ borderTop: '1px solid var(--color-c8)' }}>
                        {/* Product header */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setOpenProductId(isOpen ? null : product.id)}
                          onKeyDown={(e) => e.key === 'Enter' && setOpenProductId(isOpen ? null : product.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
                            cursor: 'pointer', flexWrap: 'wrap',
                            opacity: closed ? 0.6 : 1,
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--color-c10)', fontSize: 14 }}>{product.label}</span>
                          {product.ppEligible && !product.pmEligible && (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--color-c8)', color: 'var(--color-c9)', fontWeight: 600 }}>PP</span>
                          )}
                          {product.pmEligible && !product.ppEligible && (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--color-c8)', color: 'var(--color-c9)', fontWeight: 600 }}>PM</span>
                          )}
                          {rules.isPlaceholder && (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--color-c6)', color: 'var(--color-c10)', fontStyle: 'italic' }}>
                              À compléter
                            </span>
                          )}
                          {closed && (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--color-c6)', color: 'var(--color-c10)', fontWeight: 600 }}>
                              Clôturé {override?.closed_date ? `le ${override.closed_date}` : ''}
                            </span>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setOverrideTarget(product); }}
                              style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--color-c8)', background: 'none', color: 'var(--color-c9)', cursor: 'pointer' }}
                            >
                              {closed ? 'Rouvrir' : 'Clôturer'}
                            </button>
                          )}
                          {!isAdmin && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-c9)' }}>{isOpen ? '▴' : '▾'}</span>}
                        </div>

                        {/* Product body — 3 colonnes règles fiscales */}
                        {isOpen && (
                          <>
                            {override?.note_admin && (
                              <p style={{ fontSize: 12, color: 'var(--color-c9)', fontStyle: 'italic', margin: '0 20px 0', padding: '8px 0 0' }}>
                                Note : {override.note_admin}
                              </p>
                            )}
                            <RulesPanel rules={rules} closed={closed} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Error */}
        {errorMsg && (
          <p style={{ fontSize: 13, color: 'var(--color-c1)', fontStyle: 'italic' }}>{errorMsg}</p>
        )}
      </div>

      {/* Modal: Clôturer / Rouvrir */}
      {overrideTarget && (
        <OverrideModal
          product={overrideTarget}
          override={overrides[overrideTarget.id]}
          onClose={() => setOverrideTarget(null)}
          onSave={handleSaveOverride}
        />
      )}
    </div>
  );
}
