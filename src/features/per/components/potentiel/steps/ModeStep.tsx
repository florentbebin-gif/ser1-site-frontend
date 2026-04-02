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
}

const MODES: { id: PerMode; title: string; desc: string; marker: string }[] = [
  {
    id: 'versement-n',
    title: 'Contrôle du potentiel avant versement',
    desc: 'Je veux vérifier si un versement PER cette année reste déductible et quel gain fiscal il peut générer.',
    marker: 'Versement N',
  },
  {
    id: 'declaration-n1',
    title: 'Contrôle de la déclaration 2042',
    desc: "J'ai déjà versé et je veux fiabiliser les cases de déclaration et la lecture du potentiel restant.",
    marker: 'Déclaration N-1',
  },
];

export default function ModeStep({
  mode,
  historicalBasis,
  needsCurrentYearEstimate,
  years,
  onSelectMode,
  onSelectHistoricalBasis,
  onSetNeedsCurrentYearEstimate,
}: ModeStepProps): React.ReactElement {
  const showVersementChoices = mode === 'versement-n';

  return (
    <div className="per-step per-step--mode">
      <div className="per-mode-grid">
        {MODES.map((item) => (
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

      <div className="premium-card per-mode-support-card per-mode-support-card--accent">
        <p className="premium-section-title">Documents disponibles</p>

        {showVersementChoices ? (
          <div className="per-mode-panel-stack">
            <div className="per-mode-panel-block">
              <h4 className="per-mode-panel-title">Base documentaire de départ</h4>
              <p className="per-mode-panel-text">
                Choisissez l&apos;avis d&apos;impôt disponible. Le parcours ajoutera ensuite les écrans
                nécessaires pour reconstituer les revenus utiles au calcul.
              </p>
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
              <h4 className="per-mode-panel-title">Faut-il projeter l'année en cours ?</h4>
              <p className="per-mode-panel-text">
                Activez l&apos;estimation {years.currentTaxYear} si vous devez intégrer des revenus ou
                versements de l&apos;année en cours pour Madelin, PERCO, PEROB ou art. 83.
              </p>
              <div className="per-mode-doc-grid">
                <button
                  type="button"
                  className={`per-mode-doc-card ${!needsCurrentYearEstimate ? 'is-selected' : ''}`}
                  onClick={() => onSetNeedsCurrentYearEstimate(false)}
                >
                  <span className="per-mode-doc-title">Pas d'estimation {years.currentTaxYear}</span>
                  <span className="per-mode-doc-desc">
                    Je m'appuie sur les données déjà arrêtées et je ne projette pas de revenus
                    complémentaires pour l'année en cours.
                  </span>
                </button>

                <button
                  type="button"
                  className={`per-mode-doc-card ${needsCurrentYearEstimate ? 'is-selected' : ''}`}
                  onClick={() => onSetNeedsCurrentYearEstimate(true)}
                >
                  <span className="per-mode-doc-title">Estimation {years.currentTaxYear} nécessaire</span>
                  <span className="per-mode-doc-desc">
                    Je dois projeter les revenus et versements {years.currentTaxYear} pour affiner les
                    plafonds Madelin, PERCO, PEROB ou art. 83.
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="per-mode-declaration-note">
            <strong>Point de départ retenu :</strong> avis IR {years.previousTaxYear} sur les revenus{' '}
            {years.previousIncomeYear}, puis collecte des revenus {years.currentIncomeYear} exacts et
            des versements réalisés en {years.currentIncomeYear}. L'étape Avis IR reste incluse.
          </div>
        )}
      </div>
    </div>
  );
}
