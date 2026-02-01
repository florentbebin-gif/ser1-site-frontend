/**
 * Thème PPTX dynamique basé sur les settings utilisateur
 * 
 * Règle stricte : AUCUNE couleur hex codée en dur sauf blanc (#FFFFFF)
 * Toutes les couleurs viennent du thème utilisateur (settings)
 */

// Interface pour le thème PPTX
export interface PptxTheme {
  bgMain: string;      // Couleur de fond principale
  textMain: string;    // Couleur de texte principale
  accent: string;      // Couleur d'accent
  line: string;        // Couleur des lignes/bordures
  white: string;       // Blanc (toujours #FFFFFF)
}

// Interface pour les settings utilisateur
export interface UiSettings {
  // Couleurs principales du thème SER1
  c1: string;  // Couleur principale (texte, éléments importants)
  c2: string;  // Couleur secondaire (accents, actions)
  c3: string;  // Couleur tertiaire
  c4: string;  // Couleur quaternaire
  c5: string;  // Couleur cinquième
  c6: string;  // Couleur sixième
  c7: string;  // Background principal (conteneurs)
  c8: string;  // Bordures et lignes
  c9: string;  // Texte secondaire/muted
  c10: string; // Texte principal
}

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
 * Thème par défaut (valeurs Serenity si settings non définis)
 * NOTE: Ces valeurs devraient être stockées dans settings, pas hardcodées
 * En attendant, on utilise les couleurs du template original
 */
export const DEFAULT_PPTX_THEME: PptxTheme = {
  bgMain: '#2B3F37',    // Vert foncé Serenity
  textMain: '#FFFFFF',  // Blanc
  accent: '#CEC1B6',    // Beige Serenity
  line: '#CEC1B6',      // Beige Serenity
  white: '#FFFFFF',     // Blanc
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
  // TODO: Appliquer les couleurs du thème au slide
  // - Background
  // - Textes par défaut
  // - Formes et lignes
  // eslint-disable-next-line no-console
  console.log('🎨 Applying theme to slide:', {
    bgMain: theme.bgMain,
    textMain: theme.textMain,
    accent: theme.accent,
    line: theme.line
  });
}

export default {
  getPptxThemeFromUiSettings,
  DEFAULT_PPTX_THEME,
  isValidPptxTheme,
  formatColorForPptx,
  applyThemeToSlide
};
