import {
  buildPerTransfertStudyDeck,
  type PerTransfertAdvisorInfo,
  type PerTransfertDeckData,
  type PerTransfertUiSettingsForPptx,
} from '../presets/perTransfertDeckBuilder';
import { exportAndDownloadStudyDeck } from '../export/exportStudyDeck';
import type { LogoPlacement } from '../theme/types';

export interface PerTransfertExportOptions {
  filename?: string;
  advisor?: PerTransfertAdvisorInfo;
  logoUrl?: string;
  logoPlacement?: LogoPlacement;
}

export async function exportPerTransfertPptx(
  data: PerTransfertDeckData,
  themeColors: PerTransfertUiSettingsForPptx,
  options: PerTransfertExportOptions = {},
): Promise<void> {
  const { filename = 'simulation-per-transfert', advisor, logoUrl, logoPlacement } = options;
  const spec = buildPerTransfertStudyDeck(data, themeColors, logoUrl, logoPlacement, advisor);

  await exportAndDownloadStudyDeck(spec, themeColors, filename, {
    locale: 'fr-FR',
    showSlideNumbers: true,
  });
}

export type { PerTransfertAdvisorInfo, PerTransfertDeckData };
