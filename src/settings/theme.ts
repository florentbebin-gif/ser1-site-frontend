/**
 * Theme Settings - Gestion des couleurs et de la charte graphique
 * 
 * Source de vérité unique pour les tokens C1-C10
 * Tous les consommateurs doivent importer depuis ce fichier
 */

/** Tokens C1-C10 (format plat pour compatibilité existante) */
export interface ThemeColors {
  c1: string;  // Primary dark
  c2: string;  // Primary medium
  c3: string;  // Primary light
  c4: string;  // Primary very light
  c5: string;  // Neutral medium
  c6: string;  // Warm neutral
  c7: string;  // Background light
  c8: string;  // Border/separator
  c9: string;  // Text secondary
  c10: string; // Text primary
}

/** Configuration complète du thème (format structuré) */
export interface ThemeConfig {
  colors: ThemeColors;
  logo?: string; // Base64 encoded logo
}

/** Valeurs par défaut SER1 Classic - SOURCE DE VÉRITÉ */
export const DEFAULT_COLORS: ThemeColors = {
  c1: '#2B3E37',
  c2: '#709B8B',
  c3: '#9FBDB2',
  c4: '#CFDED8',
  c5: '#788781',
  c6: '#CEC1B6',
  c7: '#F5F3F0',
  c8: '#D9D9D9',
  c9: '#7F7F7F',
  c10: '#000000',
};

/** Theme complet par défaut */
export const DEFAULT_THEME: ThemeConfig = {
  colors: DEFAULT_COLORS,
};

const THEME_STORAGE_KEY = 'ser1_theme';

/**
 * Charge le thème depuis le localStorage
 */
export function loadTheme(): ThemeConfig {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ThemeConfig;
    }
  } catch (e) {
    console.warn('Failed to load theme from storage:', e);
  }
  return DEFAULT_THEME;
}

/**
 * Sauvegarde le thème dans le localStorage
 */
export function saveTheme(theme: ThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (e) {
    console.warn('Failed to save theme to storage:', e);
  }
}

/**
 * Applique le thème aux variables CSS
 */
export function applyThemeToCss(theme: ThemeConfig): void {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}

/**
 * Réinitialise le thème par défaut
 */
export function resetTheme(): ThemeConfig {
  saveTheme(DEFAULT_THEME);
  applyThemeToCss(DEFAULT_THEME);
  return DEFAULT_THEME;
}
