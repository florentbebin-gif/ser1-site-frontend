import { fireEvent, screen, within } from '@testing-library/react';
import type { AssociateRevenuePhaseInputV6, TresoInputsV6 } from '@/engine/tresorerie/types';

export function phase(patch: Partial<AssociateRevenuePhaseInputV6>): AssociateRevenuePhaseInputV6 {
  return {
    id: 'phase',
    label: undefined,
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

export const BASE_INPUTS: TresoInputsV6 = {
  version: 6,
  selectedAssociateId: 'associe-1',
  foyer: {
    selectedAssociateId: 'associe-1',
  },
  company: {
    label: 'Holding patrimoniale',
    projectionStartYear: 2026,
    creationType: 'newco',
    legalForm: 'sas',
    companyKind: 'holding_patrimoniale',
    shareCapital: 1000,
    sharePremium: 0,
    reservesInitial: 0,
    legalReserveInitial: 0,
    treasuryInitial: 150000,
    annualStructureCosts: 3000,
    incomeStatement: {
      annualRevenue: 0,
      annualStructureCosts: 3000,
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
          annualIncomeNeed: 0,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 100000,
          remunerationRate: 0,
        },
        revenuePhases: [
          phase({
            id: 'phase-remu',
            label: 'Rémunération holding',
            startYear: 2026,
            endYear: 2030,
            remuneration: {
              enabled: true,
              source: 'holding',
              loadedAnnualCost: 80000,
              socialChargeRate: 0.3,
            },
            ccaRepayment: {
              enabled: true,
              strategy: 'max_treso',
            },
          }),
          phase({
            id: 'phase-besoin',
            label: 'Besoin retraite',
            startYear: 2031,
            endYear: 2040,
            distribution: {
              enabled: true,
              annualNetIncomeNeed: 40000,
              dividendsStrategy: 'max_treso',
            },
          }),
        ],
      },
    ],
    loans: [],
    subsidiaries: [
      {
        id: 'filiale-1',
        label: 'Filiale A',
        parentEntityId: 'societe',
        ownershipPct: 100,
        holdingOwnershipPct: 100,
        motherDaughterEligible: true,
        fiscalIntegrationEstimateEnabled: false,
        servicesSchedule: [],
        dividendsSchedule: [],
        disposal: {
          year: 2035,
          estimatedPrice: 500000,
          taxBasis: 100000,
          fees: 0,
          regime: 'auto',
          acquisitionYear: 2026,
        },
      },
    ],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    minimumBankBalance: 50000,
    pockets: [],
  },
};

export function cloneInputs(patch?: (inputs: TresoInputsV6) => void): TresoInputsV6 {
  const inputs = structuredClone(BASE_INPUTS);
  patch?.(inputs);
  return inputs;
}

export function openPhaseModal(name: RegExp = /Modifier Palier 2026-2030/i) {
  const [phaseButton] = screen.getAllByRole('button', { name });
  fireEvent.click(phaseButton);
}

export function clickModalSubPhase(label: RegExp) {
  const modal = screen.getByText('Paramétrer le palier').closest('.sim-modal') as HTMLElement;
  const nav = modal.querySelector('.ts-phase-modal-nav') as HTMLElement;
  fireEvent.click(within(nav).getByRole('button', { name: label }));
}

export function getPhaseModal() {
  return screen.getByText('Paramétrer le palier').closest('.sim-modal') as HTMLElement;
}
