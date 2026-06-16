/**
 * BaseContratSettingsPanel - catalogue produits & enveloppes réglementés.
 *
 * Panneau de la partie « Produits & enveloppes réglementés » de /settings/memento.
 * Catalogue hardcode (domain/base-contrat/catalog.ts) + overrides Supabase.
 * Règles fiscales lues via domain/base-contrat/rules/.
 * UI de lecture : seules actions admin = valeurs de référence et clôture/réouverture.
 * Le filtre mot-clé est piloté par la barre de recherche globale du mémento (prop `searchQuery`).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import SettingsTitleWithIcon, {
  type SettingsTitleIconName,
} from '@/components/settings/SettingsTitleWithIcon';
import { SimSegmentedControl } from '@/components/ui/sim';
import '@/styles/sim/segmented.css';
import '../styles/base-contrat.css';
import { CATALOG } from '@/domain/base-contrat/catalog';
import type { CatalogProduct } from '@/domain/base-contrat/catalog';
import {
  BASE_CONTRAT_REVIEW_STATUS_LABELS,
  isProductClosed,
} from '@/domain/base-contrat/overrides';
import type { BaseContratOverrideInput, OverrideMap } from '@/domain/base-contrat/overrides';
import { buildBaseContratFiscalLabels, getRules } from '@/domain/base-contrat/rules/index';
import type { Audience, ProductRules, RuleRenderContext } from '@/domain/base-contrat/rules/index';
import { getReferenceValuesForProduct } from '@/domain/settings-memento/referenceValues';
import type { MementoReferenceValue } from '@/domain/settings-memento/referenceValues';
import { normalizeMementoSearch, textMatches } from '../memento/mementoSearch';
import {
  getBaseContratOverrides,
  upsertBaseContratOverride,
} from '@/utils/cache/baseContratOverridesCache';
import { useMementoReferenceValues } from '@/hooks/settings/useMementoReferenceValues';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { GRANDE_FAMILLE_OPTIONS } from '../baseContratLabels';
import { OverrideModal, ReviewStatusDetails } from '../BaseContratOverrideControls';
import BaseContratRulesPanel from './BaseContratRulesPanel';

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

const REFERENCE_VALUES_SAVE_TARGET_ID = 'reference-values:chiffres-cles';

function getFamilyIcon(famille: string): SettingsTitleIconName {
  return FAMILY_ICON_BY_NAME[famille] ?? 'sparkles';
}

/**
 * Texte recherchable d'un produit pour le filtre mot-clé global : libellé, famille, règles par
 * phase (titres, puces, tags, sources) et chiffres clés associés. Permet de retrouver un produit
 * via un terme contenu dans une règle ou une valeur de référence (plafond, PFU, usufruit, source…).
 */
function buildBaseContratSearchText(
  product: CatalogProduct,
  rules: ProductRules,
  referenceValues: readonly MementoReferenceValue[],
): string {
  const ruleText = (['constitution', 'sortie', 'deces'] as const).flatMap((phase) =>
    rules[phase].flatMap((block) => [
      block.title,
      ...block.bullets,
      ...(block.tags ?? []),
      ...(block.sources ?? []).map((source) => source.label),
    ]),
  );
  const referenceText = referenceValues.flatMap((value) => [
    value.label,
    value.note ?? '',
    value.value_text ?? '',
    value.value_numeric === null ? '' : String(value.value_numeric),
    String(value.year),
  ]);
  return [product.label, product.grandeFamille, ...ruleText, ...referenceText].join(' ');
}

interface BaseContratSettingsPanelProps {
  searchQuery?: string;
}

export default function BaseContratSettingsPanel({
  searchQuery = '',
}: BaseContratSettingsPanelProps = {}) {
  const { isAdmin } = useUserRole();
  const { fiscalContext } = useFiscalContext();
  const { overrides, loading, reload } = useOverrides();
  const {
    rows: referenceRows,
    error: referenceValuesError,
    handleNumericChange: handleReferenceNumericChange,
    handleTextChange: handleReferenceTextChange,
  } = useMementoReferenceValues(isAdmin, {
    domain: 'chiffres-cles',
    saveTargetId: REFERENCE_VALUES_SAVE_TARGET_ID,
    saveTargetLabel: 'Valeurs de référence',
  });

  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [openFamilyId, setOpenFamilyId] = useState<string | null>(null);
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

  const normalizedQuery = normalizeMementoSearch(searchQuery);
  const hasSearch = normalizedQuery.length > 0;

  const filteredCatalog = useMemo(() => {
    return CATALOG.filter((product) => {
      if (togglePPPM === 'pp' && !product.ppEligible) return false;
      if (togglePPPM === 'pm' && !product.pmEligible) return false;
      if (!hasSearch) return true;

      const rules = getRules(product.id, togglePPPM, ruleRenderContext);
      const referenceValues = getReferenceValuesForProduct(referenceRows, product.id);
      return textMatches(
        buildBaseContratSearchText(product, rules, referenceValues),
        normalizedQuery,
      );
    });
  }, [hasSearch, normalizedQuery, referenceRows, ruleRenderContext, togglePPPM]);

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
      <div className="settings-stack settings-stack--spacious">
        <section
          className="settings-premium-card base-contrat-header-card"
          aria-label="Produits et enveloppes réglementés"
        >
          <div className="settings-reference-header">
            <p className="settings-premium-subtitle base-contrat-header-card__meta">
              {CATALOG.length} produits - {activeCount} ouverts - {closedCount} clôturés
            </p>

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

        {groupedByFamily.size === 0 && (
          <div className="settings-premium-card base-contrat-empty-state">
            {hasSearch
              ? 'Aucun produit ne correspond à la recherche.'
              : 'Aucun produit disponible.'}
          </div>
        )}

        <div className="fisc-accordion">
          {Array.from(groupedByFamily.entries()).map(([famille, familyProducts]) => {
            const isFamilyOpen = hasSearch || openFamilyId === famille;
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
                      const isProductOpen = hasSearch || openProductId === product.id;
                      const closed = isProductClosed(product.id, overrides, today);
                      const override = overrides[product.id];
                      const reviewStatus = override?.review_status ?? 'ok';
                      const rules = getRules(product.id, togglePPPM, ruleRenderContext);
                      const productReferenceValues = getReferenceValuesForProduct(
                        referenceRows,
                        product.id,
                      );
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
                              {isAdmin && override?.note_admin && (
                                <p className="base-contrat-note">Note : {override.note_admin}</p>
                              )}
                              {isAdmin && override && <ReviewStatusDetails override={override} />}
                              <BaseContratRulesPanel
                                rules={rules}
                                closed={closed}
                                showAdminMeta={isAdmin}
                                referenceValues={productReferenceValues}
                                referenceValuesError={referenceValuesError}
                                onReferenceNumericChange={handleReferenceNumericChange}
                                onReferenceTextChange={handleReferenceTextChange}
                              />
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
