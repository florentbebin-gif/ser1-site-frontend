import { useMemo, useState, useCallback } from 'react';
import type { ExportOption } from '@/components/export/exportTypes';
import type { LogoPlacement } from '@/pptx/theme/types';
import type { ThemeColors } from '@/settings/theme';
import type {
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';
import { buildPrevoyanceExportData } from '../export/prevoyanceExportData';
import { exportPrevoyancePptx } from '../export/prevoyancePptx';
import { exportPrevoyanceXlsx } from '../export/prevoyanceXlsx';

interface UsePrevoyanceExportHandlersInput {
  situation: PrevoyanceSituationDraft;
  kind: PrevoyanceContractKind;
  regime: PrevoyanceRegimeSettings | null;
  maintien: PrevoyanceMaintienEmployeurSettings | null;
  contracts: PrevoyanceContractDraft[];
  annualBase: number;
  referenceAnnual: number;
  themeColors: ThemeColors;
  cabinetLogo?: string;
  logoPlacement?: LogoPlacement;
}

export function usePrevoyanceExportHandlers({
  situation,
  kind,
  regime,
  maintien,
  contracts,
  annualBase,
  referenceAnnual,
  themeColors,
  cabinetLogo,
  logoPlacement,
}: UsePrevoyanceExportHandlersInput) {
  const [exportLoading, setExportLoading] = useState(false);
  const exportDisabled = contracts.length === 0;
  const exportData = useMemo(
    () =>
      buildPrevoyanceExportData({
        situation,
        kind,
        regime,
        maintien,
        contracts,
        annualBase,
        referenceAnnual,
      }),
    [annualBase, contracts, kind, maintien, referenceAnnual, regime, situation],
  );

  const handleExportPptx = useCallback(async () => {
    if (exportDisabled) return;
    setExportLoading(true);
    try {
      await exportPrevoyancePptx(exportData, themeColors, {
        logoUrl: cabinetLogo,
        logoPlacement,
      });
    } finally {
      setExportLoading(false);
    }
  }, [cabinetLogo, exportData, exportDisabled, logoPlacement, themeColors]);

  const handleExportXlsx = useCallback(async () => {
    if (exportDisabled) return;
    setExportLoading(true);
    try {
      await exportPrevoyanceXlsx(exportData, themeColors.c1, themeColors.c7);
    } finally {
      setExportLoading(false);
    }
  }, [exportData, exportDisabled, themeColors]);

  const exportOptions = useMemo<ExportOption[]>(
    () => [
      {
        label: 'PowerPoint',
        onClick: handleExportPptx,
        disabled: exportDisabled,
        tooltip: exportDisabled ? 'Ajoutez au moins un contrat pour exporter.' : undefined,
      },
      {
        label: 'Excel',
        onClick: handleExportXlsx,
        disabled: exportDisabled,
        tooltip: exportDisabled ? 'Ajoutez au moins un contrat pour exporter.' : undefined,
      },
    ],
    [exportDisabled, handleExportPptx, handleExportXlsx],
  );

  return { exportOptions, exportLoading, exportData };
}
