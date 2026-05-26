import type { ReactNode } from 'react';
import { TimelineBar } from '@/components/TimelineBar';
import {
  SimDelta,
  SimKpiReference,
  SimMetric,
  SimSparkline,
  SimStatusBadge,
  SimTooltip,
} from '@/components/ui/sim';
import { CGP_GLOSSARY } from '@/constants/cgpGlossary';
import { IconBarChart } from '@/icons/ui';
import { shortEuro } from '../utils/formatters';
import type { PlacementSimulatorState } from '../utils/normalizers';
import type { PlacementUiResults } from '../utils/placementUiResults';

interface PlacementResultsPanelProps {
  loading: boolean;
  hydrated: boolean;
  results: PlacementUiResults | null;
  state: PlacementSimulatorState;
}

const EFFORT_TOTAL_LABEL = (
  <span title="Versements sur la période - économies d'impôt + revenus nets perçus sur la période">
    Effort total
  </span>
);

export function PlacementResultsPanel({
  loading,
  hydrated,
  results,
  state,
}: PlacementResultsPanelProps) {
  const compareEnabled = state.compareEnabled;
  const { produit1, produit2 } = results || { produit1: null, produit2: null };
  const cardModifier = !compareEnabled ? ' pl-synthesis-card--single' : '';

  return (
    <div
      className={`premium-card pl-synthesis-card sim-summary-card sim-summary-card--secondary${cardModifier}`}
      data-testid="placement-results-card"
    >
      <div className="pl-synthesis-title-row">
        <div className="sim-card__icon">
          <IconBarChart />
        </div>
        <h3 className="pl-summary-title">{compareEnabled ? 'Synthèse comparative' : 'Synthèse'}</h3>
      </div>

      {loading ? (
        <div className="pl-synthesis-placeholder">Chargement...</div>
      ) : !hydrated || !results ? (
        <div className="pl-synthesis-placeholder">
          {compareEnabled
            ? 'Aucune simulation (recharger ou compléter Produit 1/2)'
            : 'Aucune simulation (recharger ou compléter le placement)'}
        </div>
      ) : !produit1 || (compareEnabled && !produit2) ? (
        <div className="pl-synthesis-placeholder">
          {compareEnabled
            ? 'Sélectionnez Produit 1 et Produit 2...'
            : 'Sélectionnez un placement...'}
        </div>
      ) : (
        (() => {
          const produit1Draft = state.products[0];
          const produit2Draft = state.products[1];
          if (!produit1Draft || (compareEnabled && !produit2Draft)) {
            return <div className="pl-synthesis-placeholder">Sélectionnez un placement...</div>;
          }
          return (
            <>
              <TimelineBar
                ageActuel={state.client.ageActuel ?? 0}
                ageDebutLiquidation={(state.client.ageActuel ?? 0) + produit1Draft.dureeEpargne}
                ageAuDeces={state.transmission.ageAuDeces}
              />

              <div className="sim-divider sim-divider--soft" />

              {(() => {
                const totalGains1 =
                  produit1.totaux.revenusNetsLiquidation + produit1.totaux.capitalTransmisNet;
                const totalGains2 =
                  compareEnabled && produit2
                    ? produit2.totaux.revenusNetsLiquidation + produit2.totaux.capitalTransmisNet
                    : 0;
                const roi1 =
                  produit1.totaux.effortTotal > 0 ? totalGains1 / produit1.totaux.effortTotal : 0;
                const roi2 =
                  compareEnabled && produit2 && produit2.totaux.effortTotal > 0
                    ? totalGains2 / produit2.totaux.effortTotal
                    : 0;
                const meilleurProduit = compareEnabled
                  ? Math.abs(roi1 - roi2) > 0.0001
                    ? roi1 > roi2
                      ? 1
                      : 2
                    : null
                  : 1;

                return (
                  <>
                    <div
                      className={`pl-roi-compare${!compareEnabled ? ' pl-roi-compare--single' : ''}`}
                    >
                      <div className="pl-roi-compare__title">
                        <SimTooltip
                          label={CGP_GLOSSARY.roi.label}
                          description={CGP_GLOSSARY.roi.description}
                        />
                      </div>
                      <div className="pl-roi-compare__grid">
                        <div
                          className={`pl-roi-compare__card ${meilleurProduit === 1 ? 'is-winner' : ''}`}
                        >
                          <div className="pl-roi-compare__product-indicator pl-indicator--product1" />
                          <div className="pl-roi-compare__product">
                            {produit1Draft.perBancaire && produit1Draft.envelope === 'PER'
                              ? 'PER bancaire (CTO)'
                              : produit1.envelopeLabel
                                  .replace('PER individuel déductible', 'PER individuel')
                                  .replace('PER individuel deductible', 'PER individuel')}
                          </div>
                          <div className="pl-roi-compare__ratio">x {roi1.toFixed(2)}</div>
                          {meilleurProduit === 1 ? (
                            <SimStatusBadge variant="optimal">Meilleur ROI</SimStatusBadge>
                          ) : null}
                        </div>

                        {compareEnabled && produit2 && (
                          <div
                            className={`pl-roi-compare__card ${meilleurProduit === 2 ? 'is-winner' : ''}`}
                          >
                            <div className="pl-roi-compare__product-indicator pl-indicator--product2" />
                            <div className="pl-roi-compare__product">
                              {produit2Draft?.perBancaire && produit2Draft.envelope === 'PER'
                                ? 'PER bancaire (CTO)'
                                : produit2.envelopeLabel
                                    .replace('PER individuel déductible', 'PER individuel')
                                    .replace('PER individuel deductible', 'PER individuel')}
                            </div>
                            <div className="pl-roi-compare__ratio">x {roi2.toFixed(2)}</div>
                            {meilleurProduit === 2 ? (
                              <SimStatusBadge variant="optimal">Meilleur ROI</SimStatusBadge>
                            ) : null}
                          </div>
                        )}
                      </div>
                      {compareEnabled && produit2 ? (
                        <div className="pl-roi-compare__delta">
                          <span>Écart ROI</span>
                          <SimDelta value={roi1 - roi2} precision={2} unit="x" />
                        </div>
                      ) : null}
                    </div>

                    {compareEnabled && produit2 ? (
                      <div className="pl-kpi-compare">
                        <KpiCompareMetric
                          side="left"
                          label={EFFORT_TOTAL_LABEL}
                          value={shortEuro(produit1.totaux.effortTotal)}
                        />
                        <KpiCompareMetric
                          side="right"
                          label="Effort total"
                          value={shortEuro(produit2.totaux.effortTotal)}
                        />

                        <KpiCompareMetric
                          side="left"
                          label="Capital acquis"
                          value={shortEuro(produit1.epargne.capitalAcquis)}
                        />
                        <KpiCompareMetric
                          side="right"
                          label="Capital acquis"
                          value={shortEuro(produit2.epargne.capitalAcquis)}
                        />

                        <KpiCompareMetric
                          side="left"
                          label="Revenus nets"
                          value={shortEuro(produit1.totaux.revenusNetsLiquidation)}
                        />
                        <KpiCompareMetric
                          side="right"
                          label="Revenus nets"
                          value={shortEuro(produit2.totaux.revenusNetsLiquidation)}
                        />

                        <KpiCompareMetric
                          side="left"
                          label="Transmis net"
                          value={shortEuro(produit1.totaux.capitalTransmisNet)}
                        />
                        <KpiCompareMetric
                          side="right"
                          label="Transmis net"
                          value={shortEuro(produit2.totaux.capitalTransmisNet)}
                        />

                        <div className="pl-kpi-compare__separator" />

                        <KpiCompareMetric
                          side="left"
                          label="Total récupéré"
                          value={shortEuro(totalGains1)}
                          total
                        />
                        <KpiCompareMetric
                          side="right"
                          label="Total récupéré"
                          value={shortEuro(totalGains2)}
                          total
                        />
                      </div>
                    ) : (
                      <div className="pl-kpi-compare pl-kpi-compare--single">
                        <KpiSingleMetric
                          label={EFFORT_TOTAL_LABEL}
                          value={shortEuro(produit1.totaux.effortTotal)}
                        />
                        <KpiSingleMetric
                          label="Capital acquis"
                          value={shortEuro(produit1.epargne.capitalAcquis)}
                        />
                        <KpiSingleMetric
                          label="Revenus nets"
                          value={shortEuro(produit1.totaux.revenusNetsLiquidation)}
                        />
                        <KpiSingleMetric
                          label="Transmis net"
                          value={shortEuro(produit1.totaux.capitalTransmisNet)}
                        />

                        <div className="pl-kpi-compare__separator" />

                        <KpiSingleMetric
                          label="Total récupéré"
                          value={shortEuro(totalGains1)}
                          total
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          );
        })()
      )}
    </div>
  );
}

function KpiCompareMetric({
  side,
  label,
  value,
  total = false,
}: {
  side: 'left' | 'right';
  label: ReactNode;
  value: string;
  total?: boolean;
}) {
  return (
    <SimMetric
      variant="inline"
      label={label}
      value={value}
      className={`pl-kpi-metric pl-kpi-metric--${side}${total ? ' pl-kpi-metric--total' : ''}`}
      note={total ? <PlacementKpiReference /> : undefined}
    />
  );
}

function KpiSingleMetric({
  label,
  value,
  total = false,
}: {
  label: ReactNode;
  value: string;
  total?: boolean;
}) {
  return (
    <SimMetric
      variant="inline"
      label={label}
      value={value}
      className={`pl-kpi-metric pl-kpi-metric--single${total ? ' pl-kpi-metric--total' : ''}`}
      note={total ? <PlacementKpiReference /> : undefined}
    />
  );
}

function PlacementKpiReference() {
  return (
    <span className="sim-kpi-note">
      <SimSparkline />
      <SimKpiReference kind="pfu" />
    </span>
  );
}
