import { describe, it, expect } from 'vitest';

import { computeMarginalRate } from './tmiMetrics.js';

describe('tmiMetrics - dynamic marginal rates', () => {
  it('computeMarginalRate follows rates from params.scale (admin-editable)', () => {
    const revenu = 15000;

    const baseParams = {
      partsNb: 1,
      basePartsForQf: 1,
      extraParts: 0,
      extraHalfParts: 0,
      plafondPartSup: 0,
      plafondParentIso2: 0,
      isCouple: false,
      isIsolated: false,
    };

    const scale30 = [
      { from: 0, to: 10000, rate: 0 },
      { from: 10000, to: 20000, rate: 30 },
      { from: 20000, to: null, rate: 45 },
    ];

    expect(computeMarginalRate(revenu, { ...baseParams, scale: scale30 })).toBe(30);

    const scale33 = scale30.map((br) => (br.from === 10000 ? { ...br, rate: 33 } : br));

    expect(computeMarginalRate(revenu, { ...baseParams, scale: scale33 })).toBe(33);
  });
});
