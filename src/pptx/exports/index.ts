/**
 * PPTX Simulator Exports
 * 
 * API simplifiées pour exporter les simulations en PPTX.
 * 
 * @example
 * ```typescript
 * import { exportIrPptx, exportCreditPptx } from '@/pptx/exports';
 * 
 * // Dans un composant simulateur
 * const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
 * 
 * const handleExport = async () => {
 *   await exportIrPptx(irData, pptxColors, {
 *     filename: 'Simulation-IR-Client',
 *     logoUrl: cabinetLogo,
 *     logoPlacement,
 *   });
 * };
 * ```
 */

export { exportIrPptx, type IrExportOptions, type ThemeColorsForExport as IrThemeColors } from './irExport';
export { exportCreditPptx, type CreditExportOptions, type ThemeColorsForExport as CreditThemeColors } from './creditExport';
