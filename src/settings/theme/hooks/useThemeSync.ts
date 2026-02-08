/**
 * Theme Sync — Utilitaires purs pour l'application des CSS variables
 *
 * Contient :
 * - SOURCE_RANKS : hiérarchie de priorité des sources de thème
 * - getThemeHash : détection de changement par hash
 * - applyColorsToCSS : manipulation DOM pure (CSS custom properties)
 *
 * La logique de guard (ranking, hash-check, themeReady) reste dans ThemeProvider
 * car elle dépend de refs React et de state.
 */

import type { ThemeColors } from '../../theme';

// ─── Source ranking ──────────────────────────────────────────────────
// Ranking: cabinet(3) > original-db(2) > custom/ui_settings(1) > default/bootstrap(0)

export const SOURCE_RANKS: Record<string, number> = {
  'cabinet-cache': 3,
  'cabinet-state': 3,
  'cabinet-theme': 3,
  'original-db': 2,
  'ui_settings': 1,
  'user_metadata (legacy)': 1,
  'user_metadata (fallback)': 1,
  'cache': 1,
  'custom': 1,
  'custom-palette': 1,
  'active-palette': 1,
  'setColors-manual': 1,
  'default': 0,
  'default-sync-init': 0,
  'bootstrap-cache': 0,
  'signed-out': 0,
  'error-fallback': 0,
};

// ─── Hash function ───────────────────────────────────────────────────

/**
 * Génère un hash pour détecter si les couleurs ont réellement changé
 */
export function getThemeHash(colors: ThemeColors, userId?: string): string {
  const colorString = Object.values(colors).join('').toLowerCase();
  return `${colorString}-${userId || 'anonymous'}`;
}

// ─── DOM: Apply CSS variables ────────────────────────────────────────

/**
 * Applique les 10 couleurs en tant que CSS custom properties sur :root
 * Fonction pure — aucune dépendance React.
 */
export function applyColorsToCSS(colors: ThemeColors): void {
  const root = document.documentElement;
  root.style.setProperty('--color-c1', colors.c1);
  root.style.setProperty('--color-c2', colors.c2);
  root.style.setProperty('--color-c3', colors.c3);
  root.style.setProperty('--color-c4', colors.c4);
  root.style.setProperty('--color-c5', colors.c5);
  root.style.setProperty('--color-c6', colors.c6);
  root.style.setProperty('--color-c7', colors.c7);
  root.style.setProperty('--color-c8', colors.c8);
  root.style.setProperty('--color-c9', colors.c9);
  root.style.setProperty('--color-c10', colors.c10);
}
