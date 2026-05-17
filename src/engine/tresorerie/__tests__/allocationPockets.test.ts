import { describe, expect, it } from 'vitest';
import {
  normalizeAllocationPockets,
  selectAllocationPocketsForSimulation,
} from '../allocationPockets';
import type { AllocationPocketInput } from '../types';

function pocket(id: string): AllocationPocketInput {
  return {
    id,
    kind: 'distribution',
    horizon: 'court_terme',
    durationYears: 5,
    annualReturnRate: 0,
    enjoymentDelayMonths: 0,
    initialAllocationPct: 0,
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
