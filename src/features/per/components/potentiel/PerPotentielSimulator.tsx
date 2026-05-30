/**
 * PerPotentielSimulator - Wizard shell for "Contrôle du potentiel ER".
 */

import React, { useEffect, useState } from 'react';
import { IconFileText } from '@/icons/ui';
import { SimEmptyState, SimPageShell } from '@/components/ui/sim';
import { ExportMenu } from '@/components/ExportMenu';
import { ModeToggle } from '@/components/ModeToggle';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { useUserMode, type UserMode } from '@/settings/userMode';
import { resolveEffectiveUserMode } from '@/settings/userModeDisplay';
import { useTheme } from '@/settings/ThemeProvider';
import '@/styles/sim/index.css';
import { onResetEvent } from '@/utils/reset';
import { derivePerPotentielFiscalSettings } from '../../fiscal/perPotentielFiscalAdapter';
import { usePerPotentiel } from '../../hooks/usePerPotentiel';
import { usePerPotentielExportHandlers } from '../../hooks/usePerPotentielExportHandlers';
import { hasAvisIrDeclarant, sumAvisIrPlafonds } from '../../utils/perAvisIrPlafonds';
import { getPerWorkflowYears } from '../../utils/perWorkflowYears';
import { hasPerPotentielSynthesisReady } from '../../utils/perPotentielReadiness';
import ModeStep from './steps/ModeStep';
import AvisIrStep from './steps/AvisIrStep';
import SituationFiscaleStep from './steps/SituationFiscaleStep';
import type { PerIncomeFilters } from './steps/PerIncomeTable';
import { PerHypotheses } from './PerHypotheses';
import { PerPotentielContextSidebar } from './PerPotentielContextSidebar';
import { PerPotentielWorkflowTabs } from './PerPotentielWorkflowTabs';
import { usePerPotentielPageUXContract } from './hooks/usePerPotentielPageUXContract';
import { getPerPotentielStepMeta } from './perPotentielStepMeta';
import '../../styles/index.css';

const DEFAULT_INCOME_FILTERS: PerIncomeFilters = {
  pension: false,
  foncier: false,
};

export default function PerPotentielSimulator(): React.ReactElement {
  const { fiscalContext, loading, error } = useFiscalContext({ strict: true });
  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { mode } = useUserMode();
  const [localMode, setLocalMode] = useState<UserMode | null>(null);
  const [incomeFilters, setIncomeFilters] = useState<PerIncomeFilters>(DEFAULT_INCOME_FILTERS);
  const effectiveMode = resolveEffectiveUserMode(mode, localMode);
  const isExpert = effectiveMode === 'expert';
  const isSimplified = !isExpert;
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
  } = usePerPotentiel(fiscalContext, { simplifiedMode: isSimplified });

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
  const synthesisReady = hasPerPotentielSynthesisReady(state, result);
  const pageUX = usePerPotentielPageUXContract({ synthesisReady });
  const activeStep = getPerPotentielStepMeta(state.step, state.mode, state.historicalBasis, years);
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
  const hasAvisIrD2 = hasAvisIrDeclarant(state.avisIr2);
  const revenusIsCouple = state.situationFamiliale === 'marie';
  const projectionIsCouple = state.projectionSituationFamiliale === 'marie';
  const versementNIsCouple = projectionIsCouple || (!state.needsCurrentYearEstimate && hasAvisIrD2);
  const usesProjectionFoyer =
    state.mode === 'versement-n' &&
    (state.historicalBasis === 'current-avis' ? state.step >= 3 : state.step >= 4);
  const activeIsCouple = usesProjectionFoyer ? versementNIsCouple : revenusIsCouple;
  const { abat10SalCfgCurrent, abat10RetCfgCurrent } =
    derivePerPotentielFiscalSettings(fiscalContext);
  const isRevenusStep =
    state.step === 3 &&
    (state.mode === 'declaration-n1' ||
      (state.mode === 'versement-n' && state.historicalBasis === 'previous-avis-plus-n1'));
  const isVersementNStep =
    state.mode === 'versement-n' &&
    ((state.historicalBasis === 'current-avis' && state.step === 3) ||
      (state.historicalBasis === 'previous-avis-plus-n1' && state.step === 4));
  const showProjectionDetailInputs = state.needsCurrentYearEstimate;
  const showProjectedPlafondCalcule = isRevenusStep || showProjectionDetailInputs;
  const fiscalPreviewTitle = isRevenusStep
    ? `Synthèse déclaration IR ${years.currentTaxYear}`
    : isVersementNStep && !showProjectionDetailInputs
      ? `Contrôle versement ${years.currentTaxYear}`
      : `Projection IR ${years.currentTaxYear + 1}`;
  const projectionPreviewTitle = 'Plafonds projetés';

  const avisBasis =
    state.mode === 'declaration-n1'
      ? 'previous-avis-plus-n1'
      : (state.historicalBasis ?? 'previous-avis-plus-n1');
  const toggleIncomeFilter = (key: keyof PerIncomeFilters): void => {
    setIncomeFilters((prev) => ({
      ...prev,
      [key]: prev[key] !== true,
    }));
  };

  return (
    <SimPageShell
      title="PER — Potentiel"
      subtitle="Mode, document fiscal, situation du foyer et restitution déclarative."
      pageClassName="per-potentiel-page"
      pageTestId="per-potentiel-page"
      statusTestId="per-potentiel-status"
      loading={loading}
      error={error}
      actions={
        <>
          <ModeToggle value={isExpert} onChange={toggleMode} />
          <ExportMenu options={exportOptions} loading={exportLoading} />
        </>
      }
      controls={
        <PerPotentielWorkflowTabs
          visibleSteps={visibleSteps}
          currentStep={state.step}
          mode={state.mode}
          historicalBasis={state.historicalBasis}
          years={years}
          onStepSelect={goToStep}
        />
      }
    >
      <SimPageShell.Main>
        <div id="per-potentiel-parcours" data-sim-step-id="per-potentiel-parcours">
          {state.step === 1 ? (
            <ModeStep
              mode={state.mode}
              historicalBasis={state.historicalBasis}
              needsCurrentYearEstimate={state.needsCurrentYearEstimate}
              years={years}
              onSelectMode={setMode}
              onSelectHistoricalBasis={setHistoricalBasis}
              onSetNeedsCurrentYearEstimate={setNeedsCurrentYearEstimate}
              simplifiedMode={isSimplified}
            />
          ) : (
            <div className="premium-card premium-card--guide sim-card--guide per-potentiel-stage">
              <div className="per-potentiel-stage-header sim-card__header sim-card__header--bleed">
                <div className="sim-card__title-row">
                  <div className="sim-card__icon">
                    <IconFileText />
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

                {state.step === 3 &&
                  state.mode === 'versement-n' &&
                  state.historicalBasis === 'previous-avis-plus-n1' && (
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
                      onUpdateDeclarant={(decl, patch) =>
                        updateDeclarant('revenus-n1', decl, patch)
                      }
                      onUpdateDeclarants={(patches) => updateDeclarants('revenus-n1', patches)}
                    />
                  )}

                {state.step === 3 &&
                  state.mode === 'versement-n' &&
                  state.historicalBasis === 'current-avis' && (
                    <SituationFiscaleStep
                      variant="versements-n"
                      yearLabel={`${years.currentTaxYear}`}
                      showFoyerCard={showProjectionDetailInputs}
                      showIncomeCard={showProjectionDetailInputs}
                      situationFamiliale={state.projectionSituationFamiliale}
                      isole={state.projectionIsole}
                      children={state.projectionChildren}
                      isCouple={versementNIsCouple}
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
                      onUpdateDeclarant={(decl, patch) =>
                        updateDeclarant('projection-n', decl, patch)
                      }
                      onUpdateDeclarants={(patches) => updateDeclarants('projection-n', patches)}
                    />
                  )}

                {state.step === 4 &&
                  state.mode === 'versement-n' &&
                  state.historicalBasis === 'previous-avis-plus-n1' && (
                    <SituationFiscaleStep
                      variant="versements-n"
                      yearLabel={`${years.currentTaxYear}`}
                      showFoyerCard={showProjectionDetailInputs}
                      showIncomeCard={showProjectionDetailInputs}
                      situationFamiliale={state.projectionSituationFamiliale}
                      isole={state.projectionIsole}
                      children={state.projectionChildren}
                      isCouple={versementNIsCouple}
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
                      onUpdateDeclarant={(decl, patch) =>
                        updateDeclarant('projection-n', decl, patch)
                      }
                      onUpdateDeclarants={(patches) => updateDeclarants('projection-n', patches)}
                    />
                  )}
              </div>
            </div>
          )}
        </div>
      </SimPageShell.Main>

      <SimPageShell.Side className="per-potentiel-context">
        {pageUX.synthesisReady ? (
          <PerPotentielContextSidebar
            anchorId={pageUX.synthesisTargetId ?? 'per-potentiel-synthese'}
            step={state.step}
            isCouple={activeIsCouple}
            showRevenusPreview={isRevenusStep}
            showAdjustedPotentiel={isRevenusStep || isVersementNStep}
            fiscalPreviewTitle={fiscalPreviewTitle}
            projectionPreviewTitle={projectionPreviewTitle}
            showProjectedPlafondCalcule={showProjectedPlafondCalcule}
            parcoursPills={parcoursPills}
            totalAvisIrD1={totalAvisIrD1}
            totalAvisIrD2={totalAvisIrD2}
            result={result}
          />
        ) : (
          <SimEmptyState
            variant="sidebar"
            illustration={pageUX.emptyState?.illustration ?? 'docs'}
            title={pageUX.emptyState?.title ?? 'Synthèse en attente'}
            description={pageUX.emptyState?.description}
          />
        )}
      </SimPageShell.Side>

      <SimPageShell.Section>
        <PerHypotheses />
      </SimPageShell.Section>
    </SimPageShell>
  );
}
