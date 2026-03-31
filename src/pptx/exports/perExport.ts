import { buildPerStudyDeck, type PerDeckData, type PerAdvisorInfo, type PerUiSettingsForPptx } from '../presets/perDeckBuilder';
import { exportAndDownloadStudyDeck } from '../export/exportStudyDeck';
import type { LogoPlacement } from '../theme/types';

export interface PerExportOptions {
  filename?: string;
  advisor?: PerAdvisorInfo;
  logoUrl?: string;
  logoPlacement?: LogoPlacement;
}

export async function exportPerPotentielPptx(
  data: PerDeckData,
  themeColors: PerUiSettingsForPptx,
  options: PerExportOptions = {},
): Promise<void> {
  const { filename = 'simulation-per-potentiel', advisor, logoUrl, logoPlacement } = options;
  const spec = buildPerStudyDeck(data, themeColors, logoUrl, logoPlacement, advisor);

  await exportAndDownloadStudyDeck(spec, themeColors, filename, {
    locale: 'fr-FR',
    showSlideNumbers: true,
  });
}

export type { PerDeckData, PerAdvisorInfo };
