import { describe, expect, it } from 'vitest';

import { computeCumulativeRent } from '../rentProjection';

describe('computeCumulativeRent', () => {
  it('cumule une rente annuelle revalorisée sur la durée demandée', () => {
    expect(computeCumulativeRent(1_000, 0.02, 3)).toBeCloseTo(3_060.4, 6);
  });

  it('neutralise les rentes négatives ou les durées négatives', () => {
    expect(computeCumulativeRent(-1_000, 0.02, 3)).toBe(0);
    expect(computeCumulativeRent(1_000, 0.02, -1)).toBe(0);
  });
});
