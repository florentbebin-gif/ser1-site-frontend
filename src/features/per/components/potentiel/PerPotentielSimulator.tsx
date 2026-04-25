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
import type { PerAbattementConfig, PerIncomeFilters } from './steps/PerIncomeTable';
import { PerHypotheses } from './PerHypotheses';
import { PerPotentielContextSidebar } from './PerPotentielContextSidebar';
import '../../styles/index.css';

type StepMeta = {
  shortLabel: string;
  title: string;
};

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

const DEFAULT_INCOME_FILTERS: PerIncomeFilters = {
  pension: false,
  foncier: false,
};


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
          shortLabel: `Revenus ${years.currentIncomeYear}`,
          title: `Revenus ${years.currentIncomeYear} et versements à déclarer`,
        };
      }
      if (basis === 'current-avis') {
        return {
          shortLabel: 'Versement N',
          title: `Versements ${years.currentTaxYear}`,
        };
      }
      return {
        shortLabel: `Revenus ${years.currentIncomeYear}`,
        title: `Reconstitution des revenus ${years.currentIncomeYear}`,
      };
    case 4:
      return {
        shortLabel: 'Versement N',
        title: `Versements ${years.currentTaxYear}`,
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
  const [incomeFilters, setIncomeFilters] = useState<PerIncomeFilters>(DEFAULT_INCOME_FILTERS);
  const isExpert = (localMode ?? mode) === 'expert';
  const toggleMode = () => setLocalMode(isExpert ? 'simplifie' : 'expert');
  const years = getPerWorkflowYears(fiscalContext);

  const {
    state,
    result,
    visibleSteps,
    setMode,
    setHistoricalBasis,
    setNeedsCurrentYearEstimate,
    updateAvisIr,
    updateSituation,
    updateProjectionSituation,
    updateDeclarant,
    updateDeclarants,
    addChild,
    addProjectionChild,
    updateChildMode,
    updateProjectionChildMode,
    removeChild,
    removeProjectionChild,
    goToStep,
    reset,
  } = usePerPotentiel(fiscalContext);

  useEffect(() => {
    const off = onResetEvent(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'per-potentiel') return;
      setIncomeFilters(DEFAULT_INCOME_FILTERS);
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
    fiscalContext,
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
    { label: 'Excel', onClick: exportExcel, disabled: !result },
    { label: 'PowerPoint', onClick: exportPowerPoint, disabled: !result },
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
  const revenusIsCouple = state.situationFamiliale === 'marie';
  const projectionIsCouple = state.projectionSituationFamiliale === 'marie';
  const usesProjectionFoyer = state.mode === 'versement-n' && (
    state.historicalBasis === 'current-avis'
      ? state.step >= 3
      : state.step >= 4
  );
  const activeIsCouple = usesProjectionFoyer
    ? projectionIsCouple || (!state.needsCurrentYearEstimate && Boolean(state.avisIr2))
    : revenusIsCouple;
  const abat10CfgRoot = fiscalContext._raw_tax?.incomeTax?.abat10 ?? {};
  const abat10SalCfgCurrent: PerAbattementConfig = abat10CfgRoot.current ?? {};
  const abat10RetCfgCurrent: PerAbattementConfig = abat10CfgRoot.retireesCurrent ?? {};
  const isRevenusStep = state.step === 3
    && (
      state.mode === 'declaration-n1'
      || (state.mode === 'versement-n' && state.historicalBasis === 'previous-avis-plus-n1')
    );
  const isVersementNStep = state.mode === 'versement-n' && (
    (state.historicalBasis === 'current-avis' && state.step === 3)
    || (state.historicalBasis === 'previous-avis-plus-n1' && state.step === 4)
  );
  const showProjectionDetailInputs = state.needsCurrentYearEstimate;
  const fiscalPreviewTitle = isRevenusStep
    ? `Synthèse déclaration IR ${years.currentTaxYear}`
    : (isVersementNStep && !showProjectionDetailInputs
      ? `Contrôle versement ${years.currentTaxYear}`
      : `Projection IR ${years.currentTaxYear + 1}`);
  const projectionPreviewTitle = 'Plafonds projetés';

  const avisBasis = state.mode === 'declaration-n1'
    ? 'previous-avis-plus-n1'
    : state.historicalBasis ?? 'previous-avis-plus-n1';
  const toggleIncomeFilter = (key: keyof PerIncomeFilters): void => {
    setIncomeFilters((prev) => ({
      ...prev,
      [key]: prev[key] !== true,
    }));
  };

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
                  showIncomeCard
                  situationFamiliale={state.situationFamiliale}
                  isole={state.isole}
                  children={state.children}
                  isCouple={revenusIsCouple}
                  mutualisationConjoints={state.mutualisationConjoints}
                  declarant1={state.revenusN1Declarant1}
                  declarant2={state.revenusN1Declarant2}
                  incomeFilters={incomeFilters}
                  plafondMadelin={result?.plafondMadelin}
                  abat10SalCfg={abat10SalCfgCurrent}
                  abat10RetCfg={abat10RetCfgCurrent}
                  onUpdateSituation={updateSituation}
                  onAddChild={addChild}
                  onUpdateChildMode={updateChildMode}
                  onRemoveChild={removeChild}
                  onToggleIncomeFilter={toggleIncomeFilter}
                  onUpdateDeclarant={(decl, patch) => updateDeclarant('revenus-n1', decl, patch)}
                  onUpdateDeclarants={(patches) => updateDeclarants('revenus-n1', patches)}
                />
              )}

              {state.step === 3 && state.mode === 'versement-n' && state.historicalBasis === 'previous-avis-plus-n1' && (
                <SituationFiscaleStep
                  variant="revenus-n1"
                  yearLabel={`${years.currentIncomeYear}`}
                  showFoyerCard
                  showIncomeCard
                  situationFamiliale={state.situationFamiliale}
                  isole={state.isole}
                  children={state.children}
                  isCouple={revenusIsCouple}
                  mutualisationConjoints={state.mutualisationConjoints}
                  declarant1={state.revenusN1Declarant1}
                  declarant2={state.revenusN1Declarant2}
                  incomeFilters={incomeFilters}
                  plafondMadelin={result?.plafondMadelin}
                  abat10SalCfg={abat10SalCfgCurrent}
                  abat10RetCfg={abat10RetCfgCurrent}
                  onUpdateSituation={updateSituation}
                  onAddChild={addChild}
                  onUpdateChildMode={updateChildMode}
                  onRemoveChild={removeChild}
                  onToggleIncomeFilter={toggleIncomeFilter}
                  onUpdateDeclarant={(decl, patch) => updateDeclarant('revenus-n1', decl, patch)}
                  onUpdateDeclarants={(patches) => updateDeclarants('revenus-n1', patches)}
                />
              )}

              {state.step === 3 && state.mode === 'versement-n' && state.historicalBasis === 'current-avis' && (
                <SituationFiscaleStep
                  variant="versements-n"
                  yearLabel={`${years.currentTaxYear}`}
                  showFoyerCard={showProjectionDetailInputs}
                  showIncomeCard={showProjectionDetailInputs}
                  situationFamiliale={state.projectionSituationFamiliale}
                  isole={state.projectionIsole}
                  children={state.projectionChildren}
                  isCouple={projectionIsCouple}
                  mutualisationConjoints={state.projectionMutualisationConjoints}
                  declarant1={state.projectionNDeclarant1}
                  declarant2={state.projectionNDeclarant2}
                  plafondMadelin={result?.plafondMadelin}
                  incomeFilters={incomeFilters}
                  abat10SalCfg={abat10SalCfgCurrent}
                  abat10RetCfg={abat10RetCfgCurrent}
                  onUpdateSituation={updateProjectionSituation}
                  onAddChild={addProjectionChild}
                  onUpdateChildMode={updateProjectionChildMode}
                  onRemoveChild={removeProjectionChild}
                  onToggleIncomeFilter={toggleIncomeFilter}
                  onUpdateDeclarant={(decl, patch) => updateDeclarant('projection-n', decl, patch)}
                  onUpdateDeclarants={(patches) => updateDeclarants('projection-n', patches)}
                />
              )}

              {state.step === 4 && state.mode === 'versement-n' && state.historicalBasis === 'previous-avis-plus-n1' && (
                <SituationFiscaleStep
                  variant="versements-n"
                  yearLabel={`${years.currentTaxYear}`}
                  showFoyerCard={showProjectionDetailInputs}
                  showIncomeCard={showProjectionDetailInputs}
                  situationFamiliale={state.projectionSituationFamiliale}
                  isole={state.projectionIsole}
                  children={state.projectionChildren}
                  isCouple={projectionIsCouple}
                  mutualisationConjoints={state.projectionMutualisationConjoints}
                  declarant1={state.projectionNDeclarant1}
                  declarant2={state.projectionNDeclarant2}
                  plafondMadelin={result?.plafondMadelin}
                  incomeFilters={incomeFilters}
                  abat10SalCfg={abat10SalCfgCurrent}
                  abat10RetCfg={abat10RetCfgCurrent}
                  onUpdateSituation={updateProjectionSituation}
                  onAddChild={addProjectionChild}
                  onUpdateChildMode={updateProjectionChildMode}
                  onRemoveChild={removeProjectionChild}
                  onToggleIncomeFilter={toggleIncomeFilter}
                  onUpdateDeclarant={(decl, patch) => updateDeclarant('projection-n', decl, patch)}
                  onUpdateDeclarants={(patches) => updateDeclarants('projection-n', patches)}
                />
              )}

            </div>

          </div>
          )}
        </main>

        {state.mode !== null && (
        <aside className="per-potentiel-context sim-grid__col sim-grid__col--sticky">
          <PerPotentielContextSidebar
            step={state.step}
            isCouple={activeIsCouple}
            showRevenusPreview={isRevenusStep}
            showAdjustedPotentiel={isRevenusStep || isVersementNStep}
            fiscalPreviewTitle={fiscalPreviewTitle}
            projectionPreviewTitle={projectionPreviewTitle}
            parcoursPills={parcoursPills}
            totalAvisIrD1={totalAvisIrD1}
            totalAvisIrD2={totalAvisIrD2}
            result={result}
          />
        </aside>
        )}
      </div>

      <PerHypotheses />
    </div>
  );
}
