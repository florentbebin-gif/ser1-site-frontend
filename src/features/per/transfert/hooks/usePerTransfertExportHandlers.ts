import { useMemo, useState } from 'react';
import type { ExportOption } from '@/components/export/exportTypes';
import type { LogoPlacement } from '@/pptx/theme/types';
import type { BaseCgRetraiteContract } from '@/data/basecg';
import type { PerTransfertInput, PerTransfertResult } from '@/engine/per';
import type { PerTransfertFormState } from './usePerTransfertSimulator';

interface ThemeColorsForExport {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

interface UsePerTransfertExportHandlersInput {
  state: PerTransfertFormState;
  input: PerTransfertInput;
  result: PerTransfertResult;
  selectedContract: BaseCgRetraiteContract | null;
  themeColors: ThemeColorsForExport;
  logoUrl?: string;
  logoPlacement?: LogoPlacement;
}

export function usePerTransfertExportHandlers({
  state,
  input,
  result,
  selectedContract,
  themeColors,
  logoUrl,
  logoPlacement,
}: UsePerTransfertExportHandlersInput) {
  const [exportLoading, setExportLoading] = useState(false);

  const exportOptions = useMemo<ExportOption[]>(
    () => [
      {
        label: 'PowerPoint étude',
        disabled: state.capitalAcquis <= 0,
        tooltip:
          state.capitalAcquis <= 0 ? 'Renseigner le capital acquis avant export.' : undefined,
        onClick: async () => {
          setExportLoading(true);
          try {
            const { exportPerTransfertPptx } = await import('@/pptx/exports/perTransfertExport');
            await exportPerTransfertPptx(
              {
                input,
                result,
                selectedContract,
              },
              themeColors,
              {
                logoUrl,
                logoPlacement,
              },
            );
          } catch (error) {
            console.error('[PER Transfert] Export PPTX impossible', error);
            alert("Impossible de générer l'export PowerPoint.");
          } finally {
            setExportLoading(false);
          }
        },
      },
    ],
    [input, logoPlacement, logoUrl, result, selectedContract, state.capitalAcquis, themeColors],
  );

  return { exportOptions, exportLoading };
}
