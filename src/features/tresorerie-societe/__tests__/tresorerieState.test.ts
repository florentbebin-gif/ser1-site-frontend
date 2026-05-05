import { describe, expect, it } from 'vitest';
import type { TresoInputs } from '@/engine/tresorerie/types';
import type { TresoPersistedState } from '../types';
import {
  DEFAULT_TRESO_INPUTS_V2,
  normalizeTresoreriePersistedState,
} from '../hooks/useTresorerieState';
import { storageKeyFor } from '../../../utils/reset';

const LEGACY_INPUTS: TresoInputs = {
  typeCreation: 'existante',
  ageActuel: 52,
  ageRetraite: 64,
  besoinsRetraiteAnnuels: 42000,
  fraisStructureAnnuels: 4500,
  ccaInitial: 80000,
  apportAnnuelCCA: 12000,
  dureeActiveAns: 10,
  tresorerieInitiale: 150000,
  reservesInitiales: 220000,
  anneeCivileDebut: 2027,
  distribution: {
    montant: 100000,
    rendementDistribue: 0.045,
    delaiJouissanceMois: 3,
    dureeAns: 5,
    repetitionAuTerme: true,
  },
};

describe('useTresorerieState — source de vérité v2', () => {
  it('STORE_KEY suit la convention ser1:sim:<simId>', () => {
    expect(storageKeyFor('tresorerie-societe')).toBe('ser1:sim:tresorerie-societe');
  });

  it('expose des defaults uniquement en modèle v2 pour le runtime', () => {
    expect(DEFAULT_TRESO_INPUTS_V2.company.creationType).toBe('newco');
    expect(DEFAULT_TRESO_INPUTS_V2.foyer.retirementAge)
      .toBeGreaterThan(DEFAULT_TRESO_INPUTS_V2.foyer.currentAge);
    expect(DEFAULT_TRESO_INPUTS_V2.company.treasuryInitial).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V2.company.reservesInitial).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V2.company.associates[0].ccaInitial).toBe(0);
  });

  it('migre une ancienne session legacy vers inputsV2 puis abandonne inputs', () => {
    const state = normalizeTresoreriePersistedState({ inputs: LEGACY_INPUTS });

    expect(state.inputsV2.foyer.currentAge).toBe(52);
    expect(state.inputsV2.company.treasuryInitial).toBe(150000);
    expect(state.inputsV2.allocationMatrix.pockets[0]).toMatchObject({
      kind: 'distribution',
      annualReturnRate: 0.045,
    });
    expect('inputs' in state).toBe(false);
  });

  it('privilégie inputsV2 quand une session contient encore les deux formats', () => {
    const persisted: TresoPersistedState = {
      inputs: LEGACY_INPUTS,
      inputsV2: {
        ...DEFAULT_TRESO_INPUTS_V2,
        foyer: {
          ...DEFAULT_TRESO_INPUTS_V2.foyer,
          currentAge: 48,
        },
      },
    };

    const state = normalizeTresoreriePersistedState(persisted);

    expect(state.inputsV2.foyer.currentAge).toBe(48);
    expect('inputs' in state).toBe(false);
  });
});
