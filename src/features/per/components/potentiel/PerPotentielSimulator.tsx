/**
 * PerPotentielSimulator - Wizard shell for "Contrôle du potentiel ER".
 */

import React, { useEffect, useState } from 'react';
import type { PerHistoricalBasis } from '../../../../engine/per';
import { ExportMenu } from '../../../../components/ExportMenu';
import { ModeToggle } from '../../../../components/ModeToggle';
import { useFiscalContext } from '../../../../hooks/useFiscalContext';
import { useUserMode, type UserMode } from '../../../../settings/userMode';
import { useTheme } from '../../../../settings/ThemeProvider';
import '@/styles/sim/index.css';
import { onResetEvent } from '../../../../utils/reset';
import { usePerPotentiel, type WizardStep } from '../../hooks/usePerPotentiel';
import { usePerPotentielExportHandlers } from '../../hooks/usePerPotentielExportHandlers';
import { getPerWorkflowYears } from '../../utils/perWorkflowYears';
import ModeStep from './steps/ModeStep';
import AvisIrStep from './steps/AvisIrStep';
import SituationFiscaleStep from './steps/SituationFiscaleStep';
import SynthesePotentielStep from './steps/SynthesePotentielStep';
import { PerHypotheses } from './PerHypotheses';
import { PerSynthesisSidebar } from './PerSynthesisSidebar';
import '../../styles/index.css';

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

const sumAvisIrPlafonds = (
  avis: {
    nonUtiliseAnnee1?: number;
    nonUtiliseAnnee2?: number;
    nonUtiliseAnnee3?: number;
    plafondCalcule?: number;
  } | null,
): number =>
  (avis?.nonUtiliseAnnee1 ?? 0)
  + (avis?.nonUtiliseAnnee2 ?? 0)
  + (avis?.nonUtiliseAnnee3 ?? 0)
  + (avis?.plafondCalcule ?? 0);


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
  const { mode } = useUserMode();
  const [localMode, setLocalMode] = useState<UserMode | null>(null);
  const isExpert = (localMode ?? mode) === 'expert';
  const toggleMode = () => setLocalMode(isExpert ? 'simplifie' : 'expert');
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
    goToStep,
    reset,
    isCouple,
  } = usePerPotentiel(fiscalContext);

  useEffect(() => {
    const off = onResetEvent(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'per-potentiel') return;
      reset();
    });
    return off;
  }, [reset]);

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
        <p className="per-potentiel-loading">
          Chargement des paramètres fiscaux...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sim-page per-potentiel-page">
        <p className="per-potentiel-error">
          Erreur : {error}
        </p>
      </div>
    );
  }

  const activeStep = getStepMeta(state.step, state.mode, state.historicalBasis, years);
  const stepIndex = visibleSteps.indexOf(state.step);
  const exportOptions = [
    { label: 'Excel', onClick: exportExcel, disabled: !result || state.step !== 5 },
    { label: 'PowerPoint', onClick: exportPowerPoint, disabled: !result || state.step !== 5 },
  ];

  // Pills parcours dans la sidebar
  type Pill = { label: string; on: boolean };
  function buildPills(): Pill[] {
    if (state.mode === 'declaration-n1') {
      return [
        { label: `Avis IR ${years.previousTaxYear}`, on: true },
        { label: `Déclaration ${years.previousTaxYear}`, on: true },
      ];
    }
    if (state.mode === 'versement-n') {
      if (state.historicalBasis === 'current-avis') {
        return [
          { label: `Avis IR ${years.currentTaxYear}`, on: true },
          { label: `Projection ${years.currentTaxYear}`, on: state.needsCurrentYearEstimate },
        ];
      }
      return [
        { label: `Avis IR ${years.previousTaxYear}`, on: true },
        { label: `Reconstitution ${years.currentIncomeYear}`, on: true },
        { label: `Projection ${years.currentTaxYear}`, on: state.needsCurrentYearEstimate },
      ];
    }
    return [];
  }
  const parcoursPills = buildPills();
  const totalAvisIrD1 = sumAvisIrPlafonds(state.avisIr);
  const totalAvisIrD2 = sumAvisIrPlafonds(state.avisIr2);

  const avisBasis = state.mode === 'declaration-n1'
    ? 'previous-avis-plus-n1'
    : state.historicalBasis ?? 'previous-avis-plus-n1';

  return (
    <div className="sim-page per-potentiel-page">
      <div className="premium-header sim-header sim-header--stacked">
        <h1 className="premium-title">Contrôle du potentiel épargne retraite</h1>
        <div className="sim-header__subtitle-row">
          <p className="premium-subtitle">
            Mode, document fiscal, situation du foyer et restitution déclarative.
          </p>
          <div className="sim-header__actions">
            <ModeToggle value={isExpert} onChange={toggleMode} />
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </div>
        </div>
      </div>

      <nav className="per-potentiel-tabs" aria-label="Étapes du parcours" role="tablist">
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

      <div className="sim-grid">
        <main className="sim-grid__col">
          {state.step === 1 ? (
            <ModeStep
              mode={state.mode}
              historicalBasis={state.historicalBasis}
              needsCurrentYearEstimate={state.needsCurrentYearEstimate}
              years={years}
              onSelectMode={setMode}
              onSelectHistoricalBasis={setHistoricalBasis}
              onSetNeedsCurrentYearEstimate={setNeedsCurrentYearEstimate}
            />
          ) : (
          <div className="premium-card premium-card--guide per-potentiel-stage">
            <div className="per-potentiel-stage-header sim-card__header sim-card__header--bleed">
              <div className="sim-card__title-row">
                <div className="sim-card__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h2 className="sim-card__title">{activeStep.title}</h2>
              </div>
            </div>
            <div className="sim-divider per-potentiel-stage-divider" />

            <div className="per-potentiel-stage-body">
              {state.step === 2 && (
                <AvisIrStep
                  avisIr={state.avisIr}
                  avisIr2={state.avisIr2}
                  basis={avisBasis}
                  years={years}
                  totalDeclarant1={totalAvisIrD1}
                  totalDeclarant2={totalAvisIrD2}
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
                />
              )}
            </div>

          </div>
          )}
        </main>

        {state.mode !== null && (
        <aside className="per-potentiel-context sim-grid__col sim-grid__col--sticky">
          <div className="premium-card per-potentiel-context-card sim-summary-card">
            <div className="sim-card__title-row">
              <div className="sim-card__icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="sim-card__title">Potentiel</h3>
            </div>
            <div className="sim-divider" />
            <div className="per-potentiel-context-list">
              {parcoursPills.length > 0 && (
                <div className="per-potentiel-context-item">
                  <span className="per-potentiel-context-label per-potentiel-context-label--small">Parcours</span>
                  <div className="per-potentiel-pills">
                    {parcoursPills.map((pill) => (
                      <span
                        key={pill.label}
                        className={`per-potentiel-pill${pill.on ? ' is-on' : ''}`}
                      >
                        {pill.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {state.step === 2 && (
                <div className="per-avis-sidebar-kpis per-potentiel-context-item">
                  <span className="per-potentiel-context-label per-potentiel-context-label--small">
                    Potentiel 163 quatervicies
                  </span>
                  <div className="per-potentiel-mini-kpis">
                    <div className="per-potentiel-mini-kpi">
                      <span className="per-potentiel-mini-kpi-label">Déclarant 1</span>
                      <strong className="per-potentiel-mini-kpi-value">
                        {fmtCurrency(totalAvisIrD1)}
                      </strong>
                    </div>
                    <div className="per-potentiel-mini-kpi">
                      <span className="per-potentiel-mini-kpi-label">Déclarant 2</span>
                      <strong className="per-potentiel-mini-kpi-value">
                        {fmtCurrency(totalAvisIrD2)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {result && state.step !== 5 && (
            <div className="premium-card per-potentiel-context-card sim-summary-card sim-summary-card--secondary">
              <div className="sim-card__title-row">
                <div className="sim-card__icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                </div>
                <h3 className="sim-card__title">Aperçu en direct</h3>
              </div>
              <div className="sim-divider sim-divider--tight" />
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

          {result && state.step === 5 && (
            <PerSynthesisSidebar
              result={result}
              modeVersement={state.mode === 'versement-n'}
              versementEnvisage={state.versementEnvisage}
              onSetVersement={setVersementEnvisage}
            />
          )}
        </aside>
        )}
      </div>

      <PerHypotheses />
    </div>
  );
}
