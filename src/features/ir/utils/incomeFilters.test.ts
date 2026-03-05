import { describe, expect, it } from 'vitest';
import {
  applyIncomeFilters,
  DEFAULT_INCOME_FILTERS,
  hasTaxableIncomeEntries,
  normalizeIncomeFilters,
} from './incomeFilters';

const SAMPLE_INCOMES = {
  d1: { salaries: 30000, associes62: 6000, pensions: 2000, bic: 4000, autres: 1000 },
  d2: { salaries: 25000, associes62: 3000, pensions: 1500, bic: 2500, autres: 500 },
  capital: { withPs: 800, withoutPs: 200 },
  fonciersFoyer: 5000,
};

describe('normalizeIncomeFilters', () => {
  it('returns defaults when input is missing', () => {
    expect(normalizeIncomeFilters(undefined)).toEqual(DEFAULT_INCOME_FILTERS);
  });

  it('keeps other flags off when only TNS is enabled', () => {
    expect(normalizeIncomeFilters({ tns: true })).toEqual({
      tns: true,
      pension: false,
      foncier: false,
    });
  });

  it('keeps other flags off when only Pension is enabled', () => {
    expect(normalizeIncomeFilters({ pension: true })).toEqual({
      tns: false,
      pension: true,
      foncier: false,
    });
  });
});

describe('hasTaxableIncomeEntries', () => {
  it('returns false when all taxable income fields are empty or zero', () => {
    expect(hasTaxableIncomeEntries({
      d1: { salaries: 0, associes62: 0, pensions: 0, bic: 0, autres: 0 },
      d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, autres: 0 },
      capital: { withPs: 0, withoutPs: 0 },
      fonciersFoyer: 0,
    })).toBe(false);
  });

  it('returns true when any taxable income field is positive', () => {
    expect(hasTaxableIncomeEntries({
      d1: { salaries: 30000 },
      d2: {},
      capital: {},
      fonciersFoyer: 0,
    })).toBe(true);
  });
});

describe('applyIncomeFilters', () => {
  it('neutralizes only TNS fields when tns is disabled', () => {
    const result = applyIncomeFilters(SAMPLE_INCOMES, { tns: false, pension: true, foncier: true });

    expect(result.d1.associes62).toBe(0);
    expect(result.d1.bic).toBe(0);
    expect(result.d2.associes62).toBe(0);
    expect(result.d2.bic).toBe(0);

    expect(result.d1.pensions).toBe(SAMPLE_INCOMES.d1.pensions);
    expect(result.fonciersFoyer).toBe(SAMPLE_INCOMES.fonciersFoyer);
    expect(result.d1.salaries).toBe(SAMPLE_INCOMES.d1.salaries);
  });

  it('neutralizes pension fields when pension is disabled', () => {
    const result = applyIncomeFilters(SAMPLE_INCOMES, { tns: true, pension: false, foncier: true });

    expect(result.d1.pensions).toBe(0);
    expect(result.d2.pensions).toBe(0);
    expect(result.d1.associes62).toBe(SAMPLE_INCOMES.d1.associes62);
    expect(result.fonciersFoyer).toBe(SAMPLE_INCOMES.fonciersFoyer);
  });

  it('neutralizes foncier field when foncier is disabled', () => {
    const result = applyIncomeFilters(SAMPLE_INCOMES, { tns: true, pension: true, foncier: false });

    expect(result.fonciersFoyer).toBe(0);
    expect(result.d1.associes62).toBe(SAMPLE_INCOMES.d1.associes62);
    expect(result.d1.pensions).toBe(SAMPLE_INCOMES.d1.pensions);
  });

  it('supports composition of all three filters', () => {
    const result = applyIncomeFilters(SAMPLE_INCOMES, { tns: false, pension: false, foncier: false });

    expect(result).toMatchObject({
      d1: { associes62: 0, bic: 0, pensions: 0 },
      d2: { associes62: 0, bic: 0, pensions: 0 },
      fonciersFoyer: 0,
    });
    expect(result.d1.salaries).toBe(SAMPLE_INCOMES.d1.salaries);
    expect(result.capital).toEqual(SAMPLE_INCOMES.capital);
  });

  it('does not mutate the source object', () => {
    const source = structuredClone(SAMPLE_INCOMES);
    const snapshot = structuredClone(source);

    const result = applyIncomeFilters(source, { tns: false, pension: false, foncier: false });

    expect(source).toEqual(snapshot);
    expect(result).not.toBe(source);
    expect(result.d1).not.toBe(source.d1);
    expect(result.d2).not.toBe(source.d2);
  });
});
