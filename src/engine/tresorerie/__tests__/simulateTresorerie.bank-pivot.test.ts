import { describe, expect, it } from 'vitest';
import { simulateTresorerieV2 } from '../simulateTresorerieV2';
import type { TresoFiscalParams, TresoInputsV3 } from '../types';

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

function baseV3(): TresoInputsV3 {
  return {
    version: 3,
    selectedAssociateId: 'associe-us',
    foyer: {
      selectedAssociateId: 'associe-us',
      currentAge: 40,
      retirementAge: 70,
      annualIncomeNeed: 0,
      projectionStartYear: 2026,
    },
    company: {
      creationType: 'existante',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 20_000,
      sharePremium: 0,
      reservesInitial: 0,
      treasuryInitial: 50_000,
      annualStructureCosts: 0,
      incomeStatement: {
        annualRevenue: 0,
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
          retirementAge: 65,
          annualIncomeNeed: 0,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 0,
          exceptionalContributions: [],
          annualContribution: { amount: 0, startYear: 2026, endYear: 2026 },
          remunerationRate: 0,
        },
        remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
      }],
      loans: [],
      subsidiaries: [],
    },
    allocationMatrix: {
      sweepThreshold: 0,
      pockets: [],
    },
  };
}

describe('simulateTresorerie — compte bancaire pivot', () => {
  it('scénario A : rémunération 80 k€, filiale mère-fille 50 k€ et poche court terme sans liquidation anticipée', () => {
    const inputs = baseV3();
    inputs.company.treasuryInitial = 200_000;
    inputs.company.incomeStatement = {
      annualRevenue: 0,
      annualStructureCosts: 0,
      workingCapitalRequirement: 30_000,
    };
    inputs.company.associates[0].remuneration = {
      source: 'holding',
      loadedAnnualCost: 80_000,
      socialChargeRate: 0.35,
      startYear: 2026,
      endYear: 2030,
      annualNeedAfterStop: 30_000,
    };
    inputs.company.subsidiaries = [{
      id: 'filiale-1',
      label: 'Filiale distributrice',
      parentEntityId: 'societe',
      ownershipPct: 100,
      holdingOwnershipPct: 100,
      motherDaughterEligible: true,
      fiscalIntegrationEstimateEnabled: false,
      servicesSchedule: [],
      dividendsSchedule: [{ amount: 50_000, startYear: 2026, endYear: 2035 }],
    }];
    inputs.allocationMatrix = {
      sweepThreshold: 20_000,
      minimumBankBalance: 20_000,
      pockets: [{
        id: 'court-terme',
        label: 'Poche court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        durationYears: 5,
        annualReturnRate: 0,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 50,
        annualAllocationPct: 0,
        repeatAtTerm: false,
      }],
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 10);

    rows.forEach(row => {
      if ((row.tresorerieBanqueFin ?? 0) < 50_000) {
        expect(row.alerteTresorerieBancaireInsuffisante).toBe(true);
        expect(row.deficitTresorerieBancaire).toBeGreaterThan(0);
      } else {
        expect(row.deficitTresorerieBancaire).toBe(0);
      }
    });
    expect(rows[1].capitalDistrib).toBeCloseTo(75_000, 2);
    expect(rows[1].alerteTresorerieBancaireInsuffisante).toBe(false);
  });

  it('applique le régime standard en auto si la durée de détention renseignée est inférieure à deux ans', () => {
    const inputs = baseV3();
    inputs.company.subsidiaries = [{
      id: 'filiale-1',
      label: 'Filiale 1',
      parentEntityId: 'societe',
      ownershipPct: 100,
      holdingOwnershipPct: 100,
      motherDaughterEligible: true,
      fiscalIntegrationEstimateEnabled: false,
      servicesSchedule: [],
      dividendsSchedule: [],
      disposal: {
        year: 2026,
        estimatedPrice: 100_000,
        taxBasis: 40_000,
        fees: 0,
        regime: 'auto',
        acquisitionYear: 2025,
      },
    }];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].cessionFilialesQuotePartTaxable).toBe(60_000);
    expect(rows[0].quotePartTaxable).toBe(60_000);
  });
});
