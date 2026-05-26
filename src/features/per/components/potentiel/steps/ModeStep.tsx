/**
 * ModeStep - Step 1: choose the user goal and the document strategy.
 */

import React, { useState } from 'react';
import { SimInfoButton, SimModalShell } from '@/components/ui/sim';
import { IconActivity, IconFileText } from '@/icons/ui';
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

type DocumentInfoKey =
  | 'mode-versement-n'
  | 'mode-declaration-n1'
  | 'previous-avis-plus-n1'
  | 'current-avis'
  | 'declaration-avis'
  | 'declaration';

const DOCUMENT_INFO_TITLES: Record<DocumentInfoKey, string> = {
  'mode-versement-n': 'Contrôle du potentiel avant versement',
  'mode-declaration-n1': 'Report dans la déclaration 2042',
  'previous-avis-plus-n1': 'Avis IR précédent',
  'current-avis': 'Avis IR courant',
  'declaration-avis': 'Avis IR précédent',
  declaration: 'Déclaration 2042',
};

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
  const [documentInfo, setDocumentInfo] = useState<DocumentInfoKey | null>(null);
  const modes: { id: PerMode; title: string; marker: string }[] = [
    {
      id: 'versement-n',
      title: 'Contrôle du potentiel avant versement',
      marker: 'Versement N',
    },
    {
      id: 'declaration-n1',
      title: 'Reporter dans la déclaration 2042',
      marker: 'Déclaration N-1',
    },
  ];

  const documentInfoContent: Record<DocumentInfoKey, React.ReactNode> = {
    'mode-versement-n': (
      <>Vérifiez si un versement PER reste déductible et quel gain fiscal il peut générer.</>
    ),
    'mode-declaration-n1': (
      <>
        Visualisez comment reporter des versements {years.previousTaxYear} dans la déclaration{' '}
        {years.currentTaxYear} sur les revenus {years.previousIncomeYear}.
      </>
    ),
    'previous-avis-plus-n1': (
      <>
        Avis sur les revenus {years.previousIncomeYear}. Le simulateur reconstituera ensuite les
        revenus {years.currentIncomeYear} pour recalculer le plafond 163 quatervicies.
      </>
    ),
    'current-avis': (
      <>
        Avis sur les revenus {years.currentIncomeYear}. Le plafond épargne retraite est déjà visible
        sur l&apos;avis ; vous pouvez passer directement aux versements de l&apos;année.
      </>
    ),
    'declaration-avis': <>Avis sur les revenus {years.previousIncomeYear}.</>,
    declaration: (
      <>Ensemble des revenus et versements épargne retraite {years.currentIncomeYear}.</>
    ),
  };

  return (
    <div className="per-step per-step--mode">
      <div className="premium-card premium-card--guide sim-card--guide per-mode-step-card">
        <div className="per-mode-step-header sim-card__header sim-card__header--bleed">
          <div className="sim-card__title-row">
            <div className="sim-card__icon">
              <IconActivity />
            </div>
            <h3 className="sim-card__title">Choix du parcours</h3>
          </div>
        </div>
        <div className="sim-divider" />
        {simplifiedMode ? (
          <p className="per-mode-docs-subtitle">
            Mode simplifié : choisissez d’abord le parcours, les détails seront repliés ensuite.
          </p>
        ) : null}

        <div className="per-mode-grid">
          {modes.map((item) => (
            <article
              key={item.id}
              className={`per-mode-card ${mode === item.id ? 'per-mode-card--selected' : ''}`}
            >
              <button
                type="button"
                className="per-mode-card-select"
                aria-label={`Sélectionner ${item.title}`}
                onClick={() => onSelectMode(item.id)}
              />
              <div className="per-mode-card-marker-row">
                <span className="per-mode-card-marker">{item.marker}</span>
                <SimInfoButton
                  ariaLabel={`Expliquer ${item.title}`}
                  onClick={() =>
                    setDocumentInfo(
                      item.id === 'versement-n' ? 'mode-versement-n' : 'mode-declaration-n1',
                    )
                  }
                />
              </div>
              <span className="per-mode-card-title">{item.title}</span>
            </article>
          ))}
        </div>
      </div>

      {mode !== null && (
        <div className="premium-card premium-card--guide sim-card--guide per-mode-support-card">
          <div className="per-mode-docs-header sim-card__header sim-card__header--bleed">
            <div className="sim-card__title-row">
              <div className="sim-card__icon">
                <IconFileText />
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
                  <article
                    className={`per-mode-doc-card per-mode-doc-card--selectable ${historicalBasis === 'previous-avis-plus-n1' ? 'is-selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="per-mode-doc-select"
                      aria-label={`Sélectionner Avis IR ${years.previousTaxYear} disponible`}
                      onClick={() => onSelectHistoricalBasis('previous-avis-plus-n1')}
                    />
                    <div className="per-mode-doc-title-row">
                      <span className="per-mode-doc-title">
                        Avis IR {years.previousTaxYear} disponible
                      </span>
                      <SimInfoButton
                        ariaLabel={`Expliquer Avis IR ${years.previousTaxYear} disponible`}
                        onClick={() => setDocumentInfo('previous-avis-plus-n1')}
                      />
                    </div>
                  </article>

                  <article
                    className={`per-mode-doc-card per-mode-doc-card--selectable ${historicalBasis === 'current-avis' ? 'is-selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="per-mode-doc-select"
                      aria-label={`Sélectionner Avis IR ${years.currentTaxYear} disponible`}
                      onClick={() => onSelectHistoricalBasis('current-avis')}
                    />
                    <div className="per-mode-doc-title-row">
                      <span className="per-mode-doc-title">
                        Avis IR {years.currentTaxYear} disponible
                      </span>
                      <SimInfoButton
                        ariaLabel={`Expliquer Avis IR ${years.currentTaxYear} disponible`}
                        onClick={() => setDocumentInfo('current-avis')}
                      />
                    </div>
                  </article>
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
                    L&apos;estimation {years.currentTaxYear} est activée. Vous renseignerez les
                    revenus et versements de l&apos;année en cours (Madelin, PERCO, PEROB, art. 83)
                    dans la tab Versement N.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="per-mode-doc-grid">
              <div className="per-mode-doc-card is-selected">
                <div className="per-mode-doc-title-row">
                  <span className="per-mode-doc-title">
                    Avis IR {years.previousTaxYear} disponible
                  </span>
                  <SimInfoButton
                    ariaLabel={`Expliquer Avis IR ${years.previousTaxYear} disponible`}
                    onClick={() => setDocumentInfo('declaration-avis')}
                  />
                </div>
              </div>
              <div className="per-mode-doc-card is-selected">
                <div className="per-mode-doc-title-row">
                  <span className="per-mode-doc-title">Déclaration {years.previousTaxYear}</span>
                  <SimInfoButton
                    ariaLabel={`Expliquer Déclaration ${years.previousTaxYear}`}
                    onClick={() => setDocumentInfo('declaration')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {documentInfo ? (
        <SimModalShell
          title={DOCUMENT_INFO_TITLES[documentInfo]}
          onClose={() => setDocumentInfo(null)}
          bodyClassName="sim-info-modal-content"
        >
          <p>{documentInfoContent[documentInfo]}</p>
        </SimModalShell>
      ) : null}
    </div>
  );
}
