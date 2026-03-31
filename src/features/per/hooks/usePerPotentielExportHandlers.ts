import { useCallback, useState } from 'react';
import type { PerPotentielResult } from '../../../engine/per';
import type { ThemeColors } from '../../../settings/theme';
import type { LogoPlacement } from '../../../pptx/theme/types';
import { exportPerPotentielExcel, type PerPotentielExcelState } from '../export/perPotentielExcelExport';

interface UsePerPotentielExportHandlersParams {
  state: PerPotentielExcelState;
  result: PerPotentielResult | null;
  pptxColors: ThemeColors;
  cabinetLogo?: string;
  logoPlacement?: LogoPlacement;
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
      await exportPerPotentielExcel(state, result, pptxColors.c1, pptxColors.c7);
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
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      await exportPerPotentielPptx(
        {
          mode: state.mode,
          avisIrConnu: state.avisIrConnu,
          situationFamiliale: state.situationFamiliale,
          nombreParts: state.nombreParts,
          isole: state.isole,
          mutualisationConjoints: state.mutualisationConjoints,
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
