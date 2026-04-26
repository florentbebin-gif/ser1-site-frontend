import { describe, expect, it } from 'vitest';
import {
  applyPerSimplifiedPreset,
  isPerSimplifiedPresetState,
  PER_SIMPLIFIED_PRESET,
} from './perSimplifiedMode';

describe('perSimplifiedMode', () => {
  it('force le parcours simplifié sur le contrôle avant versement depuis l’avis courant', () => {
    const state = applyPerSimplifiedPreset({
      step: 4,
      mode: 'declaration-n1' as const,
      historicalBasis: 'previous-avis-plus-n1' as const,
      needsCurrentYearEstimate: true,
    });

    expect(state).toMatchObject(PER_SIMPLIFIED_PRESET);
    expect(state.step).toBe(4);
    expect(isPerSimplifiedPresetState(state)).toBe(true);
  });

  it('détecte un état qui ne correspond pas au preset simplifié', () => {
    expect(isPerSimplifiedPresetState({
      mode: 'versement-n',
      historicalBasis: 'previous-avis-plus-n1',
      needsCurrentYearEstimate: false,
    })).toBe(false);
  });
});
