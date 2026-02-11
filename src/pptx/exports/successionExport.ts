/**
 * Export PPTX Succession (P1-02)
 *
 * API simplifiée pour exporter une simulation succession en PPTX.
 */

import { buildSuccessionStudyDeck, type SuccessionData, type AdvisorInfo } from '../presets/successionDeckBuilder';
import { exportAndDownloadStudyDeck } from '../export/exportStudyDeck';
import type { LogoPlacement } from '../theme/types';

export interface ThemeColorsForExport {
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

export interface SuccessionExportOptions {
  filename?: string;
  advisor?: AdvisorInfo;
  logoUrl?: string;
  logoPlacement?: LogoPlacement;
}

export async function exportSuccessionPptx(
  data: SuccessionData,
  themeColors: ThemeColorsForExport,
  options: SuccessionExportOptions = {},
): Promise<void> {
  const { filename = 'Simulation-Succession', advisor, logoUrl, logoPlacement } = options;

  const spec = buildSuccessionStudyDeck(data, themeColors, logoUrl, logoPlacement, advisor);

  await exportAndDownloadStudyDeck(spec, themeColors, filename, {
    locale: 'fr-FR',
    showSlideNumbers: true,
  });
}

export type { SuccessionData, AdvisorInfo };
