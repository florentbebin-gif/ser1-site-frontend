/**
 * Presets — Thèmes prédéfinis partagés entre Settings.jsx et ThemeProvider.tsx
 *
 * Source unique pour les palettes preset. Chaque preset a un `id` stable
 * utilisé en DB (colonne preset_id) et un objet `colors` au format ThemeColors.
 */

/* eslint-disable ser1-colors/no-hardcoded-colors -- Presets définissent les valeurs de référence des palettes */

import type { ThemeColors } from './theme';

export interface PresetTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const PRESET_THEMES: readonly PresetTheme[] = Object.freeze([
  {
    id: 'ser1-classic',
    name: 'Thème Original',
    description: 'Thème original élégant et professionnel',
    colors: Object.freeze({
      c1: '#2B3E37', c2: '#709B8B', c3: '#9FBDB2', c4: '#CFDED8', c5: '#788781',
      c6: '#CEC1B6', c7: '#F5F3F0', c8: '#D9D9D9', c9: '#7F7F7F', c10: '#000000',
    }),
  },
  {
    id: 'blue-patrimonial',
    name: 'Bleu patrimonial',
    description: 'Bleu sobre pour la gestion de patrimoine',
    colors: Object.freeze({
      c1: '#1e3a5f', c2: '#2c5282', c3: '#3182ce', c4: '#bee3f8', c5: '#4a5568',
      c6: '#e2e8f0', c7: '#f7fafc', c8: '#cbd5e0', c9: '#718096', c10: '#1a202c',
    }),
  },
  {
    id: 'green-sustainable',
    name: 'Vert durable',
    description: 'Vert profond pour l\'investissement durable',
    colors: Object.freeze({
      c1: '#22543d', c2: '#2f855a', c3: '#48bb78', c4: '#c6f6d5', c5: '#4a5568',
      c6: '#e2e8f0', c7: '#f7fafc', c8: '#cbd5e0', c9: '#718096', c10: '#1a202c',
    }),
  },
  {
    id: 'grey-modern',
    name: 'Gris moderne',
    description: 'Gris minimaliste et épuré',
    colors: Object.freeze({
      c1: '#2d3748', c2: '#4a5568', c3: '#718096', c4: '#e2e8f0', c5: '#4a5568',
      c6: '#edf2f7', c7: '#f7fafc', c8: '#cbd5e0', c9: '#718096', c10: '#1a202c',
    }),
  },
  {
    id: 'gold-elite',
    name: 'Or élite',
    description: 'Or subtil et noir pour le patrimoine haut de gamme',
    colors: Object.freeze({
      c1: '#4a3426', c2: '#8b6914', c3: '#b8860b', c4: '#f4e4c1', c5: '#4a5568',
      c6: '#e8e3d3', c7: '#faf8f3', c8: '#d4c4a0', c9: '#6b5d54', c10: '#1a1a1a',
    }),
  },
]);

/** Lookup rapide preset_id → ThemeColors */
export const PRESET_MAP: Record<string, ThemeColors> = Object.fromEntries(
  PRESET_THEMES.map(t => [t.id, t.colors]),
);

/** Résoudre un preset_id en couleurs. Retourne null si id inconnu. */
export function resolvePresetColors(presetId: string): ThemeColors | null {
  return PRESET_MAP[presetId] ?? null;
}
