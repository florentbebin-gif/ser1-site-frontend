/**
 * Export PPTX PER (P1-03)
 *
 * API simplifiée pour exporter une simulation PER en PPTX.
 */

import { buildPerStudyDeck, type PerData, type AdvisorInfo } from '../presets/perDeckBuilder';
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

export interface PerExportOptions {
  filename?: string;
  advisor?: AdvisorInfo;
  logoUrl?: string;
  logoPlacement?: LogoPlacement;
}

export async function exportPerPptx(
  data: PerData,
  themeColors: ThemeColorsForExport,
  options: PerExportOptions = {},
): Promise<void> {
  const { filename = 'Simulation-PER', advisor, logoUrl, logoPlacement } = options;

  const spec = buildPerStudyDeck(data, themeColors, logoUrl, logoPlacement, advisor);

  await exportAndDownloadStudyDeck(spec, themeColors, filename, {
    locale: 'fr-FR',
    showSlideNumbers: true,
  });
}

export type { PerData, AdvisorInfo };
