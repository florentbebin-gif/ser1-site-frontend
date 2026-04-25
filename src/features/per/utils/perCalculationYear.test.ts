import { describe, expect, it } from 'vitest';
import { resolvePerCalculationYear } from './perCalculationYear';
import type { PerWorkflowYears } from './perWorkflowYears';

const years: PerWorkflowYears = {
  currentTaxLabel: '2026 (revenus 2025)',
  previousTaxLabel: '2025 (revenus 2024)',
  currentTaxYear: 2026,
  currentIncomeYear: 2025,
  previousTaxYear: 2025,
  previousIncomeYear: 2024,
};

describe('resolvePerCalculationYear', () => {
  it('utilise le barème courant 2026 sur la tab Revenus 2025', () => {
    expect(resolvePerCalculationYear({
      step: 3,
      mode: 'versement-n',
      historicalBasis: 'previous-avis-plus-n1',
      useProjection: false,
      years,
    })).toEqual({
      anneeRef: 2025,
      yearKey: 'current',
    });
  });

  it('utilise le même barème courant pour la projection 2026 avec le PASS 2026', () => {
    expect(resolvePerCalculationYear({
      step: 4,
      mode: 'versement-n',
      historicalBasis: 'previous-avis-plus-n1',
      useProjection: true,
      years,
    })).toEqual({
      anneeRef: 2026,
      yearKey: 'current',
    });
  });
});
