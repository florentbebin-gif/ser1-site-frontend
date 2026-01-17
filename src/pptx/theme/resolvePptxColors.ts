/**
 * PPTX Theme Color Resolver
 * 
 * Centralizes the logic for selecting PPTX colors based on theme scope.
 * This ensures that PPTX exports NEVER use web theme colors when scope = 'ui-only'.
 */

import type { ThemeColors } from '../../settings/ThemeProvider';

/**
 * SER1 Classic colors - hardcoded fallback for ui-only mode
 * These are the original SER1 theme colors that should be used for PPTX
 * when user selects "Apply theme to UI only"
 */
export const SER1_CLASSIC_COLORS: ThemeColors = {
  c1: '#2B3E37', // Main color (dark green)
  c2: '#709B8B', // Secondary (medium green)
  c3: '#9FBDB2', // Accent (light green)
  c4: '#CFDED8', // Light accent
  c5: '#788781', // Neutral
  c6: '#CEC1B6', // Beige accent
  c7: '#F5F3F0', // Background light
  c8: '#D9D9D9', // Border color (color 8 - panelBorder)
  c9: '#7F7F7F', // Text muted
  c10: '#000000', // Text main
};

/**
 * Resolve PPTX colors based on theme scope
 * 
 * @param webColors - Current web theme colors (from ThemeProvider)
 * @param themeScope - Theme scope: 'all' or 'ui-only'
 * @returns Colors to use for PPTX export
 */
export function resolvePptxColors(
  webColors: ThemeColors,
  themeScope: 'all' | 'ui-only'
): ThemeColors {
  // CRITICAL: When ui-only, NEVER use web colors - always use SER1 Classic
  if (themeScope === 'ui-only') {
    return SER1_CLASSIC_COLORS;
  }
  
  // When 'all', use the user's current web theme colors
  return webColors;
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
