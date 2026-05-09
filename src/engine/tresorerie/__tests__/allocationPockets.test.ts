import { describe, expect, it } from 'vitest';
import {
  getEffectiveAllocationMode,
  selectAllocationPocketsForSimulation,
  sortAllocationPockets,
} from '../allocationPockets';
import type { AllocationPocketInput } from '../types';

function pocket(id: string, withdrawalPriority?: number): AllocationPocketInput {
  return {
    id,
    kind: 'distribution',
    horizon: 'court_terme',
    withdrawalPriority,
    durationYears: 5,
    annualReturnRate: 0,
    enjoymentDelayMonths: 0,
    initialAllocationPct: 0,
    annualAllocationPct: 0,
    repeatAtTerm: false,
    termDestination: 'treasury',
  };
}

describe('sortAllocationPockets', () => {
  it('conserve l’ordre de saisie, sans priorité de consommation active', () => {
    expect(sortAllocationPockets([
      pocket('long', 3),
      pocket('court', 1),
      pocket('moyen', 2),
    ]).map(item => item.id)).toEqual(['long', 'court', 'moyen']);
  });

  it('déduit le mode de placement du nombre de poches actives', () => {
    expect(getEffectiveAllocationMode([])).toBe('single');
    expect(getEffectiveAllocationMode([pocket('unique', 1)])).toBe('single');
    expect(getEffectiveAllocationMode([pocket('court', 1), pocket('long', 2)])).toBe('strategy');
  });

  it('ignore le mode stocké et conserve plusieurs poches quand elles existent', () => {
    expect(selectAllocationPocketsForSimulation({
      mode: 'single',
      sweepThreshold: 0,
      pockets: [pocket('long', 2), pocket('court', 1)],
    }).map(item => item.id)).toEqual(['long', 'court']);
  });
});
