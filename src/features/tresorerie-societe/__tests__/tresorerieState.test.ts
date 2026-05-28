import { describe, expect, it } from 'vitest';
import type { TresoInputsV6 } from '@/engine/tresorerie/types';
import type { TresoPersistedState } from '../types';
import {
  DEFAULT_TRESO_INPUTS_V6,
  normalizeTresoreriePersistedState,
} from '../hooks/useTresorerieState';
import { storageKeyFor } from '@/utils/reset';

const HISTORICAL_INPUTS = {
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

function historicalStructuredInputs(currentAge = 48): unknown {
  return {
    version: 3,
    selectedAssociateId: 'associe-1',
    foyer: {
      selectedAssociateId: 'associe-1',
      currentAge,
      retirementAge: 64,
      annualIncomeNeed: 42_000,
      projectionStartYear: 2027,
    },
    company: {
      projectionStartYear: 2027,
      creationType: 'existante',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 0,
      sharePremium: 0,
      reservesInitial: 220_000,
      treasuryInitial: 150_000,
      annualStructureCosts: 4_500,
      incomeStatement: {
        annualRevenue: 0,
        annualStructureCosts: 4_500,
        workingCapitalRequirement: 0,
      },
      reducedCorporateTaxEligible: true,
      associates: [
        {
          id: 'associe-1',
          label: 'Associé 1',
          kind: 'pp',
          profile: {
            currentAge,
            retirementAge: 64,
            annualIncomeNeed: 42_000,
            projectionStartYear: 2027,
          },
          ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
          roles: ['associe_sans_statut'],
          cca: {
            currentBalance: 80_000,
            exceptionalContributions: [],
            annualContribution: { amount: 12_000, startYear: 2027, endYear: 2036 },
            remunerationRate: 0,
          },
          remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
        },
      ],
      loans: [],
      subsidiaries: [],
    },
    allocationMatrix: {
      sweepThreshold: 0,
      pockets: [],
    },
  };
}

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

  it('migre une ancienne session historique vers inputsV6 puis abandonne inputs', () => {
    const state = normalizeTresoreriePersistedState({ inputs: HISTORICAL_INPUTS });

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
    const persisted: TresoPersistedState = {
      inputs: HISTORICAL_INPUTS,
      inputsV3: historicalStructuredInputs(48),
    };

    const state = normalizeTresoreriePersistedState(persisted);

    expect(state.inputsV6.version).toBe(6);
    expectRevenuePhasesInvariant(state.inputsV6);
    expect(state.inputsV6.company.associates[0].profile?.currentAge).toBe(48);
    expect('inputs' in state).toBe(false);
  });
});
