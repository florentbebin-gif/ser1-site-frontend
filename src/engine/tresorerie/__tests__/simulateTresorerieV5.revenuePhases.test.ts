import { describe, expect, it } from 'vitest';
import { simulateTresorerieV2 } from '../simulateTresorerieV2';
import type { TresoFiscalParams, TresoInputsV5 } from '../types';

const PARAMS: TresoFiscalParams = {
  isNormalRate: 0.25,
  isReducedRate: 0.15,
  isReducedThreshold: 40_000,
  motherDaughterStandardQpfcRate: 0.05,
  motherDaughterGroupQpfcRate: 0.01,
  participationDisposalQpfcRate: 0.12,
  pfuRateIR: 0.10,
  psRate: 0.15,
  pfuTotal: 0.25,
  dividendesAbattement: 0,
  irScale: [],
  tnsDividendBasePct: 0.10,
};

function baseV5(): TresoInputsV5 {
  return {
    version: 5,
    selectedAssociateId: 'associe-us',
    foyer: { selectedAssociateId: 'associe-us' },
    company: {
      projectionStartYear: 2026,
      creationType: 'existante',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 20_000,
      sharePremium: 0,
      reservesInitial: 0,
      treasuryInitial: 80_000,
      annualStructureCosts: 0,
      incomeStatement: {
        annualRevenue: 120_000,
        annualStructureCosts: 0,
        workingCapitalRequirement: 0,
      },
      reducedCorporateTaxEligible: true,
      associates: [{
        id: 'associe-us',
        label: 'Associé 1',
        kind: 'pp',
        profile: {
          currentAge: 50,
          retirementAge: 90,
          annualIncomeNeed: 0,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 0,
          exceptionalContributions: [],
          annualContribution: { amount: 0, startYear: 2026 },
          remunerationRate: 0,
        },
        revenuePhases: [{
          id: 'phase-1',
          label: 'Rémunération holding',
          startYear: 2026,
          source: 'holding',
          loadedAnnualCost: 80_000,
          socialChargeRate: 0.25,
          annualNetIncomeNeed: 0,
          useCcaForCompletion: true,
        }],
      }],
      loans: [],
      subsidiaries: [],
    },
    allocationMatrix: {
      sweepThreshold: 0,
      minimumBankBalance: 0,
      pockets: [],
    },
  };
}

describe('simulateTresorerie — paliers de revenus V5', () => {
  it('active le bon palier par année et expose le palier actif', () => {
    const inputs = baseV5();
    inputs.company.associates[0].revenuePhases = [
      {
        id: 'phase-holding',
        label: 'Holding',
        startYear: 2026,
        source: 'holding',
        loadedAnnualCost: 80_000,
        socialChargeRate: 0.25,
        annualNetIncomeNeed: 0,
        useCcaForCompletion: true,
      },
      {
        id: 'phase-filiale',
        label: 'Filiale',
        startYear: 2028,
        source: 'subsidiary',
        subsidiaryId: 'filiale-1',
        loadedAnnualCost: 40_000,
        socialChargeRate: 0.25,
        annualNetIncomeNeed: 0,
        useCcaForCompletion: true,
      },
      {
        id: 'phase-besoin',
        label: 'Besoin pur',
        startYear: 2030,
        source: 'none',
        loadedAnnualCost: 0,
        socialChargeRate: 0,
        annualNetIncomeNeed: 20_000,
        useCcaForCompletion: false,
      },
    ];
    inputs.company.reservesInitial = 100_000;

    const rows = simulateTresorerieV2(inputs, PARAMS, 5);

    expect(rows[0]).toMatchObject({
      phaseIdActive: 'phase-holding',
      phaseLabelActive: 'Holding',
      revenusNets: 60_000,
      chargesStructure: 80_000,
    });
    expect(rows[2]).toMatchObject({
      phaseIdActive: 'phase-filiale',
      phaseLabelActive: 'Filiale',
      revenusNets: 30_000,
      chargesStructure: 0,
    });
    expect(rows[4].phaseIdActive).toBe('phase-besoin');
    expect(rows[4].revenusNets).toBeCloseTo(20_000, 2);
  });

  it('mobilise le CCA quand le palier le demande', () => {
    const inputs = baseV5();
    inputs.company.associates[0].cca = {
      currentBalance: 12_000,
      exceptionalContributions: [],
      annualContribution: { amount: 0, startYear: 2026 },
      remunerationRate: 0,
    };
    inputs.company.associates[0].revenuePhases = [{
      id: 'phase-cca',
      startYear: 2026,
      source: 'none',
      loadedAnnualCost: 0,
      socialChargeRate: 0,
      annualNetIncomeNeed: 8_000,
      useCcaForCompletion: true,
    }];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].retraitsCCA).toBe(8_000);
    expect(rows[0].dividendesAssociesBruts).toBe(0);
  });

  it('ignore le CCA et passe par dividendes quand le palier désactive la priorité CCA', () => {
    const inputs = baseV5();
    inputs.company.reservesInitial = 100_000;
    inputs.company.associates[0].cca = {
      currentBalance: 12_000,
      exceptionalContributions: [],
      annualContribution: { amount: 0, startYear: 2026 },
      remunerationRate: 0,
    };
    inputs.company.associates[0].revenuePhases = [{
      id: 'phase-dividendes',
      startYear: 2026,
      source: 'none',
      loadedAnnualCost: 0,
      socialChargeRate: 0,
      annualNetIncomeNeed: 9_000,
      useCcaForCompletion: false,
    }];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].retraitsCCA).toBe(0);
    expect(rows[0].dividendesAssociesBruts).toBeCloseTo(12_000, 2);
    expect(rows[0].revenusNets).toBeCloseTo(9_000, 2);
  });
});
