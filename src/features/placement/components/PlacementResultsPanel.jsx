import React from 'react';
import { TimelineBar } from '@/components/TimelineBar.jsx';
import { shortEuro } from '../legacy/formatters.js';
import { useFiscalProfile } from '../hooks/useFiscalProfile.ts';
import { FiscalSummaryPanel } from './FiscalSummaryPanel.tsx';

export function PlacementResultsPanel({ loading, hydrated, results, state }) {
  const fiscalProfile1 = useFiscalProfile({
    envelope: state.products[0]?.envelope ?? 'AV',
    perBancaire: state.products[0]?.perBancaire ?? false,
  });
  const fiscalProfile2 = useFiscalProfile({
    envelope: state.products[1]?.envelope ?? 'AV',
    perBancaire: state.products[1]?.perBancaire ?? false,
  });
  const { produit1, produit2 } = results || { produit1: null, produit2: null };

  return (
    <div className="pl-ir-right">
      <div className="pl-ir-synthesis-card premium-card">
        <div className="pl-card-title premium-section-title">Synthèse comparative</div>

        {loading ? (
          <div className="pl-synthesis-placeholder">Chargement…</div>
        ) : !hydrated || !results ? (
          <div className="pl-synthesis-placeholder">Aucune simulation (recharger ou compléter Produit 1/2)</div>
        ) : !produit1 || !produit2 ? (
          <div className="pl-synthesis-placeholder">Sélectionne Produit 1 et Produit 2…</div>
        ) : (
          <>
            <TimelineBar
              ageActuel={state.client.ageActuel}
              ageDebutLiquidation={state.client.ageActuel + state.products[0].dureeEpargne}
              ageAuDeces={state.transmission.ageAuDeces}
            />

            <div style={{ borderTop: '1px solid var(--color-c6)', margin: '12px 0' }} />

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
                        <div className="pl-roi-compare__product-indicator" style={{ background: 'var(--color-c2)' }}></div>
                        <div className="pl-roi-compare__product">{produit1.envelopeLabel.replace('PER individuel déductible', 'PER individuel')}</div>
                        <div className="pl-roi-compare__ratio">× {roi1.toFixed(2)}</div>
                      </div>
                      <div className={`pl-roi-compare__card ${meilleurProduit === 2 ? 'is-winner' : ''}`}>
                        <div className="pl-roi-compare__product-indicator" style={{ background: 'var(--color-c4)' }}></div>
                        <div className="pl-roi-compare__product">{produit2.envelopeLabel.replace('PER individuel déductible', 'PER individuel')}</div>
                        <div className="pl-roi-compare__ratio">× {roi2.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pl-kpi-compare">
                    <div className="pl-kpi-compare__header-empty"></div>
                    <div className="pl-kpi-compare__header">
                      <div className="pl-kpi-compare__indicator" style={{ background: 'var(--color-c2)' }}>1</div>
                    </div>
                    <div className="pl-kpi-compare__header">
                      <div className="pl-kpi-compare__indicator" style={{ background: 'var(--color-c4)' }}>2</div>
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

                    <div className="pl-kpi-compare__separator"></div>
                    <div className="pl-kpi-compare__separator"></div>
                    <div className="pl-kpi-compare__separator"></div>

                    <div className="pl-kpi-compare__label pl-kpi-compare__label--total">Total récupéré</div>
                    <div className="pl-kpi-compare__value pl-kpi-compare__value--total">{shortEuro(totalGains1)}</div>
                    <div className="pl-kpi-compare__value pl-kpi-compare__value--total">{shortEuro(totalGains2)}</div>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>

      <FiscalSummaryPanel
        fiscalProfile1={fiscalProfile1}
        fiscalProfile2={fiscalProfile2}
      />
    </div>
  );
}
