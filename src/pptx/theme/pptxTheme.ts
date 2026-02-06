/**
 * Thème PPTX dynamique basé sur les settings utilisateur
 * 
 * Règle stricte : AUCUNE couleur hex codée en dur sauf blanc (#FFFFFF)
 * Toutes les couleurs viennent du thème utilisateur (settings)
 */

import { DEFAULT_COLORS, type ThemeColors } from '../../settings/theme';

// Interface pour le thème PPTX
export interface PptxTheme {
  bgMain: string;      // Couleur de fond principale
  textMain: string;    // Couleur de texte principale
  accent: string;      // Couleur d'accent
  line: string;        // Couleur des lignes/bordures
  white: string;       // Blanc (toujours #FFFFFF)
}

// Interface pour les settings utilisateur
export interface UiSettings extends ThemeColors {}

/**
 * Convertit les settings utilisateur en thème PPTX
 * 
 * @param uiSettings - Settings de l'interface utilisateur
 * @returns Thème PPTX adapté
 */
export function getPptxThemeFromUiSettings(uiSettings: UiSettings): PptxTheme {
  return {
    // Mapping des couleurs UI vers PPTX
    bgMain: uiSettings.c7,      // Background principal
    textMain: uiSettings.c10,   // Texte principal
    accent: uiSettings.c2,      // Couleur d'accent
    line: uiSettings.c8,        // Bordures et lignes
    white: '#FFFFFF',           // Blanc (seule couleur codée en dur autorisée)
  };
}

/**
 * Thème par défaut (utilise DEFAULT_COLORS depuis src/settings/theme.ts)
 * NOTE: Fallback uniquement, devrait utiliser les settings utilisateur
 */
export const DEFAULT_PPTX_THEME: PptxTheme = {
  bgMain: DEFAULT_COLORS.c7,
  textMain: DEFAULT_COLORS.c10,
  accent: DEFAULT_COLORS.c6,
  line: DEFAULT_COLORS.c8,
  white: '#FFFFFF',     // Blanc (exception autorisée)
};

/**
 * Vérifie si un thème est valide
 */
export function isValidPptxTheme(theme: PptxTheme): boolean {
  return !!(
    theme.bgMain &&
    theme.textMain &&
    theme.accent &&
    theme.line &&
    theme.white === '#FFFFFF'  // Vérification du blanc
  );
}

/**
 * Convertit une couleur hex en format PPTX (sans # si nécessaire)
 */
export function formatColorForPptx(color: string): string {
  return color.replace('#', '');
}

/**
 * Applique le thème à un slide PPTX
 * 
 * @param slide - Slide PPTXGenJS
 * @param theme - Thème à appliquer
 */
export function applyThemeToSlide(slide: any, theme: PptxTheme): void {
  // Theme application is handled by individual slide builders
  // No direct console logging - use DEBUG_PPTX flag in debugFlags.ts if needed
  void slide;
  void theme;
}

export default {
  getPptxThemeFromUiSettings,
  DEFAULT_PPTX_THEME,
  isValidPptxTheme,
  formatColorForPptx,
  applyThemeToSlide
};
