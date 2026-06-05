/**
 * BaseContrat - Référentiel contrats.
 *
 * Page /settings/base-contrat.
 * Catalogue hardcode (domain/base-contrat/catalog.ts) + overrides Supabase.
 * Règles fiscales lues via domain/base-contrat/rules/.
 * UI read-only : seule action admin = clôturer / rouvrir un produit avec date.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { UserInfoBanner } from '@/components/UserInfoBanner';
import SettingsTitleWithIcon, {
  type SettingsTitleIconName,
} from '@/components/settings/SettingsTitleWithIcon';
import { SimSegmentedControl } from '@/components/ui/sim';
import '@/styles/sim/segmented.css';
import './styles/base-contrat.css';
import { CATALOG } from '@/domain/base-contrat/catalog';
import type { CatalogProduct } from '@/domain/base-contrat/catalog';
import {
  BASE_CONTRAT_REVIEW_STATUS_LABELS,
  isProductClosed,
} from '@/domain/base-contrat/overrides';
import type { BaseContratOverrideInput, OverrideMap } from '@/domain/base-contrat/overrides';
import { buildBaseContratFiscalLabels, getRules } from '@/domain/base-contrat/rules/index';
import type {
  Audience,
  Confidence,
  ProductRules,
  RuleBlock,
  RuleRenderContext,
} from '@/domain/base-contrat/rules/index';
import {
  getBaseContratOverrides,
  upsertBaseContratOverride,
} from '@/utils/cache/baseContratOverridesCache';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { GRANDE_FAMILLE_OPTIONS, PHASE_LABELS } from './baseContratLabels';
import { OverrideModal, ReviewStatusDetails } from './BaseContratOverrideControls';

function useOverrides() {
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const reload = () => {
    setLoading(true);
    getBaseContratOverrides()
      .then((data) => {
        if (!mountedRef.current) return;
        setOverrides(data);
        setLoading(false);
      })
      .catch(() => {
        if (mountedRef.current) setLoading(false);
      });
  };

  useEffect(() => {
    mountedRef.current = true;

    getBaseContratOverrides()
      .then((data) => {
        if (!mountedRef.current) return;
        setOverrides(data);
        setLoading(false);
      })
      .catch(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { overrides, loading, reload };
}

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  elevee: 'Vérifié',
  moyenne: 'À vérifier',
  faible: 'Non vérifié',
};

function RuleBlockCard({ block, showAdminMeta }: { block: RuleBlock; showAdminMeta: boolean }) {
  return (
    <div className="settings-reference-rule-card">
      <div className="settings-reference-rule-card__title">{block.title}</div>
      <ul className="settings-reference-rule-card__list">
        {block.bullets.map((bullet, index) => (
          <li key={index}>{bullet}</li>
        ))}
      </ul>
      {showAdminMeta && (
        <div className="settings-reference-rule-meta" aria-label="Métadonnées admin">
          <span
            className={`settings-reference-confidence settings-reference-confidence--${block.confidence}`}
          >
            {CONFIDENCE_LABELS[block.confidence]}
          </span>
          {block.dependencies && block.dependencies.length > 0 && (
            <div className="settings-reference-rule-meta__group">
              <span className="settings-reference-rule-meta__label">Dépendances</span>
              <ul className="settings-reference-rule-meta__list">
                {block.dependencies.map((dependency) => (
                  <li key={dependency}>{dependency}</li>
                ))}
              </ul>
            </div>
          )}
          {block.sources && block.sources.length > 0 && (
            <div className="settings-reference-rule-meta__group">
              <span className="settings-reference-rule-meta__label">Sources</span>
              <ul className="settings-reference-rule-meta__list">
                {block.sources.map((source) => (
                  <li key={`${source.label}-${source.url}`}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyRuleCard() {
  return (
    <div className="settings-reference-empty-card">
      <div className="settings-reference-empty-card__title">Aucune règle renseignée</div>
      <div className="settings-reference-empty-card__body">
        Ce produit ne possède pas de règles fiscales spécifiques pour cette phase.
      </div>
    </div>
  );
}

function PhaseColumn({
  phaseKey,
  blocks,
  showAdminMeta,
}: {
  phaseKey: 'constitution' | 'sortie' | 'deces';
  blocks: RuleBlock[];
  showAdminMeta: boolean;
}) {
  return (
    <div className="settings-reference-phase">
      <div
        className={`settings-reference-phase__title settings-reference-phase__title--${phaseKey}`}
      >
        {PHASE_LABELS[phaseKey]}
      </div>
      {blocks.length === 0 ? (
        <EmptyRuleCard />
      ) : (
        blocks.map((block, index) => (
          <RuleBlockCard key={index} block={block} showAdminMeta={showAdminMeta} />
        ))
      )}
    </div>
  );
}

function RulesPanel({
  rules,
  closed,
  showAdminMeta,
}: {
  rules: ProductRules;
  closed: boolean;
  showAdminMeta: boolean;
}) {
  return (
    <div className={`settings-reference-rules${closed ? ' settings-reference-rules--closed' : ''}`}>
      <div className="settings-reference-rules__grid">
        {(['constitution', 'sortie', 'deces'] as const).map((phaseKey) => (
          <PhaseColumn
            key={phaseKey}
            phaseKey={phaseKey}
            blocks={rules[phaseKey]}
            showAdminMeta={showAdminMeta}
          />
        ))}
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

const FAMILY_ICON_BY_NAME: Record<string, SettingsTitleIconName> = {
  'Épargne Assurance': 'shield',
  'Assurance prévoyance': 'umbrella',
  'Épargne bancaire': 'wallet',
  'Valeurs mobilières': 'trending-up',
  'Immobilier direct': 'home',
  'Immobilier indirect': 'layers',
  'Non coté/PE': 'briefcase',
  'Créances/Droits': 'file-signature',
  'Dispositifs fiscaux immobilier': 'map-pin',
  'Retraite & épargne salariale': 'calendar-clock',
  Autres: 'sparkles',
};

function getFamilyIcon(famille: string): SettingsTitleIconName {
  return FAMILY_ICON_BY_NAME[famille] ?? 'sparkles';
}

export default function BaseContrat() {
  const { isAdmin } = useUserRole();
  const { fiscalContext } = useFiscalContext();
  const { overrides, loading, reload } = useOverrides();

  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [openFamilyId, setOpenFamilyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFamille, setFilterFamille] = useState('');
  const [togglePPPM, setTogglePPPM] = useState<Audience>('pp');
  const [overrideTarget, setOverrideTarget] = useState<CatalogProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const ruleRenderContext = useMemo<RuleRenderContext>(
    () => ({
      fiscalLabels: buildBaseContratFiscalLabels(fiscalContext),
    }),
    [fiscalContext],
  );

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

  async function handleSaveOverride(data: BaseContratOverrideInput) {
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

      <div className="settings-stack settings-stack--spacious">
        <section className="settings-premium-card base-contrat-header-card">
          <div className="settings-reference-header">
            <div className="settings-reference-header__copy">
              <h2 className="settings-premium-title">
                <SettingsTitleWithIcon icon="book">Référentiel contrats</SettingsTitleWithIcon>
              </h2>
              <p className="settings-premium-subtitle">
                {CATALOG.length} produits - {activeCount} ouverts - {closedCount} clôturés
              </p>
            </div>

            <SimSegmentedControl<Audience>
              value={togglePPPM}
              onChange={setTogglePPPM}
              ariaLabel="Audience"
              options={[
                { value: 'pp', label: 'Particulier' },
                { value: 'pm', label: 'Entreprise' },
              ]}
            />
          </div>
        </section>

        <div className="settings-reference-filters">
          <input
            className="settings-reference-field"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher un produit"
          />
          <select
            className="settings-reference-field"
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
              className="settings-reference-reset"
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
            const closedInFamily = familyProducts.filter((product) =>
              isProductClosed(product.id, overrides, today),
            ).length;
            const openInFamily = familyProducts.length - closedInFamily;

            return (
              <div key={famille} className="fisc-acc-item base-contrat-family">
                <button
                  type="button"
                  className="fisc-acc-header fisc-acc-header--with-icon base-contrat-family__header"
                  onClick={() => setOpenFamilyId(isFamilyOpen ? null : famille)}
                >
                  <SettingsTitleWithIcon
                    icon={getFamilyIcon(famille)}
                    className="settings-premium-title settings-premium-title--flush base-contrat-family__title"
                  >
                    {famille}
                  </SettingsTitleWithIcon>
                  <span className="settings-reference-badges">
                    <span className="settings-reference-badge">
                      {formatOpenCount(openInFamily)}
                    </span>
                    {closedInFamily > 0 && (
                      <span className="settings-reference-badge settings-reference-badge--muted">
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
                      const reviewStatus = override?.review_status ?? 'ok';
                      const rules = getRules(product.id, togglePPPM, ruleRenderContext);
                      const hasNoRules =
                        rules.constitution.length === 0 &&
                        rules.sortie.length === 0 &&
                        rules.deces.length === 0;

                      return (
                        <div key={product.id} className="base-contrat-product">
                          <div
                            className={`base-contrat-product__header${closed ? ' is-closed' : ''}`}
                          >
                            <button
                              type="button"
                              className="base-contrat-product__toggle"
                              onClick={() => setOpenProductId(isProductOpen ? null : product.id)}
                            >
                              <span className="base-contrat-product__header-main">
                                <span className="base-contrat-product__label">{product.label}</span>
                                {hasNoRules && (
                                  <span className="settings-reference-badge settings-reference-badge--muted">
                                    Aucune règle
                                  </span>
                                )}
                                {closed && (
                                  <span className="settings-reference-badge settings-reference-badge--warning">
                                    Clôturé{' '}
                                    {override?.closed_date ? `le ${override.closed_date}` : ''}
                                  </span>
                                )}
                                {isAdmin && override && reviewStatus !== 'ok' && (
                                  <span
                                    className={`settings-reference-badge settings-reference-badge--review settings-reference-badge--review-${reviewStatus}`}
                                  >
                                    {BASE_CONTRAT_REVIEW_STATUS_LABELS[reviewStatus]}
                                  </span>
                                )}
                              </span>
                              <span className="fisc-acc-chevron">{isProductOpen ? 'v' : '>'}</span>
                            </button>
                            <span className="settings-reference-admin-actions base-contrat-product__header-actions">
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="settings-reference-admin-action"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOverrideTarget(product);
                                  }}
                                >
                                  {closed ? 'Rouvrir' : 'Clôturer'}
                                </button>
                              )}
                            </span>
                          </div>

                          {isProductOpen && (
                            <div className="base-contrat-product__body">
                              {override?.note_admin && (
                                <p className="base-contrat-note">Note : {override.note_admin}</p>
                              )}
                              {isAdmin && override && <ReviewStatusDetails override={override} />}
                              <RulesPanel rules={rules} closed={closed} showAdminMeta={isAdmin} />
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
