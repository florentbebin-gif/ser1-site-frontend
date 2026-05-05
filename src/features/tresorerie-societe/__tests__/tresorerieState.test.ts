import { describe, expect, it } from 'vitest';
import { DEFAULT_TRESO_INPUTS } from '../hooks/useTresorerieState';
import { storageKeyFor } from '../../../utils/reset';

describe('useTresorerieState — defaults et persistance', () => {
  it('STORE_KEY suit la convention ser1:sim:<simId>', () => {
    expect(storageKeyFor('tresorerie-societe')).toBe('ser1:sim:tresorerie-societe');
  });

  it('typeCreation par défaut est newco', () => {
    expect(DEFAULT_TRESO_INPUTS.typeCreation).toBe('newco');
  });

  it('ageRetraite > ageActuel dans les defaults', () => {
    expect(DEFAULT_TRESO_INPUTS.ageRetraite).toBeGreaterThan(DEFAULT_TRESO_INPUTS.ageActuel);
  });

  it('toutes les poches optionnelles sont undefined par défaut', () => {
    const pockets = ['distribution', 'capitalisation', 'creditIS', 'creditIR', 'holding'] as const;
    for (const pocket of pockets) {
      expect(DEFAULT_TRESO_INPUTS[pocket]).toBeUndefined();
    }
  });

  it('tresorerieInitiale et reservesInitiales démarrent à 0', () => {
    expect(DEFAULT_TRESO_INPUTS.tresorerieInitiale).toBe(0);
    expect(DEFAULT_TRESO_INPUTS.reservesInitiales).toBe(0);
  });

  it('ccaInitial démarre à 0 (pas de faux positif garde-fou fiscal)', () => {
    expect(DEFAULT_TRESO_INPUTS.ccaInitial).toBe(0);
  });
});
