/* eslint-disable ser1-colors/no-hardcoded-colors */
/**
 * Hook pour gérer les thèmes et couleurs personnalisées
 * 
 * ⚠️ DÉSACTIVÉ - Utiliser ThemeProvider à la place
 * Ce hook créait des conflits de chargement multiples
 */

// Thème par défaut (fallback) - couleurs SER1 d'origine
const DEFAULT_THEME = {
  name: 'default',
  colors: {
    primary: '#2B3E37',      // Couleur 1
    primaryHover: '#1f2d28',
    secondary: '#709B8B',    // Couleur 2
    accent: '#9FBDB2',       // Couleur 3
    background: '#CFDED8',   // Couleur 4
    surface: '#788781',      // Couleur 5
    text: '#000000',         // Couleur 10
    textMuted: '#7F7F7F',    // Couleur 9
    border: '#D9D9D9',       // Couleur 8
    success: '#2B3E37',      // Réutiliser Couleur 1
    warning: '#CEC1B6',      // Couleur 6
    error: '#dc2626'         // Rouge standard pour les erreurs
  }
};

export function useTheme() {
  // ⚠️ Hook désactivé - utilisez ThemeProvider
  console.warn('[useTheme] Hook désactivé - utilisez ThemeProvider à la place');
  
  return {
    theme: DEFAULT_THEME,
    colors: DEFAULT_THEME.colors,
    loading: false,
    error: null,
    cssVariables: {},
    saveTheme: async () => ({ success: false, error: 'Hook désactivé' }),
    resetToDefault: async () => ({ success: false, error: 'Hook désactivé' }),
    isCustom: false
  };
}

export { DEFAULT_THEME };
export default useTheme;
