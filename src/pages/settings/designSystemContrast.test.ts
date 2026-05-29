import { describe, expect, it } from 'vitest';
import { formatContrastRatio, getContrastRating, getContrastRatio } from './designSystemContrast';

/* eslint-disable ser1-colors/no-hardcoded-colors -- Test WCAG avec noir, blanc et gris de référence. */

describe('designSystemContrast', () => {
  it('calcule le ratio WCAG entre deux couleurs hex', () => {
    expect(getContrastRatio('#000000', '#FFFFFF')).toBe(21);
    expect(getContrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('classe les contrastes en information non bloquante', () => {
    expect(getContrastRating(4.5)).toBe('AA');
    expect(getContrastRating(3.2)).toBe('À vérifier');
    expect(formatContrastRatio(4.481)).toBe('4.48:1');
  });
});
