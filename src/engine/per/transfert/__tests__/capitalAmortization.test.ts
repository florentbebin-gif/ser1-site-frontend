import { describe, expect, it } from 'vitest';

import { computeCapitalHorizon, projectCapital } from '../capitalAmortization';

describe('capitalAmortization', () => {
  it('projette le capital net jusqu a la retraite', () => {
    expect(projectCapital({ capital: 10_000, annualRate: 0, years: 3 })).toBeCloseTo(10_000);
    expect(projectCapital({ capital: 10_000, annualRate: 0.02, years: 2 })).toBeCloseTo(10_404);
  });

  it('calcule un retrait annuel constant pour epuiser le capital a horizon', () => {
    const result = computeCapitalHorizon({
      capital: 12_000,
      annualRate: 0,
      liquidationAge: 64,
      horizonAge: 70,
    });

    expect(result.years).toBe(6);
    expect(result.annualWithdrawal).toBeCloseTo(2_000);
    expect(result.residualCapital).toBeCloseTo(0);
  });
});
