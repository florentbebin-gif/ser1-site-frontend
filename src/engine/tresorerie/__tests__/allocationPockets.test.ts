import { describe, expect, it } from 'vitest';
import {
  computeAllocatableBase,
  computePocketInitialAmounts,
  distributeAmountByAllocation,
  normalizeAllocationPockets,
  selectAllocationPocketsForSimulation,
} from '../allocationPockets';
import type { AllocationPocketInput } from '../types';

function pocket(id: string, initialAllocationPct = 0): AllocationPocketInput {
  return {
    id,
    kind: 'distribution',
    horizon: 'court_terme',
    durationYears: 5,
    annualReturnRate: 0,
    enjoymentDelayMonths: 0,
    initialAllocationPct,
    annualAllocationPct: 0,
    repeatAtTerm: false,
  };
}

describe('normalizeAllocationPockets', () => {
  it('conserve l’ordre de saisie, sans priorité de consommation active', () => {
    expect(
      normalizeAllocationPockets([pocket('long'), pocket('court'), pocket('moyen')]).map(
        (item) => item.id,
      ),
    ).toEqual(['long', 'court', 'moyen']);
  });

  it('limite les poches actives à cinq placements', () => {
    expect(
      normalizeAllocationPockets([
        pocket('p1'),
        pocket('p2'),
        pocket('p3'),
        pocket('p4'),
        pocket('p5'),
        pocket('p6'),
      ]).map((item) => item.id),
    ).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
  });

  it('sélectionne les poches de simulation depuis la matrice normalisée', () => {
    expect(
      selectAllocationPocketsForSimulation({
        sweepThreshold: 0,
        pockets: [pocket('long'), pocket('court')],
      }).map((item) => item.id),
    ).toEqual(['long', 'court']);
  });
});

describe('computeAllocatableBase', () => {
  it('retire la trésorerie protégée de la trésorerie initiale', () => {
    expect(computeAllocatableBase(150000, 100000)).toBe(50000);
  });

  it('ne retourne jamais une base négative', () => {
    expect(computeAllocatableBase(80000, 100000)).toBe(0);
    expect(computeAllocatableBase(50000, -10000)).toBe(50000);
  });
});

describe('distributeAmountByAllocation', () => {
  it('répartit proportionnellement quand le total des pourcentages est ≤ 100 %', () => {
    const amounts = distributeAmountByAllocation(
      [pocket('a', 60), pocket('b', 40)],
      50000,
      'initialAllocationPct',
    );
    expect(amounts.get('a')).toBe(30000);
    expect(amounts.get('b')).toBe(20000);
  });

  it('écrête proportionnellement quand le total dépasse 100 % (surallocation)', () => {
    // 80 % + 80 % = 160 % → scale = 100/160 = 0,625 → 50000 × 0,8 × 0,625 = 25000
    const amounts = distributeAmountByAllocation(
      [pocket('a', 80), pocket('b', 80)],
      50000,
      'initialAllocationPct',
    );
    expect(amounts.get('a')).toBe(25000);
    expect(amounts.get('b')).toBe(25000);
    const total = [...amounts.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBe(50000);
  });

  it('retourne des montants nuls pour une base ≤ 0', () => {
    const amounts = distributeAmountByAllocation([pocket('a', 50)], 0, 'initialAllocationPct');
    expect(amounts.get('a')).toBe(0);
  });
});

describe('computePocketInitialAmounts', () => {
  it('équivaut à une répartition initiale sur la base investissable', () => {
    const amounts = computePocketInitialAmounts([pocket('a', 80), pocket('b', 80)], 50000);
    expect(amounts.get('a')).toBe(25000);
    expect(amounts.get('b')).toBe(25000);
  });
});
