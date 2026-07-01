import { describe, expect, it } from 'vitest';

import { PRESET_THEMES } from '@/settings/presets';

import {
  formatContrastRatio,
  getAuditFamilyContrastReport,
  getContrastRating,
  getContrastRatio,
} from './designSystemContrast';

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

  it('garde les avatars et branches audit lisibles sur les thèmes prédéfinis', () => {
    PRESET_THEMES.forEach(({ colors }) => {
      const report = getAuditFamilyContrastReport(colors);

      expect(report.avatarRingOnSurface).toBeGreaterThanOrEqual(3);
      expect(report.clientBranchOnAvatarSurface).toBeGreaterThanOrEqual(3);
      expect(report.conjointBranchOnAvatarSurface).toBeGreaterThanOrEqual(3);
    });
  });
});
