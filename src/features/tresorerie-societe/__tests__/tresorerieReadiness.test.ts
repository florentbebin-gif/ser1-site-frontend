import { describe, expect, it } from 'vitest';
import { getTresoReadiness } from '../utils/tresorerieReadiness';
import type { TresoInputsV6 } from '@/engine/tresorerie/types';

const baseInputs: TresoInputsV6 = {
  version: 6,
  selectedAssociateId: 'associe-1',
  foyer: {
    selectedAssociateId: 'associe-1',
  },
  company: {
    label: 'Holding',
    creationType: 'newco',
    legalForm: 'sas',
    companyKind: 'holding_patrimoniale',
    projectionStartYear: 2026,
    shareCapital: 1000,
    sharePremium: 0,
    reservesInitial: 0,
    legalReserveInitial: 0,
    treasuryInitial: 0,
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
          retirementAge: 65,
          annualIncomeNeed: 30000,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 0,
          remunerationRate: 0,
        },
        revenuePhases: [],
      },
    ],
    loans: [],
    subsidiaries: [],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    minimumBankBalance: 50000,
    pockets: [],
  },
};

describe('getTresoReadiness', () => {
  it('ne déclare pas la synthèse prête sans phase de revenus associée', () => {
    const readiness = getTresoReadiness(baseInputs);

    expect(readiness.personalTimelineReady).toBe(true);
    expect(readiness.synthesisReady).toBe(false);
  });

  it('déclare la synthèse prête quand société, associé PP et phase existent', () => {
    const readiness = getTresoReadiness({
      ...baseInputs,
      company: {
        ...baseInputs.company,
        associates: [
          {
            ...baseInputs.company.associates[0],
            revenuePhases: [
              {
                id: 'phase-1',
                startYear: 2026,
                endYear: 2040,
                remuneration: {
                  enabled: false,
                  source: 'none',
                  loadedAnnualCost: 0,
                  socialChargeRate: 0,
                },
                distribution: {
                  enabled: true,
                  annualNetIncomeNeed: 30000,
                  dividendsStrategy: 'max_treso',
                },
                ccaContribution: { enabled: false },
                ccaRepayment: { enabled: false, strategy: 'aucun' },
              },
            ],
          },
        ],
      },
    });

    expect(readiness.personalTimelineReady).toBe(true);
    expect(readiness.synthesisReady).toBe(true);
  });
});
