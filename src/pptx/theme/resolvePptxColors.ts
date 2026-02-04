/**
 * PPTX Theme Color Resolver
 * 
 * Centralizes the logic for selecting PPTX colors based on theme scope.
 * This ensures that PPTX exports NEVER use web theme colors when scope = 'ui-only'.
 */

import { DEFAULT_COLORS, type ThemeColors } from '../../settings/theme';

/**
 * SER1 Classic colors - fallback for ui-only mode
 * Uses DEFAULT_COLORS from centralized theme settings
 */
export const SER1_CLASSIC_COLORS: ThemeColors = { ...DEFAULT_COLORS };

/**
 * Resolve PPTX colors based on cabinet colors, theme scope, and original theme
 * 
 * RÈGLE MÉTIER:
 * - Si cabinetColors disponible → TOUJOURS utiliser cabinetColors (R2)
 * - Sinon (sans cabinet):
 *   - Si themeScope === 'all' → utiliser webColors (custom user)
 *   - Sinon → utiliser originalColors (Thème Original DB) ou fallback SER1_CLASSIC
 * 
 * @param webColors - Current web theme colors (custom user colors)
 * @param themeScope - Theme scope ('all' = UI+PPTX, 'ui-only' = UI only)
 * @param cabinetColors - Cabinet colors loaded at login (null if no cabinet)
 * @param originalColors - Thème Original from DB (null if not loaded)
 * @returns Colors to use for PPTX export
 */
export function resolvePptxColors(
  webColors: ThemeColors,
  themeScope: 'all' | 'ui-only',
  cabinetColors?: ThemeColors | null,
  originalColors?: ThemeColors | null
): ThemeColors {
  // PRIORITÉ 1: Si cabinetColors disponible → TOUJOURS utiliser pour PPTX (R2)
  if (cabinetColors) {
    return cabinetColors;
  }
  
  // PRIORITÉ 2: Sans cabinet
  // Si themeScope = 'all' → utiliser les couleurs custom de l'user (R1)
  if (themeScope === 'all') {
    return webColors;
  }
  
  // PRIORITÉ 3: themeScope = 'ui-only' → utiliser Thème Original (R1)
  if (originalColors) {
    return originalColors;
  }
  
  // Fallback ultime: DEFAULT_COLORS from centralized theme
  return DEFAULT_COLORS;
}

/**
 * Get the role-based color mapping for PPTX theme
 * This maps the 10 color slots to semantic PPTX roles
 */
export function getPptxColorRoles(colors: ThemeColors) {
  return {
    bgMain: colors.c1,        // Slide background
    accent: colors.c6,        // Accent lines, highlights
    textMain: colors.c10,     // Main text (titles, important)
    textBody: colors.c9,      // Body text, secondary
    textOnMain: colors.c7,    // Text on colored backgrounds
    panelBorder: colors.c8,   // Panel borders (color 8 role)
    shadowBase: colors.c10,   // Shadow color (derived from main text)
    // Additional semantic mappings available as needed
    bgLight: colors.c7,
    bgAccent: colors.c4,
    borderLight: colors.c8,
  };
}

export default {
  resolvePptxColors,
  getPptxColorRoles,
  SER1_CLASSIC_COLORS,
};
