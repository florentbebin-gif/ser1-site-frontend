import { describe, expect, it } from 'vitest';
import { simulateTresorerieV2 } from '../simulateTresorerieV2';
import type { TresoFiscalParams, TresoInputsV6 } from '../types';

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
      shareCapital: 100_000,
      sharePremium: 0,
      reservesInitial: 0,
      legalReserveInitial: 0,
      treasuryInitial: 200_000,
      annualStructureCosts: 0,
      incomeStatement: {
        annualRevenue: 100_000,
        annualStructureCosts: 0,
        workingCapitalRequirement: 0,
      },
      reducedCorporateTaxEligible: true,
      associates: [{
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
        revenuePhases: [{
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

describe('simulateTresorerie — réserve légale V6', () => {
  it('dote 5 % du résultat net tant que la réserve légale est inférieure à 10 % du capital', () => {
    const rows = simulateTresorerieV2(baseV6(), PARAMS, 1);

    expect(rows[0].resultatNetComptable).toBeCloseTo(79_000, 2);
    expect(rows[0].dotationReserveLegale).toBeCloseTo(3_950, 2);
    expect(rows[0].reserveLegaleFin).toBeCloseTo(3_950, 2);
    expect(rows[0].capaciteDistribuable).toBeCloseTo(75_050, 2);
  });

  it('plafonne la dotation au reliquat nécessaire pour atteindre 10 % du capital', () => {
    const inputs = baseV6();
    inputs.company.legalReserveInitial = 9_000;

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].reserveLegaleDebut).toBe(9_000);
    expect(rows[0].dotationReserveLegale).toBeCloseTo(1_000, 2);
    expect(rows[0].reserveLegaleFin).toBeCloseTo(10_000, 2);
  });

  it('ne dote plus lorsque le plafond de réserve légale est atteint', () => {
    const inputs = baseV6();
    inputs.company.legalReserveInitial = 10_000;

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].dotationReserveLegale).toBe(0);
    expect(rows[0].capaciteDistribuable).toBeCloseTo(79_000, 2);
  });

  it('ne dote pas la réserve légale si le résultat net est négatif', () => {
    const inputs = baseV6();
    inputs.company.incomeStatement = {
      annualRevenue: 0,
      annualStructureCosts: 20_000,
      workingCapitalRequirement: 0,
    };
    inputs.company.annualStructureCosts = 20_000;

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].resultatNetComptable).toBeLessThan(0);
    expect(rows[0].dotationReserveLegale).toBe(0);
    expect(rows[0].capaciteDistribuable).toBe(0);
  });
});
