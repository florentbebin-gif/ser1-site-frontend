/**
 * Export PPTX IR (Impôt sur le Revenu)
 * 
 * API simplifiée pour exporter une simulation IR en PPTX.
 * Wrappe le builder existant et l'orchestrateur d'export.
 */

import { buildIrStudyDeck, type IrData, type AdvisorInfo } from '../presets/irDeckBuilder';
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
export interface IrExportOptions {
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
 * Export IR simulation results to PPTX
 * 
 * @param irData - IR simulation results from irEngine
 * @param themeColors - Theme colors from ThemeProvider (pptxColors)
 * @param options - Export options
 * @returns Promise that resolves when download starts
 * 
 * @example
 * ```typescript
 * const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
 * const irData = useIr(); // your hook
 * 
 * await exportIrPptx(irData, pptxColors, {
 *   filename: 'Simulation-IR-Client',
 *   logoUrl: cabinetLogo,
 *   logoPlacement,
 *   advisor: { name: 'Jean Dupont' }
 * });
 * ```
 */
export async function exportIrPptx(
  irData: IrData,
  themeColors: ThemeColorsForExport,
  options: IrExportOptions = {}
): Promise<void> {
  const { filename = 'Simulation-IR', advisor, logoUrl, logoPlacement } = options;

  // Build the deck specification using the existing builder
  const spec = buildIrStudyDeck(irData, themeColors, logoUrl, logoPlacement, advisor);

  // Export and download
  await exportAndDownloadStudyDeck(spec, themeColors, filename, {
    locale: 'fr-FR',
    showSlideNumbers: true,
  });
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use exportIrPptx instead
 */
export async function generateIRPptx(): Promise<void> {
  console.warn('[PPTX] generateIRPptx is deprecated. Use exportIrPptx instead.');
}

export default {
  exportIrPptx,
  generateIRPptx,
};
