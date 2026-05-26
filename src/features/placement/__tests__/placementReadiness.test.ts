import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, normalizeLoadedState } from '../utils/normalizers';
import { hasPlacementSynthesisPrerequisites } from '../utils/placementReadiness';

describe('placementReadiness', () => {
  it('refuse la synthèse quand seul l’âge est renseigné', () => {
    const state = normalizeLoadedState({
      ...DEFAULT_STATE,
      client: { ...DEFAULT_STATE.client, ageActuel: 45 },
    });

    expect(hasPlacementSynthesisPrerequisites(state)).toBe(false);
  });

  it('autorise la synthèse avec âge et versement initial significatif', () => {
    const state = normalizeLoadedState({
      ...DEFAULT_STATE,
      client: { ...DEFAULT_STATE.client, ageActuel: 45 },
      products: [
        {
          ...DEFAULT_STATE.products[0],
          versementConfig: {
            ...DEFAULT_STATE.products[0].versementConfig,
            initial: { ...DEFAULT_STATE.products[0].versementConfig.initial, montant: 50000 },
          },
        },
        DEFAULT_STATE.products[1],
      ],
    });

    expect(hasPlacementSynthesisPrerequisites(state)).toBe(true);
  });
});
