/**
 * BaseContrat - Referentiel contrats.
 *
 * Page /settings/base-contrat.
 * Catalogue hardcode (domain/base-contrat/catalog.ts) + overrides Supabase.
 * Regles fiscales lues via domain/base-contrat/rules/.
 * UI read-only : seule action admin = cloturer / rouvrir un produit avec date.
 */

import { useEffect, useMemo, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import './styles/base-contrat.css';
import { CATALOG } from '@/domain/base-contrat/catalog';
import type { CatalogProduct } from '@/domain/base-contrat/catalog';
import { isProductClosed } from '@/domain/base-contrat/overrides';
import type { BaseContratOverride, OverrideMap } from '@/domain/base-contrat/overrides';
import { getRules } from '@/domain/base-contrat/rules/index';
import type { Audience, ProductRules, RuleBlock } from '@/domain/base-contrat/rules/index';
import {
  getBaseContratOverrides,
  upsertBaseContratOverride,
} from '@/utils/cache/baseContratOverridesCache';
import { GRANDE_FAMILLE_OPTIONS, PHASE_LABELS } from './baseContratLabels';

function useOverrides() {
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    getBaseContratOverrides()
      .then((data) => {
        setOverrides(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;

    getBaseContratOverrides()
      .then((data) => {
        if (!mounted) return;
        setOverrides(data);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { overrides, loading, reload };
}

function RuleBlockCard({ block }: { block: RuleBlock }) {
  return (
    <div className="base-contrat-rule-card">
      <div className="base-contrat-rule-card__title">{block.title}</div>
      <ul className="base-contrat-rule-card__list">
        {block.bullets.map((bullet, index) => (
          <li key={index}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}

function EmptyRuleCard() {
  return (
    <div className="base-contrat-empty-card">
      <div className="base-contrat-empty-card__title">Aucune règle renseignée</div>
      <div className="base-contrat-empty-card__body">
        Ce produit ne possède pas de règles fiscales spécifiques pour cette phase.
      </div>
    </div>
  );
}

function PhaseColumn({
  phaseKey,
  blocks,
}: {
  phaseKey: 'constitution' | 'sortie' | 'deces';
  blocks: RuleBlock[];
}) {
  return (
    <div className="base-contrat-phase">
      <div className={`base-contrat-phase__title base-contrat-phase__title--${phaseKey}`}>
        {PHASE_LABELS[phaseKey]}
      </div>
      {blocks.length === 0
        ? <EmptyRuleCard />
        : blocks.map((block, index) => <RuleBlockCard key={index} block={block} />)}
    </div>
  );
}

function RulesPanel({ rules, closed }: { rules: ProductRules; closed: boolean }) {
  return (
    <div className={`base-contrat-rules${closed ? ' base-contrat-rules--closed' : ''}`}>
      <div className="base-contrat-rules__grid">
        {(['constitution', 'sortie', 'deces'] as const).map((phaseKey) => (
          <PhaseColumn key={phaseKey} phaseKey={phaseKey} blocks={rules[phaseKey]} />
        ))}
      </div>
    </div>
  );
}

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
    <div className="report-modal-overlay">
      <div className="report-modal base-contrat-modal">
        <div className="report-modal-header">
          <h3>{isClosed ? 'Rouvrir' : 'Clôturer'} - {product.label}</h3>
          <button className="report-modal-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="report-modal-content base-contrat-modal__content">
          <label className="base-contrat-modal__label">
            Date de clôture <span>(laisser vide = produit ouvert)</span>
          </label>
          <input
            className="base-contrat-modal__field"
            type="date"
            value={closedDate}
            onChange={(event) => setClosedDate(event.target.value)}
          />
          <label className="base-contrat-modal__label">
            Note admin <span>(optionnel)</span>
          </label>
          <textarea
            className="base-contrat-modal__field base-contrat-modal__field--textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Ex : dispositif supprimé par la loi de finances 2025"
          />
        </div>
        <div className="report-modal-actions">
          <button onClick={onClose}>Annuler</button>
          <button
            className="chip"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatOpenCount(count: number): string {
  return `${count} ouvert${count > 1 ? 's' : ''}`;
}

function formatClosedCount(count: number): string {
  return `${count} clôturé${count > 1 ? 's' : ''}`;
}

export default function BaseContrat() {
  const { isAdmin } = useUserRole();
  const { overrides, loading, reload } = useOverrides();

  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [openFamilyId, setOpenFamilyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFamille, setFilterFamille] = useState('');
  const [togglePPPM, setTogglePPPM] = useState<Audience>('pp');
  const [overrideTarget, setOverrideTarget] = useState<CatalogProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const filteredCatalog = useMemo(() => {
    return CATALOG.filter((product) => {
      if (togglePPPM === 'pp' && !product.ppEligible) return false;
      if (togglePPPM === 'pm' && !product.pmEligible) return false;
      if (filterFamille && product.grandeFamille !== filterFamille) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!product.label.toLowerCase().includes(query)) return false;
      }

      return true;
    });
  }, [filterFamille, searchQuery, togglePPPM]);

  const groupedByFamily = useMemo(() => {
    const map = new Map<string, CatalogProduct[]>();

    for (const grandeFamille of GRANDE_FAMILLE_OPTIONS) {
      const products = filteredCatalog.filter((product) => product.grandeFamille === grandeFamille);
      if (products.length > 0) {
        map.set(grandeFamille, products);
      }
    }

    const unclassified = filteredCatalog.filter(
      (product) => !(GRANDE_FAMILLE_OPTIONS as readonly string[]).includes(product.grandeFamille),
    );
    if (unclassified.length > 0) {
      map.set('Autres', unclassified);
    }

    return map;
  }, [filteredCatalog]);

  const activeCount = useMemo(
    () => CATALOG.filter((product) => !isProductClosed(product.id, overrides, today)).length,
    [overrides, today],
  );
  const closedCount = CATALOG.length - activeCount;

  async function handleSaveOverride(
    data: Pick<BaseContratOverride, 'product_id' | 'closed_date' | 'note_admin'>,
  ) {
    try {
      await upsertBaseContratOverride(data);
      reload();
      setOverrideTarget(null);
    } catch (error) {
      setErrorMsg((error as Error).message ?? 'Erreur lors de la sauvegarde.');
    }
  }

  if (loading) {
    return <p className="base-contrat-loading">Chargement…</p>;
  }

  return (
    <div className="base-contrat-page">
      <UserInfoBanner />

      <div className="base-contrat-stack">
        <section className="settings-premium-card base-contrat-header-card">
          <div className="base-contrat-header">
            <div className="base-contrat-header__copy">
              <h2 className="settings-premium-title">Référentiel contrats</h2>
              <p className="settings-premium-subtitle">
                {CATALOG.length} produits - {activeCount} ouverts - {closedCount} clôturés
              </p>
            </div>

            <div className="base-contrat-toggle" role="tablist" aria-label="Audience">
              {(['pp', 'pm'] as const).map((audience) => (
                <button
                  key={audience}
                  type="button"
                  className={`base-contrat-toggle__button${togglePPPM === audience ? ' is-active' : ''}`}
                  onClick={() => setTogglePPPM(audience)}
                >
                  {audience === 'pp' ? 'Particulier' : 'Entreprise'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="base-contrat-filters">
          <input
            className="base-contrat-filters__field"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher un produit"
          />
          <select
            className="base-contrat-filters__field"
            value={filterFamille}
            onChange={(event) => setFilterFamille(event.target.value)}
          >
            <option value="">Toutes les familles</option>
            {GRANDE_FAMILLE_OPTIONS.map((grandeFamille) => (
              <option key={grandeFamille} value={grandeFamille}>
                {grandeFamille}
              </option>
            ))}
          </select>
          {(searchQuery || filterFamille) && (
            <button
              type="button"
              className="base-contrat-filters__reset"
              onClick={() => {
                setSearchQuery('');
                setFilterFamille('');
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>

        {groupedByFamily.size === 0 && (
          <div className="settings-premium-card base-contrat-empty-state">
            Aucun produit ne correspond aux filtres.
          </div>
        )}

        <div className="fisc-accordion">
          {Array.from(groupedByFamily.entries()).map(([famille, familyProducts]) => {
            const isFamilyOpen = openFamilyId === famille;
            const closedInFamily = familyProducts.filter((product) => isProductClosed(product.id, overrides, today)).length;
            const openInFamily = familyProducts.length - closedInFamily;

            return (
              <div key={famille} className="fisc-acc-item base-contrat-family">
                <button
                  type="button"
                  className="fisc-acc-header base-contrat-family__header"
                  onClick={() => setOpenFamilyId(isFamilyOpen ? null : famille)}
                >
                  <span className="base-contrat-family__title">{famille}</span>
                  <span className="base-contrat-family__badges">
                    <span className="base-contrat-badge">{formatOpenCount(openInFamily)}</span>
                    {closedInFamily > 0 && (
                      <span className="base-contrat-badge base-contrat-badge--muted">
                        {formatClosedCount(closedInFamily)}
                      </span>
                    )}
                  </span>
                  <span className="fisc-acc-chevron">{isFamilyOpen ? 'v' : '>'}</span>
                </button>

                {isFamilyOpen && (
                  <div className="base-contrat-family__body">
                    {familyProducts.map((product) => {
                      const isProductOpen = openProductId === product.id;
                      const closed = isProductClosed(product.id, overrides, today);
                      const override = overrides[product.id];
                      const rules = getRules(product.id, togglePPPM);
                      const hasNoRules =
                        rules.constitution.length === 0
                        && rules.sortie.length === 0
                        && rules.deces.length === 0;

                      return (
                        <div key={product.id} className="base-contrat-product">
                          <div
                            role="button"
                            tabIndex={0}
                            className={`base-contrat-product__header${closed ? ' is-closed' : ''}`}
                            onClick={() => setOpenProductId(isProductOpen ? null : product.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setOpenProductId(isProductOpen ? null : product.id);
                              }
                            }}
                          >
                            <span className="base-contrat-product__header-main">
                              <span className="base-contrat-product__label">{product.label}</span>
                              {hasNoRules && (
                                <span className="base-contrat-badge base-contrat-badge--muted">
                                  Aucune règle
                                </span>
                              )}
                              {closed && (
                                <span className="base-contrat-badge base-contrat-badge--warning">
                                  Clôturé {override?.closed_date ? `le ${override.closed_date}` : ''}
                                </span>
                              )}
                            </span>

                            <span className="base-contrat-product__header-actions">
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="base-contrat-admin-action"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOverrideTarget(product);
                                  }}
                                >
                                  {closed ? 'Rouvrir' : 'Clôturer'}
                                </button>
                              )}
                              <span className="fisc-acc-chevron">{isProductOpen ? 'v' : '>'}</span>
                            </span>
                          </div>

                          {isProductOpen && (
                            <div className="base-contrat-product__body">
                              {override?.note_admin && (
                                <p className="base-contrat-note">Note : {override.note_admin}</p>
                              )}
                              <RulesPanel rules={rules} closed={closed} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="settings-feedback-message settings-feedback-message--error">
            {errorMsg}
          </div>
        )}
      </div>

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
