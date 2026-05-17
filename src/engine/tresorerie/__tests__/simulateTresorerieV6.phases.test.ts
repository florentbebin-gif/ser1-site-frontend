import { describe, expect, it } from 'vitest';
import { simulateTresorerieV2 } from '../simulateTresorerieV2';
import type { AssociateRevenuePhaseInputV6, TresoFiscalParams, TresoInputsV6 } from '../types';

const PARAMS: TresoFiscalParams = {
  isNormalRate: 0.25,
  isReducedRate: 0.15,
  isReducedThreshold: 40_000,
  motherDaughterStandardQpfcRate: 0.05,
  motherDaughterGroupQpfcRate: 0.01,
  participationDisposalQpfcRate: 0.12,
  pfuRateIR: 0.1,
  psRate: 0.15,
  pfuTotal: 0.25,
  dividendesAbattement: 0,
  irScale: [],
  tnsDividendBasePct: 0.1,
  maxDeductibleCcaInterestRate: 0.05,
};

function phase(patch: Partial<AssociateRevenuePhaseInputV6>): AssociateRevenuePhaseInputV6 {
  return {
    id: 'phase-1',
    startYear: 2026,
    endYear: 2030,
    remuneration: {
      enabled: false,
      source: 'none',
      loadedAnnualCost: 0,
      socialChargeRate: 0,
    },
    distribution: {
      enabled: false,
      annualNetIncomeNeed: 0,
      dividendsStrategy: 'max_treso',
    },
    ccaContribution: {
      enabled: false,
    },
    ccaRepayment: {
      enabled: false,
      strategy: 'aucun',
    },
    ...patch,
  };
}

function baseV6(): TresoInputsV6 {
  return {
    version: 6,
    selectedAssociateId: 'associe-1',
    foyer: { selectedAssociateId: 'associe-1' },
    company: {
      projectionStartYear: 2026,
      creationType: 'existante',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 20_000,
      sharePremium: 0,
      reservesInitial: 0,
      legalReserveInitial: 0,
      treasuryInitial: 100_000,
      annualStructureCosts: 0,
      incomeStatement: {
        annualRevenue: 0,
        annualStructureCosts: 0,
        workingCapitalRequirement: 0,
      },
      reducedCorporateTaxEligible: true,
      associates: [
        {
          id: 'associe-1',
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
            remunerationRate: 0,
          },
          revenuePhases: [phase({})],
        },
      ],
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

describe('simulateTresorerie — sous-phases V6', () => {
  it('rembourse le CCA en mode max_treso sans le borner au besoin net', () => {
    const inputs = baseV6();
    inputs.company.associates[0].cca = {
      currentBalance: 20_000,
      remunerationRate: 0,
    };
    inputs.company.associates[0].revenuePhases = [
      phase({
        ccaRepayment: {
          enabled: true,
          strategy: 'max_treso',
        },
      }),
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].retraitsCCA).toBe(20_000);
    expect(rows[0].ccaRestant).toBe(0);
  });

  it('borne les retraits CCA par la trésorerie bancaire disponible après solde minimum et BFR', () => {
    const inputs = baseV6();
    inputs.company.associates[0].cca = {
      currentBalance: 50_000,
      remunerationRate: 0,
    };
    inputs.company.incomeStatement = {
      annualRevenue: 0,
      annualStructureCosts: 0,
      workingCapitalRequirement: 30_000,
    };
    inputs.allocationMatrix.minimumBankBalance = 60_000;
    inputs.allocationMatrix.sweepThreshold = 60_000;
    inputs.company.associates[0].revenuePhases = [
      phase({
        ccaRepayment: {
          enabled: true,
          strategy: 'max_treso',
        },
      }),
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].retraitsCCA).toBe(10_000);
    expect(rows[0].ccaRestant).toBe(40_000);
    expect(rows[0].tresorerieDisponible).toBe(0);
  });

  it('distribue le maximum de trésorerie disponible en mode dividendes max sans dépendre du besoin', () => {
    const inputs = baseV6();
    inputs.company.reservesInitial = 50_000;
    inputs.company.associates[0].revenuePhases = [
      phase({
        distribution: {
          enabled: true,
          annualNetIncomeNeed: 0,
          dividendsStrategy: 'max_treso',
        },
      }),
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].dividendesAssociesBruts).toBeCloseTo(50_000, 2);
    expect(rows[0].revenusNets).toBeCloseTo(37_500, 2);
  });

  it('grosse un dividende cible net associé en brut société avec le PFU et les droits économiques', () => {
    const inputs = baseV6();
    inputs.company.reservesInitial = 100_000;
    inputs.company.associates[0].revenuePhases = [
      phase({
        distribution: {
          enabled: true,
          annualNetIncomeNeed: 0,
          dividendsStrategy: 'montant_cible',
          dividendsTargetAmountNet: 7_500,
        },
      }),
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].dividendesComplementairesBrutsDemandes).toBeCloseTo(10_000, 2);
    expect(rows[0].dividendesAssociesBruts).toBeCloseTo(10_000, 2);
    expect(rows[0].pfu).toBeCloseTo(2_500, 2);
    expect(rows[0].revenusNets).toBeCloseTo(7_500, 2);
  });

  it('applique les apports CCA annuels et exceptionnels portés par le palier', () => {
    const inputs = baseV6();
    inputs.company.associates[0].cca = {
      currentBalance: 0,
      remunerationRate: 0.05,
    };
    inputs.company.associates[0].revenuePhases = [
      phase({
        startYear: 2026,
        endYear: 2027,
        ccaContribution: {
          enabled: true,
          exceptional: { year: 2026, amount: 10_000 },
          annual: { amount: 5_000, startYear: 2026, endYear: 2027 },
        },
      }),
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 2);

    expect(rows[0].apportCCA).toBe(15_000);
    expect(rows[1].apportCCA).toBe(5_000);
    expect(rows[1].interetsCCA).toBeCloseTo(750, 2);
  });

  it('contraint les apports CCA annuels aux bornes du palier même si les anciennes bornes sont incohérentes', () => {
    const inputs = baseV6();
    inputs.company.associates[0].revenuePhases = [
      phase({
        startYear: 2026,
        endYear: 2027,
        ccaContribution: {
          enabled: true,
          annual: { amount: 5_000, startYear: 2028, endYear: 2029 },
        },
      }),
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 2);

    expect(rows[0].apportCCA).toBe(5_000);
    expect(rows[1].apportCCA).toBe(5_000);
  });

  it('ne rembourse pas le CCA lorsque la sous-phase est désactivée ou en mode aucun', () => {
    const inputs = baseV6();
    inputs.company.associates[0].cca = {
      currentBalance: 20_000,
      remunerationRate: 0,
    };
    inputs.company.associates[0].revenuePhases = [
      phase({
        distribution: {
          enabled: true,
          annualNetIncomeNeed: 10_000,
          dividendsStrategy: 'aucun',
        },
        ccaRepayment: {
          enabled: false,
          strategy: 'aucun',
        },
      }),
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].retraitsCCA).toBe(0);
  });
});
