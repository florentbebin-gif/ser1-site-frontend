import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_COLORS } from '../theme';
import { recalculatePaletteFromC1 } from './paletteGenerator';

describe('recalculatePaletteFromC1', () => {
  it('retombe sur Cuivre tranché quand le hex est invalide', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(recalculatePaletteFromC1('pas-un-hex')).toEqual({
      color1: DEFAULT_COLORS.c1,
      color2: DEFAULT_COLORS.c2,
      color3: DEFAULT_COLORS.c3,
      color4: DEFAULT_COLORS.c4,
      color5: DEFAULT_COLORS.c5,
      color6: DEFAULT_COLORS.c6,
      color7: DEFAULT_COLORS.c7,
      color8: DEFAULT_COLORS.c8,
      color9: DEFAULT_COLORS.c9,
      color10: DEFAULT_COLORS.c10,
    });

    warn.mockRestore();
  });

  it('préserve la signature C6 cuivre et le texte C10 lors du recalcul', () => {
    const palette = recalculatePaletteFromC1('#123456');

    expect(palette.color1).toBe('#123456');
    expect(palette.color2).not.toBe(DEFAULT_COLORS.c2);
    expect(palette.color6).toBe(DEFAULT_COLORS.c6);
    expect(palette.color10).toBe(DEFAULT_COLORS.c10);
  });
});
