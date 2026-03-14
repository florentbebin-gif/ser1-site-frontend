import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STATE,
  buildPlacementStateForMode,
  type PlacementSimulatorState,
} from '../utils/normalizers';

function createState(): PlacementSimulatorState {
  return {
    ...structuredClone(DEFAULT_STATE),
    step: 'liquidation',
    products: [
      {
        ...structuredClone(DEFAULT_STATE.products[0]),
        envelope: 'PER',
        perBancaire: true,
        optionBaremeIR: true,
        liquidation: { optionBaremeIR: true },
      },
      {
        ...structuredClone(DEFAULT_STATE.products[1]),
        envelope: 'CTO',
        perBancaire: false,
        optionBaremeIR: true,
        liquidation: { optionBaremeIR: true },
      },
    ],
  };
}

describe('buildPlacementStateForMode', () => {
  it('neutralise les options expertes en mode simplifie sans muter la source', () => {
    const sourceState = createState();
    const snapshot = structuredClone(sourceState);

    const nextState = buildPlacementStateForMode(sourceState, false);

    expect(nextState).not.toBe(sourceState);
    expect(nextState.products[0].perBancaire).toBe(false);
    expect(nextState.products[0].optionBaremeIR).toBe(false);
    expect(nextState.products[0].liquidation?.optionBaremeIR).toBe(false);
    expect(nextState.products[1].optionBaremeIR).toBe(false);
    expect(nextState.products[1].liquidation?.optionBaremeIR).toBe(false);
    expect(sourceState).toEqual(snapshot);
  });

  it('retourne l etat source en mode expert', () => {
    const sourceState = createState();

    expect(buildPlacementStateForMode(sourceState, true)).toBe(sourceState);
  });
});
