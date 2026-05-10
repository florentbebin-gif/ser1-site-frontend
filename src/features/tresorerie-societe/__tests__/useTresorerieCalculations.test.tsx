// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TresoInputsRuntime, TresoInputsV3, TresoInputsV5 } from '../../../engine/tresorerie/types';
import { useTresorerieCalculations } from '../hooks/useTresorerieCalculations';

vi.mock('../../../hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {
      pfuRateIR: 12.8,
      irScaleCurrent: [],
      _raw_tax: {
        corporateTax: {
          current: {
            normalRate: 25,
            reducedRate: 15,
            reducedThreshold: 42_500,
            tnsDividendBasePct: 10,
            maxDeductibleCcaInterestRate: 4.55,
            dividendsAbatementPct: 40,
            motherDaughterQpfc: { standard: 5, group: 1 },
          },
        },
        pfu: { current: { rateIR: 12.8 } },
        incomeTax: { scaleCurrent: [] },
      },
      _raw_ps: {
        patrimony: {
          current: { generalRate: 17.2 },
        },
      },
    },
    loading: false,
    error: null,
    meta: {},
  }),
}));

function baseInputs(): TresoInputsV3 {
  return {
    version: 3,
    selectedAssociateId: 'associe-1',
    foyer: {
      selectedAssociateId: 'associe-1',
      currentAge: 45,
      retirementAge: 65,
      annualIncomeNeed: 30_000,
      projectionStartYear: 2026,
    },
    company: {
      creationType: 'existante',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 10_000,
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
        id: 'associe-1',
        label: 'Associé 1',
        kind: 'pp',
        profile: {
          currentAge: 45,
          retirementAge: 65,
          annualIncomeNeed: 30_000,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 120, economicRightsPct: 100 }],
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

function CalculationProbe({ inputs }: { inputs: TresoInputsRuntime }) {
  const result = useTresorerieCalculations(inputs);
  return (
    <>
      <div data-testid="calculation-error">{result.error ?? ''}</div>
      <div data-testid="simulation-error">{result.simulationError ?? ''}</div>
      <div data-testid="duree-cca">{result.kpis.dureeRemboursementCCA ?? ''}</div>
    </>
  );
}

function baseInputsV5(): TresoInputsV5 {
  return {
    version: 5,
    selectedAssociateId: 'associe-1',
    foyer: { selectedAssociateId: 'associe-1' },
    company: {
      label: 'Holding',
      projectionStartYear: 2026,
      creationType: 'existante',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 10_000,
      sharePremium: 0,
      reservesInitial: 0,
      treasuryInitial: 100_000,
      annualStructureCosts: 0,
      incomeStatement: {
        annualRevenue: 0,
        annualStructureCosts: 0,
        workingCapitalRequirement: 0,
      },
      reducedCorporateTaxEligible: true,
      associates: [{
        id: 'associe-1',
        label: 'Associé 1',
        kind: 'pp',
        profile: {
          currentAge: 65,
          retirementAge: 65,
          annualIncomeNeed: 30_000,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 30_000,
          exceptionalContributions: [],
          annualContribution: { amount: 0, startYear: 2026 },
          remunerationRate: 0,
        },
        revenuePhases: [{
          id: 'phase-besoin',
          startYear: 2026,
          source: 'none',
          loadedAnnualCost: 0,
          socialChargeRate: 0,
          annualNetIncomeNeed: 10_000,
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

describe('useTresorerieCalculations', () => {
  it('expose les erreurs de validation moteur sans bloquer la page', () => {
    render(<CalculationProbe inputs={baseInputs()} />);

    expect(screen.getByTestId('calculation-error').textContent).toBe('');
    expect(screen.getByTestId('simulation-error').textContent)
      .toContain('Détention capital supérieure à 100 %');
  });

  it('calcule la durée CCA avec le besoin annuel du palier actif V5', () => {
    render(<CalculationProbe inputs={baseInputsV5()} />);

    expect(screen.getByTestId('duree-cca').textContent).toBe('3');
  });
});
