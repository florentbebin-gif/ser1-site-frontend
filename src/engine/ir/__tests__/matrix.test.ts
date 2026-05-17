import { describe, expect, it } from 'vitest';
import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '../../../constants/settingsDefaults';
import { computeIrResult } from '../compute';

type ComputeIrInput = Parameters<typeof computeIrResult>[0];

function computeIr(overrides: Partial<ComputeIrInput>) {
  const result = computeIrResult({
    incomes: { d1: { salaries: 0 } },
    taxSettings: DEFAULT_TAX_SETTINGS,
    psSettings: DEFAULT_PS_SETTINGS,
    yearKey: 'current',
    status: 'single',
    parts: 1,
    ...overrides,
  });
  expect(result).not.toBeNull();
  return result!;
}

describe('engine/ir matrice de cas fiscaux', () => {
  it('borne le cas sans revenu à zéro impôt et zéro TMI', () => {
    const result = computeIr({});

    expect(result.totalIncome).toBe(0);
    expect(result.taxableIncome).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.tmiRate).toBe(0);
  });

  it('applique les parts du couple à revenu foyer équivalent', () => {
    const single = computeIr({
      incomes: { d1: { salaries: 84_000 } },
      status: 'single',
      parts: 1,
    });
    const couple = computeIr({
      incomes: { d1: { salaries: 42_000 }, d2: { salaries: 42_000 } },
      status: 'couple',
      parts: 2,
    });

    expect(couple.totalIncome).toBe(single.totalIncome);
    expect(couple.partsNb).toBe(2);
    expect(couple.irNet).toBeLessThan(single.irNet);
  });

  it('réduit l’impôt avec des parts de quotient familial', () => {
    const base = computeIr({
      incomes: { d1: { salaries: 96_000 } },
      status: 'single',
      parts: 1,
    });
    const withFamilyParts = computeIr({
      incomes: { d1: { salaries: 96_000 } },
      status: 'single',
      isIsolated: true,
      parts: 2.5,
    });

    expect(withFamilyParts.partsNb).toBe(2.5);
    expect(withFamilyParts.qfAdvantage).toBeGreaterThan(0);
    expect(withFamilyParts.irAfterQf).toBeLessThan(base.irAfterQf);
  });

  it('distingue PFU et option barème sur les revenus du capital', () => {
    const pfu = computeIr({
      incomes: { d1: { salaries: 0 }, capital: { withPs: 16_000 } },
      capitalMode: 'pfu',
    });
    const bareme = computeIr({
      incomes: { d1: { salaries: 0 }, capital: { withPs: 16_000 } },
      capitalMode: 'bareme',
    });

    expect(pfu.pfuIr).toBeGreaterThan(0);
    expect(bareme.pfuIr).toBe(0);
    expect(pfu.psDividends).toBeGreaterThan(0);
    expect(bareme.psDividends).toBe(pfu.psDividends);
    expect(bareme.totalTax).toBeLessThan(pfu.totalTax);
  });

  it('applique déductions et crédits sans produire un IR net négatif', () => {
    const withoutAdjustments = computeIr({
      incomes: { d1: { salaries: 48_000 } },
    });
    const withDeductions = computeIr({
      incomes: { d1: { salaries: 48_000 } },
      deductions: 12_000,
    });
    const withLargeCredit = computeIr({
      incomes: { d1: { salaries: 48_000 } },
      credits: 24_000,
    });

    expect(withDeductions.taxableIncome).toBeLessThan(withoutAdjustments.taxableIncome);
    expect(withDeductions.irNet).toBeLessThan(withoutAdjustments.irNet);
    expect(withLargeCredit.creditsTotal).toBe(24_000);
    expect(withLargeCredit.irNet).toBe(0);
  });

  it('active la CEHR sur un revenu fiscal élevé', () => {
    const result = computeIr({
      incomes: { d1: { salaries: 620_000 } },
      status: 'single',
      parts: 1,
    });

    expect(result.cehr).toBeGreaterThan(0);
    expect(result.cehrDetails.length).toBeGreaterThan(0);
  });

  it('applique l’abattement DOM quand la localisation le prévoit', () => {
    const metropole = computeIr({
      incomes: { d1: { salaries: 54_000 } },
      location: 'metropole',
    });
    const dom = computeIr({
      incomes: { d1: { salaries: 54_000 } },
      location: 'gmr',
    });

    expect(dom.domAbatementAmount).toBeGreaterThan(0);
    expect(dom.irNet).toBeLessThan(metropole.irNet);
  });
});
