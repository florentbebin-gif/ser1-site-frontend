import { describe, expect, it } from 'vitest';
import type { TresoInputs } from '@/engine/tresorerie/types';
import type { TresoPersistedState } from '../types';
import {
  DEFAULT_TRESO_INPUTS_V5,
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

describe('useTresorerieState — source de vérité v5', () => {
  it('STORE_KEY suit la convention ser1:sim:<simId>', () => {
    expect(storageKeyFor('tresorerie-societe')).toBe('ser1:sim:tresorerie-societe');
  });

  it('expose des defaults uniquement en modèle v5 pour le runtime', () => {
    expect(DEFAULT_TRESO_INPUTS_V5.version).toBe(5);
    expect(DEFAULT_TRESO_INPUTS_V5.company.creationType).toBe('newco');
    expect(DEFAULT_TRESO_INPUTS_V5.company.companyKind).toBe('holding_patrimoniale');
    expect(DEFAULT_TRESO_INPUTS_V5.company.associates[0].profile?.retirementAge)
      .toBeGreaterThan(DEFAULT_TRESO_INPUTS_V5.company.associates[0].profile?.currentAge ?? 0);
    expect(DEFAULT_TRESO_INPUTS_V5.company.treasuryInitial).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V5.company.reservesInitial).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V5.company.incomeStatement?.workingCapitalRequirement).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V5.company.associates[0].cca?.currentBalance).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V5.company.associates[0].revenuePhases).toHaveLength(1);
  });

  it('migre une ancienne session legacy vers inputsV5 puis abandonne inputs', () => {
    const state = normalizeTresoreriePersistedState({ inputs: LEGACY_INPUTS });

    expect(state.inputsV5.version).toBe(5);
    expect(state.inputsV5.company.associates[0].profile?.currentAge).toBe(52);
    expect(state.inputsV5.company.treasuryInitial).toBe(150000);
    expect(state.inputsV5.allocationMatrix.pockets[0]).toMatchObject({
      kind: 'distribution',
      annualReturnRate: 0.045,
    });
    expect('inputs' in state).toBe(false);
  });

  it('migre inputsV3 quand une session contient plusieurs formats sans inputsV4', () => {
    const persisted: TresoPersistedState = {
      inputs: LEGACY_INPUTS,
      inputsV3: {
        ...DEFAULT_TRESO_INPUTS_V5,
        version: 3,
        foyer: {
          selectedAssociateId: DEFAULT_TRESO_INPUTS_V5.foyer.selectedAssociateId,
          currentAge: 50,
          retirementAge: 65,
          annualIncomeNeed: 30000,
          projectionStartYear: DEFAULT_TRESO_INPUTS_V5.company.projectionStartYear ?? 2026,
        },
        company: {
          ...DEFAULT_TRESO_INPUTS_V5.company,
          associates: DEFAULT_TRESO_INPUTS_V5.company.associates.map(associate => ({
            ...associate,
            profile: associate.profile ? {
              ...associate.profile,
              currentAge: 48,
            } : undefined,
          })),
        },
      },
    };

    const state = normalizeTresoreriePersistedState(persisted);

    expect(state.inputsV5.version).toBe(5);
    expect(state.inputsV5.company.associates[0].profile?.currentAge).toBe(48);
    expect('inputs' in state).toBe(false);
  });
});
