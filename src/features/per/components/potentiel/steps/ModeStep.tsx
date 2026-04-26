/**
 * ModeStep - Step 1: choose the user goal and the document strategy.
 */

import React from 'react';
import type { PerHistoricalBasis } from '../../../../../engine/per';
import type { PerMode } from '../../../hooks/usePerPotentiel';
import type { PerWorkflowYears } from '../../../utils/perWorkflowYears';

interface ModeStepProps {
  mode: PerMode | null;
  historicalBasis: PerHistoricalBasis | null;
  needsCurrentYearEstimate: boolean;
  years: PerWorkflowYears;
  onSelectMode: (_mode: PerMode) => void;
  onSelectHistoricalBasis: (_basis: PerHistoricalBasis) => void;
  onSetNeedsCurrentYearEstimate: (_value: boolean) => void;
  simplifiedMode?: boolean;
}

export default function ModeStep({
  mode,
  historicalBasis,
  needsCurrentYearEstimate,
  years,
  onSelectMode,
  onSelectHistoricalBasis,
  onSetNeedsCurrentYearEstimate,
  simplifiedMode = false,
}: ModeStepProps): React.ReactElement {
  const modes: { id: PerMode; title: string; desc: string; marker: string }[] = [
    {
      id: 'versement-n',
      title: 'Contrôle du potentiel avant versement',
      desc: 'Vérifiez si un versement PER reste déductible et quel gain fiscal il peut générer',
      marker: 'Versement N',
    },
    {
      id: 'declaration-n1',
      title: 'Reporter dans la déclaration 2042',
      desc: `Visualisez comment reporter des versements ${years.previousTaxYear} dans la déclaration ${years.currentTaxYear} (sur les revenus ${years.previousIncomeYear})`,
      marker: 'Déclaration N-1',
    },
  ];

  if (simplifiedMode) {
    return (
      <div className="per-step per-step--mode">
        <div className="premium-card sim-card--guide per-mode-step-card">
          <div className="per-mode-step-header sim-card__header--bleed">
            <div className="sim-card__title-row">
              <div className="sim-card__icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="sim-card__title">Parcours simplifié</h3>
            </div>
          </div>
          <div className="sim-divider" />

          <div className="per-mode-grid">
            <div className="per-mode-card per-mode-card--selected per-mode-card--locked" aria-disabled="true">
              <span className="per-mode-card-marker">Versement N</span>
              <h4 className="per-mode-card-title">Contrôle du potentiel avant versement</h4>
              <p className="per-mode-card-desc">
                Parcours préselectionné à partir de l&apos;avis IR {years.currentTaxYear},
                sans projection de l&apos;année en cours.
              </p>
            </div>
          </div>
        </div>

        <div className="premium-card sim-card--guide per-mode-support-card">
          <div className="per-mode-docs-header sim-card__header--bleed">
            <div className="sim-card__title-row">
              <div className="sim-card__icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="sim-card__title">Documents nécessaires</h3>
            </div>
            <p className="per-mode-docs-subtitle">Base documentaire verrouillée en mode simplifié</p>
          </div>
          <div className="sim-divider" />

          <div className="per-mode-panel-stack">
            <div className="per-mode-panel-block">
              <div className="per-mode-doc-grid">
                <div className="per-mode-doc-card is-selected per-mode-doc-card--locked" aria-disabled="true">
                  <span className="per-mode-doc-title">
                    Avis IR {years.currentTaxYear} disponible
                  </span>
                  <span className="per-mode-doc-desc">
                    Avis sur les revenus {years.currentIncomeYear}. Le plafond épargne retraite est
                    repris directement depuis l&apos;avis.
                  </span>
                </div>

                <div className="per-mode-doc-card per-mode-doc-card--locked" aria-disabled="true">
                  <span className="per-mode-doc-title">Projection désactivée</span>
                  <span className="per-mode-doc-desc">
                    La vérification porte uniquement sur les versements de l&apos;année en cours.
                    Passez en mode expert pour projeter l&apos;avis suivant.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="per-step per-step--mode">
      <div className="premium-card sim-card--guide per-mode-step-card">
        <div className="per-mode-step-header sim-card__header--bleed">
          <div className="sim-card__title-row">
            <div className="sim-card__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="sim-card__title">Choix du parcours</h3>
          </div>
        </div>
        <div className="sim-divider" />

        <div className="per-mode-grid">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`per-mode-card ${mode === item.id ? 'per-mode-card--selected' : ''}`}
              onClick={() => onSelectMode(item.id)}
            >
              <span className="per-mode-card-marker">{item.marker}</span>
              <h4 className="per-mode-card-title">{item.title}</h4>
              <p className="per-mode-card-desc">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {mode !== null && (
        <div className="premium-card sim-card--guide per-mode-support-card">
          <div className="per-mode-docs-header sim-card__header--bleed">
            <div className="sim-card__title-row">
              <div className="sim-card__icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="sim-card__title">Documents nécessaires</h3>
            </div>
            <p className="per-mode-docs-subtitle">Base documentaire de départ</p>
          </div>
          <div className="sim-divider" />

          {mode === 'versement-n' ? (
            <div className="per-mode-panel-stack">
              <div className="per-mode-panel-block">
                <div className="per-mode-doc-grid">
                  <button
                    type="button"
                    className={`per-mode-doc-card ${historicalBasis === 'previous-avis-plus-n1' ? 'is-selected' : ''}`}
                    onClick={() => onSelectHistoricalBasis('previous-avis-plus-n1')}
                  >
                    <span className="per-mode-doc-title">
                      Avis IR {years.previousTaxYear} disponible
                    </span>
                    <span className="per-mode-doc-desc">
                      Avis sur les revenus {years.previousIncomeYear}. Le simulateur reconstituera
                      ensuite les revenus {years.currentIncomeYear} pour recalculer le plafond 163
                      quatervicies.
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`per-mode-doc-card ${historicalBasis === 'current-avis' ? 'is-selected' : ''}`}
                    onClick={() => onSelectHistoricalBasis('current-avis')}
                  >
                    <span className="per-mode-doc-title">
                      Avis IR {years.currentTaxYear} disponible
                    </span>
                    <span className="per-mode-doc-desc">
                      Avis sur les revenus {years.currentIncomeYear}. Le plafond épargne retraite est
                      déjà visible sur l&apos;avis ; vous pouvez passer directement aux versements de l&apos;année.
                    </span>
                  </button>
                </div>
              </div>

              <div className="per-mode-panel-block">
                <div className="per-mode-toggle-row">
                  <h4 className="per-mode-panel-title">Faut-il projeter l&apos;année en cours ?</h4>
                  <button
                    type="button"
                    className={`mode-toggle-pill${needsCurrentYearEstimate ? ' mode-toggle-pill--active' : ''}`}
                    onClick={() => onSetNeedsCurrentYearEstimate(!needsCurrentYearEstimate)}
                    aria-pressed={needsCurrentYearEstimate}
                    aria-label={`Activer l'estimation ${years.currentTaxYear}`}
                  >
                    <span className="mode-toggle-pill__knob" />
                  </button>
                </div>
                {needsCurrentYearEstimate && (
                  <p className="per-mode-toggle-hint">
                    L&apos;estimation {years.currentTaxYear} est activée. Vous renseignerez les revenus
                    et versements de l&apos;année en cours (Madelin, PERCO, PEROB, art. 83) dans la tab
                    Versement N.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="per-mode-doc-grid">
              <div className="per-mode-doc-card is-selected">
                <span className="per-mode-doc-title">
                  Avis IR {years.previousTaxYear} disponible
                </span>
                <span className="per-mode-doc-desc">
                  Avis sur les revenus {years.previousIncomeYear}.
                </span>
              </div>
              <div className="per-mode-doc-card is-selected">
                <span className="per-mode-doc-title">
                  Déclaration {years.previousTaxYear}
                </span>
                <span className="per-mode-doc-desc">
                  Ensemble des revenus et versements épargne retraite {years.currentIncomeYear}.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
