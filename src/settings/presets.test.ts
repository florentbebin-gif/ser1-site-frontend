import { describe, expect, it } from 'vitest';
import { DEFAULT_COLORS } from './theme';
import { PRESET_THEMES, resolvePresetColors } from './presets';

describe('presets SER1', () => {
  it('expose Cuivre tranché comme premier thème de référence', () => {
    expect(PRESET_THEMES[0]).toMatchObject({
      id: 'ser1-cuivre-tranche',
      name: 'Cuivre tranché',
      colors: DEFAULT_COLORS,
    });
  });

  it('garde les noms affichés sans millésime', () => {
    expect(PRESET_THEMES.map((theme) => theme.name)).toEqual([
      'Cuivre tranché',
      'Sauge profond',
      'Ardoise digital',
      'Aubergine',
      'Pinot noir',
    ]);
  });

  it('résout le preset Cuivre tranché vers les couleurs par défaut', () => {
    expect(resolvePresetColors('ser1-cuivre-tranche')).toEqual(DEFAULT_COLORS);
  });
});
