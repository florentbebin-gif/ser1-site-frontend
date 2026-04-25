import { useCallback, useState } from 'react';
import type { PerPotentielResult } from '../../../engine/per';
import type { ThemeColors } from '../../../settings/theme';
import type { LogoPlacement } from '../../../pptx/theme/types';
import { exportPerPotentielExcel, type PerPotentielExcelState } from '../export/perPotentielExcelExport';

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
}

function usesProjectionResult(state: ProjectionAwarePerState): boolean {
  return state.mode === 'versement-n' && (
    state.historicalBasis === 'current-avis' ||
    state.needsCurrentYearEstimate ||
    (state.historicalBasis === 'previous-avis-plus-n1' && state.step === 4)
  );
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

export function usePerPotentielExportHandlers({
  state,
  result,
  pptxColors,
  cabinetLogo,
  logoPlacement,
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
      alert('Impossible de generer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, result, pptxColors]);

  const exportPowerPoint = useCallback(async () => {
    if (!result || !state.mode) {
      alert('Les resultats ne sont pas disponibles.');
      return;
    }

    setExportLoading(true);
    try {
      const { exportPerPotentielPptx } = await import('../../../pptx/exports/perExport');
      const exportState = getExportState(state);
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
      alert('Impossible de generer le fichier PowerPoint.');
    } finally {
      setExportLoading(false);
    }
  }, [state, result, pptxColors, cabinetLogo, logoPlacement]);

  return { exportExcel, exportPowerPoint, exportLoading };
}
