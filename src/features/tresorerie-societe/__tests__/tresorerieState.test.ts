import { describe, expect, it } from 'vitest';
import type { TresoInputs, TresoInputsV6 } from '@/engine/tresorerie/types';
import type { TresoPersistedState } from '../types';
import {
  DEFAULT_TRESO_INPUTS_V6,
  normalizeTresoreriePersistedState,
} from '../hooks/useTresorerieState';
import { buildTresoInputsV3FromLegacy } from '../utils/tresorerieV2Migration';
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

describe('useTresorerieState — source de vérité v6', () => {
  function expectRevenuePhasesInvariant(inputs: TresoInputsV6) {
    inputs.company.associates.forEach((associate) => {
      expect(associate.revenuePhases.length).toBeGreaterThan(0);
      associate.revenuePhases.forEach((phase) => {
        expect(phase.endYear).toBeGreaterThanOrEqual(phase.startYear);
        expect(phase.remuneration).toBeDefined();
        expect(phase.distribution).toBeDefined();
        expect(phase.ccaContribution).toBeDefined();
        expect(phase.ccaRepayment).toBeDefined();
      });
    });
  }

  it('STORE_KEY suit la convention ser1:sim:<simId>', () => {
    expect(storageKeyFor('tresorerie-societe')).toBe('ser1:sim:tresorerie-societe');
  });

  it('expose des defaults uniquement en modèle v6 pour le runtime', () => {
    expect(DEFAULT_TRESO_INPUTS_V6.version).toBe(6);
    expect(DEFAULT_TRESO_INPUTS_V6.company.creationType).toBe('newco');
    expect(DEFAULT_TRESO_INPUTS_V6.company.companyKind).toBe('holding_patrimoniale');
    expect(DEFAULT_TRESO_INPUTS_V6.company.legalReserveInitial).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.associates[0].profile?.currentAge).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.associates[0].profile?.retirementAge).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.associates[0].profile?.annualIncomeNeed).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.treasuryInitial).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.reservesInitial).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.annualStructureCosts).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.incomeStatement?.workingCapitalRequirement).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.associates[0].cca?.currentBalance).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.associates[0].cca?.remunerationRate).toBe(0);
    expect(DEFAULT_TRESO_INPUTS_V6.company.associates[0].revenuePhases).toHaveLength(1);
    expect(
      DEFAULT_TRESO_INPUTS_V6.company.associates[0].revenuePhases[0].distribution
        .annualNetIncomeNeed,
    ).toBe(0);
  });

  it('migre une ancienne session legacy vers inputsV6 puis abandonne inputs', () => {
    const state = normalizeTresoreriePersistedState({ inputs: LEGACY_INPUTS });

    expect(state.inputsV6.version).toBe(6);
    expectRevenuePhasesInvariant(state.inputsV6);
    expect(state.inputsV6.company.associates[0].profile?.currentAge).toBe(52);
    expect(state.inputsV6.company.treasuryInitial).toBe(150000);
    expect(state.inputsV6.allocationMatrix.pockets[0]).toMatchObject({
      kind: 'distribution',
      annualReturnRate: 0.045,
    });
    expect('inputs' in state).toBe(false);
  });

  it('migre inputsV3 quand une session contient plusieurs formats sans inputsV4', () => {
    const inputsV3 = buildTresoInputsV3FromLegacy({
      ...LEGACY_INPUTS,
      ageActuel: 48,
    });
    const persisted: TresoPersistedState = {
      inputs: LEGACY_INPUTS,
      inputsV3,
    };

    const state = normalizeTresoreriePersistedState(persisted);

    expect(state.inputsV6.version).toBe(6);
    expectRevenuePhasesInvariant(state.inputsV6);
    expect(state.inputsV6.company.associates[0].profile?.currentAge).toBe(48);
    expect('inputs' in state).toBe(false);
  });
});
