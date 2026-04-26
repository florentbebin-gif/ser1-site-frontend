import { describe, expect, it } from 'vitest';
import { shouldUseProjectionForCalculation } from './perProjectionScope';

describe('shouldUseProjectionForCalculation', () => {
  it('reste sur les revenus N-1 en step 3 pour le parcours avis N-1 + reconstitution N', () => {
    expect(shouldUseProjectionForCalculation({
      step: 3,
      mode: 'versement-n',
      historicalBasis: 'previous-avis-plus-n1',
      needsCurrentYearEstimate: true,
    })).toBe(false);
  });

  it('bascule sur les versements N à partir de la step 4 après reconstitution 2025', () => {
    expect(shouldUseProjectionForCalculation({
      step: 4,
      mode: 'versement-n',
      historicalBasis: 'previous-avis-plus-n1',
      needsCurrentYearEstimate: false,
    })).toBe(true);
  });

  it('utilise la projection dès la step 3 pour le parcours avis IR courant', () => {
    expect(shouldUseProjectionForCalculation({
      step: 3,
      mode: 'versement-n',
      historicalBasis: 'current-avis',
      needsCurrentYearEstimate: false,
    })).toBe(true);
  });

  it('n’utilise jamais la projection pour le parcours déclaration N-1', () => {
    expect(shouldUseProjectionForCalculation({
      step: 4,
      mode: 'declaration-n1',
      historicalBasis: 'previous-avis-plus-n1',
      needsCurrentYearEstimate: false,
    })).toBe(false);
  });
});
