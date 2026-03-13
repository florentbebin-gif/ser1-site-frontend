import { describe, expect, it } from 'vitest';
import { computeIrResult } from '../../../engine/ir/compute';
import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '../../../constants/settingsDefaults';
import { applyIncomeFilters } from './incomeFilters';

const BASE_INPUT = {
  yearKey: 'current',
  status: 'couple',
  isIsolated: false,
  parts: 2,
  location: 'metropole',
  deductions: 0,
  credits: 0,
  taxSettings: DEFAULT_TAX_SETTINGS,
  psSettings: DEFAULT_PS_SETTINGS,
  capitalMode: 'pfu',
  personsAChargeCount: 0,
};

const SOURCE_INCOMES = {
  d1: { salaries: 42000, associes62: 6000, pensions: 5000, bic: 3500, fonciers: 0, autres: 1200 },
  d2: { salaries: 38000, associes62: 4500, pensions: 4000, bic: 2500, fonciers: 0, autres: 800 },
  capital: { withPs: 0, withoutPs: 0 },
  fonciersFoyer: 7000,
};

function computeWithFilters(filters: { tns: boolean; pension: boolean; foncier: boolean }) {
  return computeIrResult({
    ...BASE_INPUT,
    incomes: applyIncomeFilters(SOURCE_INCOMES, filters),
  });
}

describe('income filters -> IR computation consistency', () => {
  it('disabling TNS excludes associes/gérants and BIC/BNC/BA from taxable base', () => {
    const allOn = computeWithFilters({ tns: true, pension: true, foncier: true });
    const tnsOff = computeWithFilters({ tns: false, pension: true, foncier: true });

    const removedTnsBase =
      SOURCE_INCOMES.d1.associes62 +
      SOURCE_INCOMES.d1.bic +
      SOURCE_INCOMES.d2.associes62 +
      SOURCE_INCOMES.d2.bic;

    expect(allOn).not.toBeNull();
    expect(tnsOff).not.toBeNull();
    expect(allOn!.taxableIncome - tnsOff!.taxableIncome).toBe(removedTnsBase);
    expect(tnsOff!.totalTax).toBeLessThan(allOn!.totalTax);
  });

  it('disabling Pension excludes pensions and their derived taxation impact', () => {
    const allOn = computeWithFilters({ tns: true, pension: true, foncier: true });
    const pensionOff = computeWithFilters({ tns: true, pension: false, foncier: true });

    const removedPensionBase = SOURCE_INCOMES.d1.pensions + SOURCE_INCOMES.d2.pensions;

    expect(allOn!.taxableIncome - pensionOff!.taxableIncome).toBe(removedPensionBase);
    expect(pensionOff!.totalTax).toBeLessThan(allOn!.totalTax);
  });

  it('disabling Foncier zeroes taxable base contribution and related social contributions', () => {
    const allOn = computeWithFilters({ tns: true, pension: true, foncier: true });
    const foncierOff = computeWithFilters({ tns: true, pension: true, foncier: false });

    expect(allOn!.taxableIncome - foncierOff!.taxableIncome).toBe(SOURCE_INCOMES.fonciersFoyer);
    expect(foncierOff!.psFoncier).toBe(0);
    expect(foncierOff!.totalTax).toBeLessThan(allOn!.totalTax);
  });
});
