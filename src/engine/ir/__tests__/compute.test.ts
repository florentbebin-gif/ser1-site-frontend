import { describe, expect, it } from 'vitest';
import { computeIrResult } from '../compute';
import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../../../constants/settingsDefaults';

// Revenus vides (célibataire, aucun revenu)
const ZERO_INCOMES = {
  d1: { salaries: 0 },
};

describe('computeIrResult', () => {
  it('retourne null si taxSettings est null', () => {
    const result = computeIrResult({
      incomes: ZERO_INCOMES,
      taxSettings: null,
      psSettings: DEFAULT_PS_SETTINGS,
    });
    expect(result).toBeNull();
  });

  it('revenus nuls → totalTax = 0, irNet = 0', () => {
    const result = computeIrResult({
      incomes: ZERO_INCOMES,
      taxSettings: DEFAULT_TAX_SETTINGS,
      psSettings: DEFAULT_PS_SETTINGS,
      parts: 1,
      status: 'single',
    });
    expect(result).not.toBeNull();
    expect(result!.totalTax).toBe(0);
    expect(result!.irNet).toBe(0);
    expect(result!.totalIncome).toBe(0);
  });

  it('célibataire 36 000 € imposables → irNet > 0 et < revenu', () => {
    // 36 000 € est dans la tranche 30 % (29 316–83 823)
    // taxPerPart = 36000 × 0.30 − 6834.63 ≈ 3965 ; × 1 part → irNet ≈ 3965
    const result = computeIrResult({
      incomes: { d1: { salaries: 36000 } },
      taxSettings: DEFAULT_TAX_SETTINGS,
      psSettings: DEFAULT_PS_SETTINGS,
      parts: 1,
      status: 'single',
      yearKey: 'current',
    });
    expect(result).not.toBeNull();
    expect(result!.irNet).toBeGreaterThan(0);
    expect(result!.irNet).toBeLessThan(36000);
    // Vérification du barème 2025 : entre 3900 et 4100 pour ce revenu
    expect(result!.irNet).toBeGreaterThanOrEqual(3900);
    expect(result!.irNet).toBeLessThanOrEqual(4100);
  });

  it('revenus plus élevés → totalTax plus élevé (monotonie)', () => {
    const baseLow = computeIrResult({
      incomes: { d1: { salaries: 36000 } },
      taxSettings: DEFAULT_TAX_SETTINGS,
      psSettings: DEFAULT_PS_SETTINGS,
      parts: 1,
      status: 'single',
    });
    const baseHigh = computeIrResult({
      incomes: { d1: { salaries: 100000 } },
      taxSettings: DEFAULT_TAX_SETTINGS,
      psSettings: DEFAULT_PS_SETTINGS,
      parts: 1,
      status: 'single',
    });
    expect(baseLow).not.toBeNull();
    expect(baseHigh).not.toBeNull();
    expect(baseHigh!.totalTax).toBeGreaterThan(baseLow!.totalTax);
  });

  it('couple > seuil CEHR 1 M€ → cehr > 0', () => {
    // Seuil CEHR couple : 1 000 000 € (barème DEFAULT)
    const result = computeIrResult({
      incomes: { d1: { salaries: 1200000 } },
      taxSettings: DEFAULT_TAX_SETTINGS,
      psSettings: DEFAULT_PS_SETTINGS,
      parts: 2,
      status: 'couple',
      yearKey: 'current',
    });
    expect(result).not.toBeNull();
    expect(result!.cehr).toBeGreaterThan(0);
  });
});
