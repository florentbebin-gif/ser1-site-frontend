/**
 * useSuccessionExportHandlers — Handlers export PPTX / XLSX du simulateur Succession.
 *
 * Extrait de SuccessionSimulator.tsx (PR-P1-07-03).
 * Gère l'état exportLoading et expose les callbacks et options du menu export.
 */

import { useState, useCallback } from 'react';
import { exportSuccessionPptx, type ThemeColorsForExport } from '../../../pptx/exports/successionExport';
import { exportAndDownloadSuccessionXlsx } from '../export/successionXlsx';
import type { LienParente } from '../../../engine/succession';
import type { LogoPlacement } from '../../../pptx/theme/types';

interface UseSuccessionExportHandlersInput {
  canExport: boolean;
  canExportSimplified: boolean;
  canExportCurrentMode: boolean;
  pptxColors: ThemeColorsForExport;

  cabinetLogo: string | undefined;
  logoPlacement: LogoPlacement | undefined;
  chainageExportPayload: Parameters<typeof exportSuccessionPptx>[0]['predecesChronologie'];
  annexBeneficiarySteps: Parameters<typeof exportSuccessionPptx>[0]['annexBeneficiarySteps'];
  familyContext: Parameters<typeof exportSuccessionPptx>[0]['familyContext'];
  assetAnnex: Parameters<typeof exportSuccessionPptx>[0]['assetAnnex'];
  displayUsesChainage: boolean;
  directDisplayResult: { detailHeritiers?: unknown[]; totalDroits: number } | null | undefined;
  derivedMasseTransmise: number;
  synthDonutTransmis: number;

  derivedTotalDroits: number;
  exportHeirs: Array<{ lien: LienParente; partSuccession: number }>;
  assumptions: string[];
}

export function useSuccessionExportHandlers({
  canExport,
  canExportSimplified,
  canExportCurrentMode,
  pptxColors,
  cabinetLogo,
  logoPlacement,
  chainageExportPayload,
  annexBeneficiarySteps,
  familyContext,
  assetAnnex,
  displayUsesChainage,
  directDisplayResult,
  derivedMasseTransmise,
  synthDonutTransmis,
  derivedTotalDroits,
  exportHeirs,
  assumptions,
}: UseSuccessionExportHandlersInput) {
  const [exportLoading, setExportLoading] = useState(false);
  const exportMasseTransmise = displayUsesChainage ? synthDonutTransmis : derivedMasseTransmise;

  const handleExportPptx = useCallback(async () => {
    if (!canExport) return;
    try {
      setExportLoading(true);
      if (canExportSimplified) {
        await exportSuccessionPptx(
          {
            actifNetSuccession: exportMasseTransmise,
            totalDroits: derivedTotalDroits,
            tauxMoyenGlobal: exportMasseTransmise > 0
              ? (derivedTotalDroits / exportMasseTransmise) * 100
              : 0,
            heritiers: displayUsesChainage ? [] : (directDisplayResult?.detailHeritiers ?? []) as Parameters<typeof exportSuccessionPptx>[0]['heritiers'],
            predecesChronologie: chainageExportPayload,
            annexBeneficiarySteps,
            familyContext,
            assetAnnex,
            assumptions,
          },
          pptxColors,
          { logoUrl: cabinetLogo, logoPlacement },
        );
      }
    } finally {
      setExportLoading(false);
    }
  }, [
    canExport,
    canExportSimplified,
    pptxColors,
    cabinetLogo,
    logoPlacement,
    chainageExportPayload,
    annexBeneficiarySteps,
    familyContext,
    assetAnnex,
    displayUsesChainage,
    directDisplayResult,
    exportMasseTransmise,
    derivedTotalDroits,
    assumptions,
  ]);

  const handleExportXlsx = useCallback(async () => {
    if (!canExport) return;
    try {
      setExportLoading(true);
      if (canExportSimplified) {
        await exportAndDownloadSuccessionXlsx(
          {
            actifNetSuccession: exportMasseTransmise,
            nbHeritiers: exportHeirs.length,
            heritiers: exportHeirs,
          },
          displayUsesChainage ? null : (directDisplayResult ?? null) as Parameters<typeof exportAndDownloadSuccessionXlsx>[1],
          pptxColors.c1,
          undefined,
          chainageExportPayload,
          pptxColors.c7,
          assumptions,
        );
      }
    } finally {
      setExportLoading(false);
    }
  }, [
    canExport,
    canExportSimplified,
    pptxColors,
    chainageExportPayload,
    displayUsesChainage,
    directDisplayResult,
    exportMasseTransmise,
    exportHeirs,
    assumptions,
  ]);

  const exportOptions = [
    {
      label: 'PowerPoint',
      onClick: handleExportPptx,
      disabled: !canExportCurrentMode,
      tooltip: !canExportCurrentMode
        ? 'Renseignez le contexte familial et les actifs pour exporter la chronologie.'
        : undefined,
    },
    {
      label: 'Excel',
      onClick: handleExportXlsx,
      disabled: !canExportCurrentMode,
      tooltip: !canExportCurrentMode
        ? 'Renseignez le contexte familial et les actifs pour exporter la chronologie.'
        : undefined,
    },
  ];

  return { handleExportPptx, handleExportXlsx, exportOptions, exportLoading };
}
