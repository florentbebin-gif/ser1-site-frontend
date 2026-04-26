import { useCallback, useState } from 'react';
import type { PerPotentielResult } from '@/engine/per';
import type { FiscalContext } from '@/hooks/useFiscalContext';
import type { LogoPlacement } from '@/pptx/theme/types';
import type { ThemeColors } from '@/settings/theme';
import { exportPerPotentielExcel, type PerPotentielExcelState } from '../export/perPotentielExcelExport';
import { getPerWorkflowYears } from '../utils/perWorkflowYears';
import { shouldUseProjectionForCalculation, type PerProjectionScopeStep } from '../utils/perProjectionScope';

type ProjectionAwarePerState = PerPotentielExcelState & Partial<{
  step: number;
  projectionSituationFamiliale: 'celibataire' | 'marie';
  projectionNombreParts: number;
  projectionIsole: boolean;
  projectionMutualisationConjoints: boolean;
}>;

interface UsePerPotentielExportHandlersParams {
  state: ProjectionAwarePerState;
  result: PerPotentielResult | null;
  pptxColors: ThemeColors;
  cabinetLogo?: string;
  logoPlacement?: LogoPlacement;
  fiscalContext: FiscalContext;
}

function usesProjectionResult(state: ProjectionAwarePerState): boolean {
  return shouldUseProjectionForCalculation({
    step: (state.step ?? 4) as PerProjectionScopeStep,
    mode: state.mode ?? null,
    historicalBasis: state.historicalBasis,
    needsCurrentYearEstimate: state.needsCurrentYearEstimate,
  });
}

function getExportState(state: ProjectionAwarePerState): PerPotentielExcelState {
  if (!usesProjectionResult(state)) {
    return state;
  }

  return {
    ...state,
    situationFamiliale: state.projectionSituationFamiliale ?? state.situationFamiliale,
    nombreParts: state.projectionNombreParts ?? state.nombreParts,
    isole: state.projectionIsole ?? state.isole,
    mutualisationConjoints: state.projectionMutualisationConjoints ?? state.mutualisationConjoints,
  };
}

function resolvePassReference(passHistory: Record<number, number>, anneeRef: number): number {
  const direct = passHistory[anneeRef];
  if (direct != null) return direct;

  const fallbackYear = Object.keys(passHistory)
    .map(Number)
    .filter((year) => Number.isFinite(year) && year <= anneeRef)
    .sort((left, right) => right - left)[0];

  return fallbackYear != null ? passHistory[fallbackYear] ?? 0 : 0;
}

export function usePerPotentielExportHandlers({
  state,
  result,
  pptxColors,
  cabinetLogo,
  logoPlacement,
  fiscalContext,
}: UsePerPotentielExportHandlersParams) {
  const [exportLoading, setExportLoading] = useState(false);

  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      await exportPerPotentielExcel(getExportState(state), result, pptxColors.c1, pptxColors.c7);
    } catch (errorExport) {
      const err = errorExport instanceof Error ? errorExport : new Error(String(errorExport));
      console.error('[PerPotentielExcel] Export failed', {
        err: errorExport,
        message: err.message,
        stack: err.stack,
      });
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, result, pptxColors]);

  const exportPowerPoint = useCallback(async () => {
    if (!result || !state.mode) {
      alert('Les résultats ne sont pas disponibles.');
      return;
    }

    setExportLoading(true);
    try {
      const { exportPerPotentielPptx } = await import('@/pptx/exports/perExport');
      const exportState = getExportState(state);
      const years = getPerWorkflowYears(fiscalContext);
      const exportUsesProjection = usesProjectionResult(state);
      const anneeRef = exportUsesProjection ? years.currentTaxYear : years.currentIncomeYear;
      const usesPreviousScale = anneeRef === years.previousIncomeYear;
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      await exportPerPotentielPptx(
        {
          mode: state.mode,
          historicalBasis: state.historicalBasis,
          needsCurrentYearEstimate: state.needsCurrentYearEstimate,
          situationFamiliale: exportState.situationFamiliale,
          nombreParts: exportState.nombreParts,
          isole: exportState.isole,
          mutualisationConjoints: exportState.mutualisationConjoints,
          versementEnvisage: state.versementEnvisage,
          result,
          anneeRef,
          passReference: resolvePassReference(fiscalContext.passHistoryByYear, anneeRef),
          irScale: usesPreviousScale ? fiscalContext.irScalePrevious : fiscalContext.irScaleCurrent,
          irScaleLabel: usesPreviousScale ? fiscalContext.irPreviousYearLabel : fiscalContext.irCurrentYearLabel,
        },
        pptxColors,
        {
          filename: `simulation-per-potentiel-${dateStr}.pptx`,
          logoUrl: cabinetLogo,
          logoPlacement,
        },
      );
    } catch (errorExport) {
      const err = errorExport instanceof Error ? errorExport : new Error(String(errorExport));
      console.error('[PerPotentielPPTX] Export failed', {
        err: errorExport,
        message: err.message,
        stack: err.stack,
      });
      alert('Impossible de générer le fichier PowerPoint.');
    } finally {
      setExportLoading(false);
    }
  }, [state, result, pptxColors, cabinetLogo, logoPlacement, fiscalContext]);

  return { exportExcel, exportPowerPoint, exportLoading };
}
