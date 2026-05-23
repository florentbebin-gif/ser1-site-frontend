import { exportAndDownloadStudyDeck } from '@/pptx/export/exportStudyDeck';
import { buildPrevoyanceStudyDeck } from '@/pptx/presets/prevoyanceDeckBuilder';
import type { LogoPlacement } from '@/pptx/theme/types';
import type { ThemeColors } from '@/settings/theme';
import type { PrevoyanceExportData } from './prevoyanceExportData';

interface PrevoyancePptxExportOptions {
  logoUrl?: string;
  logoPlacement?: LogoPlacement;
}

export async function exportPrevoyancePptx(
  data: PrevoyanceExportData,
  themeColors: ThemeColors,
  options: PrevoyancePptxExportOptions = {},
): Promise<void> {
  const dateStr = new Date().toISOString().split('T')[0] ?? 'date';
  const deck = buildPrevoyanceStudyDeck(data, themeColors, options.logoUrl, options.logoPlacement);

  await exportAndDownloadStudyDeck(deck, themeColors, `simulation-prevoyance-${dateStr}.pptx`, {
    locale: 'fr-FR',
    showSlideNumbers: true,
  });
}
