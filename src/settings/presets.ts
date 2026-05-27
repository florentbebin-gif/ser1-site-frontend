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
    id: 'ser1-cuivre-tranche',
    name: 'Cuivre tranché',
    description: 'Bleu nuit sobre, signature cuivre brûlé',
    colors: Object.freeze({
      c1: '#0E1426',
      c2: '#1F3056',
      c3: '#5B73A0',
      c4: '#C6CFE2',
      c5: '#475061',
      c6: '#C2733A',
      c7: '#F2EEE8',
      c8: '#C9CCDA',
      c9: '#424659',
      c10: '#060A18',
    }),
  },
  {
    id: 'ser1-sauge-profond-2026',
    name: 'Sauge profond',
    description: 'Sauge profond patrimonial, moderne et lisible',
    colors: Object.freeze({
      c1: '#1F2D24',
      c2: '#3A5F4D',
      c3: '#6E8B7D',
      c4: '#C5D5CB',
      c5: '#4A554F',
      c6: '#B89868',
      c7: '#F2EFE9',
      c8: '#C8CFC9',
      c9: '#3E4642',
      c10: '#060F0B',
    }),
  },
  {
    id: 'ser1-ardoise-digital-2026',
    name: 'Ardoise digital',
    description: 'Ardoise bleu-gris contemporaine, signature pêche-cuivre',
    colors: Object.freeze({
      c1: '#1F2A36',
      c2: '#2E4659',
      c3: '#6B8499',
      c4: '#CDD7E0',
      c5: '#4D5662',
      c6: '#D49B6E',
      c7: '#F2F1ED',
      c8: '#C8CED7',
      c9: '#3F4654',
      c10: '#0D131C',
    }),
  },
  {
    id: 'ser1-aubergine-2026',
    name: 'Aubergine',
    description: 'Aubergine-noir premium, signature laiton-or',
    colors: Object.freeze({
      c1: '#1F1024',
      c2: '#4D2244',
      c3: '#8B5C7E',
      c4: '#DCB9CE',
      c5: '#5C4651',
      c6: '#B98B4A',
      c7: '#F5EEE7',
      c8: '#D8CCCF',
      c9: '#4D404A',
      c10: '#15081A',
    }),
  },
  {
    id: 'ser1-pinot-noir-2026',
    name: 'Pinot noir',
    description: 'Bourgogne velours patrimonial, signature laiton antique',
    colors: Object.freeze({
      c1: '#2A0F14',
      c2: '#6B1F2D',
      c3: '#A95466',
      c4: '#E8C8CD',
      c5: '#5A3F45',
      c6: '#A88753',
      c7: '#F4ECE9',
      c8: '#D9C9CD',
      c9: '#4A3D41',
      c10: '#1A050A',
    }),
  },
]);

/** Lookup rapide preset_id → ThemeColors */
export const PRESET_MAP: Record<string, ThemeColors> = Object.fromEntries(
  PRESET_THEMES.map((t) => [t.id, t.colors]),
);

/** Résoudre un preset_id en couleurs. Retourne null si id inconnu. */
export function resolvePresetColors(presetId: string): ThemeColors | null {
  return PRESET_MAP[presetId] ?? null;
}
