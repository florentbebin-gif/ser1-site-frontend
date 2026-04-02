/**
 * PerPotentielSimulator - Wizard shell for "Contrôle du potentiel ER".
 */

import React from 'react';
import type { PerHistoricalBasis } from '../../../../engine/per';
import { ExportMenu } from '../../../../components/ExportMenu';
import { useFiscalContext } from '../../../../hooks/useFiscalContext';
import { useTheme } from '../../../../settings/ThemeProvider';
import '../../../../components/simulator/SimulatorShell.css';
import '../../../../styles/premium-shared.css';
import { usePerPotentiel, type WizardStep } from '../../hooks/usePerPotentiel';
import { usePerPotentielExportHandlers } from '../../hooks/usePerPotentielExportHandlers';
import { getPerWorkflowYears } from '../../utils/perWorkflowYears';
import ModeStep from './steps/ModeStep';
import AvisIrStep from './steps/AvisIrStep';
import SituationFiscaleStep from './steps/SituationFiscaleStep';
import SynthesePotentielStep from './steps/SynthesePotentielStep';
import '../../Per.css';

type StepMeta = {
  shortLabel: string;
  title: string;
};

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const fmtPercent = (value: number): string =>
  `${(value <= 1 ? value * 100 : value).toFixed(1)} %`;

function getDocumentBasisLabel(
  mode: 'versement-n' | 'declaration-n1' | null,
  basis: PerHistoricalBasis | null,
  years: ReturnType<typeof getPerWorkflowYears>,
): string {
  if (mode === 'declaration-n1') {
    return `Avis IR ${years.previousTaxYear} (revenus ${years.previousIncomeYear})`;
  }

  if (basis === 'current-avis') {
    return `Avis IR ${years.currentTaxYear} (revenus ${years.currentIncomeYear})`;
  }

  if (basis === 'previous-avis-plus-n1') {
    return `Avis IR ${years.previousTaxYear} (revenus ${years.previousIncomeYear}) + reconstitution ${years.currentIncomeYear}`;
  }

  return 'À définir';
}

function getStepMeta(
  stepId: WizardStep,
  mode: 'versement-n' | 'declaration-n1' | null,
  basis: PerHistoricalBasis | null,
  years: ReturnType<typeof getPerWorkflowYears>,
): StepMeta {
  switch (stepId) {
    case 1:
      return { shortLabel: 'Mode', title: 'Choix du parcours' };
    case 2:
      return {
        shortLabel: 'Avis IR',
        title: `Lecture de l'avis IR ${mode === 'declaration-n1' || basis === 'previous-avis-plus-n1'
          ? years.previousTaxYear
          : years.currentTaxYear}`,
      };
    case 3:
      if (mode === 'declaration-n1') {
        return {
          shortLabel: 'Déclaration',
          title: `Revenus ${years.currentIncomeYear} et versements à déclarer`,
        };
      }
      if (basis === 'current-avis') {
        return {
          shortLabel: 'Versements N',
          title: `Versements ${years.currentTaxYear} et estimation optionnelle`,
        };
      }
      return {
        shortLabel: `Revenus ${years.currentIncomeYear}`,
        title: `Reconstitution des revenus ${years.currentIncomeYear}`,
      };
    case 4:
      return {
        shortLabel: `Estimation ${years.currentTaxYear}`,
        title: `Estimation des revenus ${years.currentTaxYear}`,
      };
    case 5:
    default:
      return { shortLabel: 'Synthèse', title: 'Synthèse déclarative' };
  }
}

export default function PerPotentielSimulator(): React.ReactElement {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: true });
  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const years = getPerWorkflowYears(fiscalContext);

  const {
    state,
    result,
    baseResult,
    visibleSteps,
    setMode,
    setHistoricalBasis,
    setNeedsCurrentYearEstimate,
    updateAvisIr,
    updateSituation,
    updateDeclarant,
    setVersementEnvisage,
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    isCouple,
  } = usePerPotentiel(fiscalContext);

  const { exportExcel, exportPowerPoint, exportLoading } = usePerPotentielExportHandlers({
    state,
    result,
    pptxColors,
    cabinetLogo,
    logoPlacement,
  });

  if (loading) {
    return (
      <div className="sim-page per-potentiel-page">
        <p style={{ color: 'var(--color-c9)', textAlign: 'center', padding: '3rem' }}>
          Chargement des paramètres fiscaux...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sim-page per-potentiel-page">
        <p style={{ color: 'var(--color-c1)', textAlign: 'center', padding: '3rem' }}>
          Erreur : {error}
        </p>
      </div>
    );
  }

  const activeStep = getStepMeta(state.step, state.mode, state.historicalBasis, years);
  const stepIndex = visibleSteps.indexOf(state.step);
  const totalSteps = visibleSteps.length;
  const currentPass = fiscalContext.passHistoryByYear[years.currentTaxYear] ?? null;
  const exportOptions = [
    { label: 'Excel', onClick: exportExcel, disabled: !result || state.step !== 5 },
    { label: 'PowerPoint', onClick: exportPowerPoint, disabled: !result || state.step !== 5 },
  ];

  const pathLabel = state.mode === 'declaration-n1'
    ? 'Déclaration 2042 N-1'
    : state.mode === 'versement-n'
      ? 'Contrôle avant versement N'
      : 'À définir';
  const documentLabel = getDocumentBasisLabel(state.mode, state.historicalBasis, years);
  const projectionLabel = state.mode === 'versement-n'
    ? (state.needsCurrentYearEstimate ? `Oui, revenus ${years.currentTaxYear}` : 'Non')
    : 'Non';
  const foyerLabel = isCouple
    ? 'Couple marié ou pacsé'
    : state.isole
      ? 'Parent isolé'
      : 'Personne seule';
  const hasPrev = stepIndex > 0;
  const hasNext = stepIndex >= 0 && stepIndex < visibleSteps.length - 1;
  const avisBasis = state.mode === 'declaration-n1'
    ? 'previous-avis-plus-n1'
    : state.historicalBasis ?? 'previous-avis-plus-n1';

  return (
    <div className="sim-page per-potentiel-page">
      <div className="premium-header per-potentiel-header">
        <div className="per-potentiel-header-copy">
          <h1 className="premium-title">Contrôle du potentiel épargne retraite</h1>
          <p className="premium-subtitle">
            Mode, document fiscal, situation du foyer et restitution déclarative.
          </p>
        </div>
        <div className="sim-header__actions">
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </div>
      </div>

      <nav className="per-potentiel-tabs" aria-label="Étapes du parcours">
        {visibleSteps.map((stepId) => {
          const meta = getStepMeta(stepId, state.mode, state.historicalBasis, years);
          const isCurrent = state.step === stepId;
          const isDone = stepIndex > visibleSteps.indexOf(stepId);
          return (
            <button
              key={stepId}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              className={[
                'per-potentiel-tab',
                isCurrent ? 'is-active' : '',
                isDone ? 'is-done' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => goToStep(stepId)}
            >
              {meta.shortLabel}
            </button>
          );
        })}
      </nav>

      <div className="per-potentiel-layout">
        <main className="per-potentiel-main">
          <div className="premium-card premium-card--guide per-potentiel-stage">
            <div className="per-potentiel-stage-header">
              <h2 className="per-potentiel-stage-title">{activeStep.title}</h2>
              <div className="per-potentiel-stage-badge">
                {stepIndex + 1} / {totalSteps}
              </div>
            </div>

            <div className="per-potentiel-stage-body">
              {state.step === 1 && (
                <ModeStep
                  mode={state.mode}
                  historicalBasis={state.historicalBasis}
                  needsCurrentYearEstimate={state.needsCurrentYearEstimate}
                  years={years}
                  onSelectMode={setMode}
                  onSelectHistoricalBasis={setHistoricalBasis}
                  onSetNeedsCurrentYearEstimate={setNeedsCurrentYearEstimate}
                />
              )}

              {state.step === 2 && (
                <AvisIrStep
                  avisIr={state.avisIr}
                  avisIr2={state.avisIr2}
                  isCouple={isCouple}
                  basis={avisBasis}
                  years={years}
                  onUpdate={updateAvisIr}
                />
              )}

              {state.step === 3 && state.mode === 'declaration-n1' && (
                <SituationFiscaleStep
                  variant="revenus-n1"
                  yearLabel={`${years.currentIncomeYear}`}
                  showFoyerCard
                  situationFamiliale={state.situationFamiliale}
                  nombreParts={state.nombreParts}
                  isole={state.isole}
                  isCouple={isCouple}
                  mutualisationConjoints={state.mutualisationConjoints}
                  declarant1={state.revenusN1Declarant1}
                  declarant2={state.revenusN1Declarant2}
                  result={baseResult}
                  onUpdateSituation={updateSituation}
                  onUpdateDeclarant={(decl, patch) => updateDeclarant('revenus-n1', decl, patch)}
                />
              )}

              {state.step === 3 && state.mode === 'versement-n' && state.historicalBasis === 'previous-avis-plus-n1' && (
                <SituationFiscaleStep
                  variant="revenus-n1"
                  yearLabel={`${years.currentIncomeYear}`}
                  showFoyerCard
                  situationFamiliale={state.situationFamiliale}
                  nombreParts={state.nombreParts}
                  isole={state.isole}
                  isCouple={isCouple}
                  mutualisationConjoints={state.mutualisationConjoints}
                  declarant1={state.revenusN1Declarant1}
                  declarant2={state.revenusN1Declarant2}
                  result={baseResult}
                  onUpdateSituation={updateSituation}
                  onUpdateDeclarant={(decl, patch) => updateDeclarant('revenus-n1', decl, patch)}
                />
              )}

              {state.step === 3 && state.mode === 'versement-n' && state.historicalBasis === 'current-avis' && (
                <SituationFiscaleStep
                  variant="versements-n"
                  yearLabel={`${years.currentTaxYear}`}
                  showFoyerCard
                  incomeCardsOptional
                  situationFamiliale={state.situationFamiliale}
                  nombreParts={state.nombreParts}
                  isole={state.isole}
                  isCouple={isCouple}
                  mutualisationConjoints={state.mutualisationConjoints}
                  declarant1={state.projectionNDeclarant1}
                  declarant2={state.projectionNDeclarant2}
                  result={result}
                  onUpdateSituation={updateSituation}
                  onUpdateDeclarant={(decl, patch) => updateDeclarant('projection-n', decl, patch)}
                />
              )}

              {state.step === 4 && (
                <SituationFiscaleStep
                  variant="projection-n"
                  yearLabel={`${years.currentTaxYear}`}
                  showFoyerCard={false}
                  situationFamiliale={state.situationFamiliale}
                  nombreParts={state.nombreParts}
                  isole={state.isole}
                  isCouple={isCouple}
                  mutualisationConjoints={state.mutualisationConjoints}
                  declarant1={state.projectionNDeclarant1}
                  declarant2={state.projectionNDeclarant2}
                  result={result}
                  onUpdateSituation={updateSituation}
                  onUpdateDeclarant={(decl, patch) => updateDeclarant('projection-n', decl, patch)}
                />
              )}

              {state.step === 5 && (
                <SynthesePotentielStep
                  result={result}
                  isCouple={isCouple}
                  modeVersement={state.mode === 'versement-n'}
                  versementEnvisage={state.versementEnvisage}
                  onSetVersement={setVersementEnvisage}
                />
              )}
            </div>

            {(hasPrev || hasNext) && (
              <div className="per-potentiel-stage-footer">
                {hasPrev ? (
                  <button type="button" className="premium-btn" onClick={prevStep}>
                    Retour
                  </button>
                ) : (
                  <span />
                )}

                {hasNext && (
                  <button type="button" className="premium-btn premium-btn-primary" onClick={nextStep} disabled={!canGoNext}>
                    {visibleSteps[stepIndex + 1] === 5 ? 'Voir la synthèse' : 'Continuer'}
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        <aside className="per-potentiel-context">
          <div className="premium-card-compact per-potentiel-context-card">
            <p className="premium-section-title">Dossier</p>
            <div className="per-potentiel-context-list">
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Parcours</span>
                <span className="per-potentiel-context-value">{pathLabel}</span>
              </div>
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Base documentaire</span>
                <span className="per-potentiel-context-value">{documentLabel}</span>
              </div>
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Projection {years.currentTaxYear}</span>
                <span className="per-potentiel-context-value">{projectionLabel}</span>
              </div>
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Foyer</span>
                <span className="per-potentiel-context-value">{foyerLabel}</span>
              </div>
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">Parts</span>
                <span className="per-potentiel-context-value">{state.nombreParts}</span>
              </div>
              <div className="per-potentiel-context-item">
                <span className="per-potentiel-context-label">PASS {years.currentTaxYear}</span>
                <span className="per-potentiel-context-value">
                  {currentPass ? fmtCurrency(currentPass) : '—'}
                </span>
              </div>
            </div>
          </div>

          {result && (
            <div className="premium-card-compact per-potentiel-context-card per-potentiel-context-card--accent">
              <p className="premium-section-title">Aperçu en direct</p>
              <div className="per-potentiel-mini-kpis">
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">TMI</span>
                  <strong className="per-potentiel-mini-kpi-value">
                    {fmtPercent(result.situationFiscale.tmi)}
                  </strong>
                </div>
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">IR estimé</span>
                  <strong className="per-potentiel-mini-kpi-value">
                    {fmtCurrency(result.situationFiscale.irEstime)}
                  </strong>
                </div>
                <div className="per-potentiel-mini-kpi">
                  <span className="per-potentiel-mini-kpi-label">Disponible D1</span>
                  <strong className="per-potentiel-mini-kpi-value">
                    {fmtCurrency(result.plafond163Q.declarant1.disponibleRestant)}
                  </strong>
                </div>
                {isCouple && result.plafond163Q.declarant2 && (
                  <div className="per-potentiel-mini-kpi">
                    <span className="per-potentiel-mini-kpi-label">Disponible D2</span>
                    <strong className="per-potentiel-mini-kpi-value">
                      {fmtCurrency(result.plafond163Q.declarant2.disponibleRestant)}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
