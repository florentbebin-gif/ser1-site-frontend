import { useCallback, useState } from 'react';
import type { LogoPlacement } from '@/pptx/theme/types';
import type { ThemeColors } from '@/settings/theme';
import type { TresoInputs, TresoProjectionRow } from '@/engine/tresorerie/types';
import type { TresoKPIs } from './useTresorerieCalculations';
import { exportTresorerieExcel } from '../export/tresorerieExcelExport';

interface UseTresorerieExportHandlersParams {
  rows: TresoProjectionRow[];
  kpis: TresoKPIs;
  inputs: TresoInputs;
  themeColors: ThemeColors;
  pptxColors: ThemeColors;
  cabinetLogo?: string;
  logoPlacement?: LogoPlacement;
}

export function useTresorerieExportHandlers({
  rows,
  kpis,
  inputs,
  themeColors,
  pptxColors,
  cabinetLogo,
  logoPlacement,
}: UseTresorerieExportHandlersParams) {
  const [exportLoading, setExportLoading] = useState(false);
  const exportDisabled = rows.length === 0 || !kpis.hasRows;

  const exportExcel = useCallback(async () => {
    if (exportDisabled) {
      alert('La projection doit être disponible avant de générer le fichier Excel.');
      return;
    }

    setExportLoading(true);
    try {
      await exportTresorerieExcel(rows, kpis, inputs, themeColors.c1, themeColors.c7);
    } catch (errorExport) {
      const err = errorExport instanceof Error ? errorExport : new Error(String(errorExport));
      console.error('[TresorerieExcel] Export échoué', {
        err: errorExport,
        message: err.message,
        stack: err.stack,
      });
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [exportDisabled, rows, kpis, inputs, themeColors]);

  const exportPptx = useCallback(async () => {
    if (exportDisabled) {
      alert('La projection doit être disponible avant de générer le PowerPoint.');
      return;
    }

    setExportLoading(true);
    try {
      const [{ buildTresorerieStudyDeck }, { exportAndDownloadStudyDeck }] = await Promise.all([
        import('../export/tresoreriePptxWrapper'),
        import('@/pptx/export/exportStudyDeck'),
      ]);
      const deck = buildTresorerieStudyDeck({ rows, kpis, inputs }, cabinetLogo, logoPlacement);
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');

      await exportAndDownloadStudyDeck(
        deck,
        pptxColors,
        `simulation-tresorerie-societe-${dateStr}.pptx`,
        {
          locale: 'fr-FR',
          showSlideNumbers: true,
        },
      );
    } catch (errorExport) {
      const err = errorExport instanceof Error ? errorExport : new Error(String(errorExport));
      console.error('[TresoreriePPTX] Export échoué', {
        err: errorExport,
        message: err.message,
        stack: err.stack,
      });
      alert('Impossible de générer le fichier PowerPoint.');
    } finally {
      setExportLoading(false);
    }
  }, [exportDisabled, rows, kpis, inputs, cabinetLogo, logoPlacement, pptxColors]);

  return { exportExcel, exportPptx, exportLoading, exportDisabled };
}
