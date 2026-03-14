import { TimelineBar } from '@/components/TimelineBar';
import type { CompareResult } from '@/engine/placement/types';
import { shortEuro } from '../utils/formatters';
import type { PlacementSimulatorState } from '../utils/normalizers';

interface PlacementResultsPanelProps {
  loading: boolean;
  hydrated: boolean;
  results: CompareResult | null;
  state: PlacementSimulatorState;
}

function BarChartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

export function PlacementResultsPanel({
  loading,
  hydrated,
  results,
  state,
}: PlacementResultsPanelProps) {
  const { produit1, produit2 } = results || { produit1: null, produit2: null };

  return (
    <div className="pl-ir-right">
      <div className="premium-card pl-synthesis-card" data-testid="placement-results-card">
        <div className="pl-synthesis-title-row">
          <div className="pl-section-icon-wrapper">
            <BarChartIcon />
          </div>
          <h3 className="pl-summary-title">Synthèse comparative</h3>
        </div>

        {loading ? (
          <div className="pl-synthesis-placeholder">Chargement...</div>
        ) : !hydrated || !results ? (
          <div className="pl-synthesis-placeholder">
            Aucune simulation (recharger ou compléter Produit 1/2)
          </div>
        ) : !produit1 || !produit2 ? (
          <div className="pl-synthesis-placeholder">Sélectionnez Produit 1 et Produit 2...</div>
        ) : (
          <>
            <TimelineBar
              ageActuel={state.client.ageActuel}
              ageDebutLiquidation={state.client.ageActuel + state.products[0].dureeEpargne}
              ageAuDeces={state.transmission.ageAuDeces}
            />

            <div className="pl-card-divider" />

            {(() => {
              const totalGains1 = produit1.totaux.revenusNetsLiquidation + produit1.totaux.capitalTransmisNet;
              const totalGains2 = produit2.totaux.revenusNetsLiquidation + produit2.totaux.capitalTransmisNet;
              const roi1 = produit1.totaux.effortReel > 0 ? totalGains1 / produit1.totaux.effortReel : 0;
              const roi2 = produit2.totaux.effortReel > 0 ? totalGains2 / produit2.totaux.effortReel : 0;
              const meilleurProduit = roi1 > roi2 ? 1 : 2;

              return (
                <>
                  <div className="pl-roi-compare">
                    <div className="pl-roi-compare__title">ROI</div>
                    <div className="pl-roi-compare__grid">
                      <div className={`pl-roi-compare__card ${meilleurProduit === 1 ? 'is-winner' : ''}`}>
                        <div className="pl-roi-compare__product-indicator pl-indicator--product1" />
                        <div className="pl-roi-compare__product">
                          {produit1.envelopeLabel
                            .replace('PER individuel déductible', 'PER individuel')
                            .replace('PER individuel deductible', 'PER individuel')}
                        </div>
                        <div className="pl-roi-compare__ratio">x {roi1.toFixed(2)}</div>
                      </div>

                      <div className={`pl-roi-compare__card ${meilleurProduit === 2 ? 'is-winner' : ''}`}>
                        <div className="pl-roi-compare__product-indicator pl-indicator--product2" />
                        <div className="pl-roi-compare__product">
                          {produit2.envelopeLabel
                            .replace('PER individuel déductible', 'PER individuel')
                            .replace('PER individuel deductible', 'PER individuel')}
                        </div>
                        <div className="pl-roi-compare__ratio">x {roi2.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pl-kpi-compare">
                    <div className="pl-kpi-compare__header-empty" />
                    <div className="pl-kpi-compare__header">
                      <div className="pl-kpi-compare__indicator pl-indicator--product1">1</div>
                    </div>
                    <div className="pl-kpi-compare__header">
                      <div className="pl-kpi-compare__indicator pl-indicator--product2">2</div>
                    </div>

                    <div className="pl-kpi-compare__label">Effort total</div>
                    <div className="pl-kpi-compare__value">{shortEuro(produit1.totaux.effortReel)}</div>
                    <div className="pl-kpi-compare__value">{shortEuro(produit2.totaux.effortReel)}</div>

                    <div className="pl-kpi-compare__label">Capital acquis</div>
                    <div className="pl-kpi-compare__value">{shortEuro(produit1.epargne.capitalAcquis)}</div>
                    <div className="pl-kpi-compare__value">{shortEuro(produit2.epargne.capitalAcquis)}</div>

                    <div className="pl-kpi-compare__label">Revenus nets</div>
                    <div className="pl-kpi-compare__value">{shortEuro(produit1.totaux.revenusNetsLiquidation)}</div>
                    <div className="pl-kpi-compare__value">{shortEuro(produit2.totaux.revenusNetsLiquidation)}</div>

                    <div className="pl-kpi-compare__label">Transmis net</div>
                    <div className="pl-kpi-compare__value">{shortEuro(produit1.totaux.capitalTransmisNet)}</div>
                    <div className="pl-kpi-compare__value">{shortEuro(produit2.totaux.capitalTransmisNet)}</div>

                    <div className="pl-kpi-compare__separator" />
                    <div className="pl-kpi-compare__separator" />
                    <div className="pl-kpi-compare__separator" />

                    <div className="pl-kpi-compare__label pl-kpi-compare__label--total">Total récupéré</div>
                    <div className="pl-kpi-compare__value pl-kpi-compare__value--total">
                      {shortEuro(totalGains1)}
                    </div>
                    <div className="pl-kpi-compare__value pl-kpi-compare__value--total">
                      {shortEuro(totalGains2)}
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
