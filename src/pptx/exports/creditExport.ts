/**
 * Export PPTX Crédit
 * 
 * API simplifiée pour exporter une simulation de crédit en PPTX.
 * Wrappe le builder existant et l'orchestrateur d'export.
 */

import { buildCreditStudyDeck, type CreditData, type AdvisorInfo } from '../presets/creditDeckBuilder';
import { exportAndDownloadStudyDeck } from '../export/exportStudyDeck';
import type { LogoPlacement } from '../theme/types';

/**
 * Theme colors format (from ThemeProvider)
 */
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

/**
 * Export options
 */
export interface CreditExportOptions {
  /** Output filename (without .pptx extension) */
  filename?: string;
  /** Advisor info for cover slide */
  advisor?: AdvisorInfo;
  /** Optional logo URL from Supabase Storage */
  logoUrl?: string;
  /** Logo placement on cover slide */
  logoPlacement?: LogoPlacement;
}

/**
 * Export Credit simulation results to PPTX
 * 
 * @param creditData - Credit simulation results from creditEngine
 * @param themeColors - Theme colors from ThemeProvider (pptxColors)
 * @param options - Export options
 * @returns Promise that resolves when download starts
 * 
 * @example
 * ```typescript
 * const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
 * const creditData = useCredit(); // your hook
 * 
 * await exportCreditPptx(creditData, pptxColors, {
 *   filename: 'Simulation-Credit-Client',
 *   logoUrl: cabinetLogo,
 *   logoPlacement,
 *   advisor: { name: 'Jean Dupont' }
 * });
 * ```
 */
export async function exportCreditPptx(
  creditData: CreditData,
  themeColors: ThemeColorsForExport,
  options: CreditExportOptions = {}
): Promise<void> {
  const { filename = 'Simulation-Credit', advisor, logoUrl, logoPlacement } = options;

  // Build the deck specification using the existing builder
  const spec = buildCreditStudyDeck(creditData, themeColors, logoUrl, logoPlacement, advisor);

  // Export and download
  await exportAndDownloadStudyDeck(spec, themeColors, filename, {
    locale: 'fr-FR',
    showSlideNumbers: true,
  });
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use exportCreditPptx instead
 */
export async function generateCreditPptx(): Promise<void> {
  console.warn('[PPTX] generateCreditPptx is deprecated. Use exportCreditPptx instead.');
}

export default {
  exportCreditPptx,
  generateCreditPptx,
};
