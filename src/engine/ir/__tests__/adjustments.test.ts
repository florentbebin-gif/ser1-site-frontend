import { describe, expect, it } from 'vitest';
import {
  computeAbattement10,
  computeEffectiveParts,
  computeExtraDeductions,
  countPersonsACharge,
} from '../adjustments.js';

describe('engine/ir/adjustments', () => {
  describe('computeAbattement10', () => {
    it('returns 0 when config missing or base <= 0', () => {
      expect(computeAbattement10(0, null)).toBe(0);
      expect(computeAbattement10(-1, { plafond: 1000, plancher: 100 })).toBe(0);
    });

    it('applies 10% with floor and cap', () => {
      expect(computeAbattement10(10000, { plafond: 5000, plancher: 1000 })).toBe(1000);
      expect(computeAbattement10(100000, { plafond: 5000, plancher: 1000 })).toBe(5000);
      expect(computeAbattement10(5000, { plafond: 5000, plancher: 1000 })).toBe(1000);
    });
  });

  describe('computeEffectiveParts', () => {
    it('keeps base parts minimum and applies manual quarter-part adjustment', () => {
      const res = computeEffectiveParts({
        status: 'single',
        isIsolated: false,
        children: [],
        manualParts: -1,
      });
      expect(res.baseParts).toBe(1);
      expect(res.computedParts).toBe(1);
      expect(res.effectiveParts).toBe(1);
    });

    it('matches couple case with two children and +0.25 manual part', () => {
      const res = computeEffectiveParts({
        status: 'couple',
        isIsolated: false,
        children: [{ mode: 'charge' }, { mode: 'charge' }],
        manualParts: 0.25,
      });
      expect(res.baseParts).toBe(2);
      expect(res.computedParts).toBe(3);
      expect(res.effectiveParts).toBe(3.25);
    });
  });

  describe('computeExtraDeductions', () => {
    it('applies abat10/reels logic exactly', () => {
      expect(
        computeExtraDeductions({
          status: 'couple',
          realMode: { d1: 'abat10', d2: 'reels' },
          realExpenses: { d1: 500, d2: 1200 },
          abat10SalD1: 800,
          abat10SalD2: 900,
        }),
      ).toBe(2000);

      expect(
        computeExtraDeductions({
          status: 'single',
          realMode: { d1: 'reels', d2: 'abat10' },
          realExpenses: { d1: 700, d2: 1200 },
          abat10SalD1: 800,
          abat10SalD2: 900,
        }),
      ).toBe(700);
    });
  });

  describe('countPersonsACharge', () => {
    it('counts charge/shared only', () => {
      expect(countPersonsACharge([{ mode: 'charge' }, { mode: 'shared' }, { mode: 'none' }])).toBe(2);
      expect(countPersonsACharge(null as unknown as any[])).toBe(0);
    });
  });
});
