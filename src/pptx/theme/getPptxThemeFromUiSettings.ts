/**
 * Convert UI Settings to PPTX Theme Roles
 * 
 * Maps the 10 theme colors from UI settings to semantic PPTX roles.
 * No hardcoded fallback hex values (except white).
 */

import type { UiThemeColors, PptxThemeRoles } from './types';

/**
 * UI Settings shape from ThemeProvider
 * Colors are stored as color1..color10 in the settings
 */
interface UiSettings {
  colors?: {
    color1?: string;
    color2?: string;
    color3?: string;
    color4?: string;
    color5?: string;
    color6?: string;
    color7?: string;
    color8?: string;
    color9?: string;
    color10?: string;
  };
}

/**
 * ThemeColors shape from ThemeProvider (c1..c10 format)
 */
interface ThemeProviderColors {
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
 * Validate that a color string is a valid hex color
 */
function isValidHexColor(color: string | undefined): color is string {
  if (!color) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Calculate relative luminance of a hex color
 * Returns true if color is dark (needs white text), false if light (needs black text)
 */
function isColorDark(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance using sRGB coefficients
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if dark (luminance < 0.5)
  return luminance < 0.5;
}

/**
 * Convert ThemeProvider colors (c1..c10) to UI colors (color1..color10)
 */
function fromThemeProviderFormat(colors: ThemeProviderColors): UiThemeColors {
  return {
    color1: colors.c1,
    color2: colors.c2,
    color3: colors.c3,
    color4: colors.c4,
    color5: colors.c5,
    color6: colors.c6,
    color7: colors.c7,
    color8: colors.c8,
    color9: colors.c9,
    color10: colors.c10,
  };
}

/**
 * Get PPTX Theme Roles from UI Settings
 * 
 * @param uiSettingsOrColors - Either UiSettings object or ThemeProviderColors
 * @returns PptxThemeRoles with all semantic color mappings
 * @throws Error if any required color is missing
 */
export function getPptxThemeFromUiSettings(
  uiSettingsOrColors: UiSettings | ThemeProviderColors
): PptxThemeRoles {
  let colors: UiThemeColors;
  
  // Detect format: ThemeProvider (c1..c10) vs UiSettings (color1..color10)
  if ('c1' in uiSettingsOrColors) {
    colors = fromThemeProviderFormat(uiSettingsOrColors as ThemeProviderColors);
  } else {
    const settings = uiSettingsOrColors as UiSettings;
    if (!settings.colors) {
      throw new Error('PPTX Theme Error: No colors found in UI settings');
    }
    colors = {
      color1: settings.colors.color1 || '',
      color2: settings.colors.color2 || '',
      color3: settings.colors.color3 || '',
      color4: settings.colors.color4 || '',
      color5: settings.colors.color5 || '',
      color6: settings.colors.color6 || '',
      color7: settings.colors.color7 || '',
      color8: settings.colors.color8 || '',
      color9: settings.colors.color9 || '',
      color10: settings.colors.color10 || '',
    };
  }
  
  // Validate all 10 colors are present
  const requiredColors: (keyof UiThemeColors)[] = [
    'color1', 'color2', 'color3', 'color4', 'color5',
    'color6', 'color7', 'color8', 'color9', 'color10'
  ];
  
  for (const key of requiredColors) {
    if (!isValidHexColor(colors[key])) {
      throw new Error(
        `PPTX Theme Error: Missing or invalid ${key}. ` +
        `Expected hex color (e.g., #2B3E37), got: ${colors[key]}`
      );
    }
  }
  
  // Build theme roles
  // Serenity template uses: color1 (main), color6 (accent), color10 (body text)
  
  // Adaptive text color based on background luminance
  const textOnMainColor = isColorDark(colors.color1) ? '#FFFFFF' : '#000000';
  
  const theme: PptxThemeRoles = {
    // Preserve all 10 colors
    colors,
    
    // Constants
    white: '#FFFFFF',
    panelBg: '#FFFFFF',
    
    // Adaptive text on main background
    textOnMain: textOnMainColor,
    
    // Role mappings
    bgMain: colors.color1,
    textMain: colors.color1,
    textBody: colors.color10,
    accent: colors.color6,
    panelBorder: colors.color8, // Softer border color
    shadowBase: colors.color1,
    footerOnLight: colors.color10,
    footerAccent: colors.color6,
  };
  
  return theme;
}

export default getPptxThemeFromUiSettings;
