// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TresoSocieteSection } from '../components/TresoSocieteSection';

const INPUTS = {
  version: 3,
  selectedAssociateId: 'associe-2',
  company: {
    creationType: 'existante',
    legalForm: 'sas',
    companyKind: 'holding_patrimoniale',
    shareCapital: 10000,
    sharePremium: 0,
    reservesInitial: 8000,
    treasuryInitial: 150000,
    annualStructureCosts: 3000,
    incomeStatement: {
      annualRevenue: 120000,
      annualStructureCosts: 3000,
      workingCapitalRequirement: 50000,
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
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 60, economicRightsPct: 60 }],
        roles: ['associe_sans_statut'],
        ccaInitial: 0,
        ccaAnnualContribution: 0,
        cca: {
          currentBalance: 0,
          exceptionalContributions: [],
          annualContribution: { amount: 0, startYear: 2026, endYear: 2026 },
          remunerationRate: 0,
        },
        remunerationAnnualCost: 0,
      },
      {
        id: 'associe-2',
        label: 'Associé 2',
        kind: 'pp',
        profile: {
          currentAge: 45,
          retirementAge: 62,
          annualIncomeNeed: 24000,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 40, economicRightsPct: 40 }],
        roles: ['gerant_tns'],
        ccaInitial: 0,
        ccaAnnualContribution: 0,
        cca: {
          currentBalance: 10000,
          exceptionalContributions: [],
          annualContribution: { amount: 12000, startYear: 2026, endYear: 2030 },
          remunerationRate: 0.04,
        },
        remunerationAnnualCost: 50000,
      },
    ],
    loans: [],
    subsidiaries: [
      {
        id: 'filiale-1',
        label: 'Filiale A',
        parentEntityId: 'societe',
        ownershipPct: 80,
        displayOrder: 0,
        holdingOwnershipPct: 80,
        annualServicesRevenue: 0,
        annualDividends: 18000,
        motherDaughterEligible: true,
        fiscalIntegrationEstimateEnabled: false,
      },
      {
        id: 'filiale-2',
        label: 'Filiale B',
        parentEntityId: 'filiale-1',
        ownershipPct: 51,
        displayOrder: 1,
        holdingOwnershipPct: 51,
        annualServicesRevenue: 0,
        annualDividends: 0,
        motherDaughterEligible: true,
        fiscalIntegrationEstimateEnabled: false,
      },
    ],
  },
  allocationMatrix: {
    mode: 'strategy',
    sweepThreshold: 50000,
    pockets: [],
  },
} as any;

describe('TresoSocieteSection', () => {
  it('affiche un organigramme cliquable sans l’ancien snapshot trésorerie/réserves/CCA', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    expect(screen.getByText('Associé 1')).toBeInTheDocument();
    expect(screen.getByText('Associé 2')).toBeInTheDocument();
    expect(screen.getByText('60 %')).toBeInTheDocument();
    expect(screen.getByText('40 %')).toBeInTheDocument();
    expect(screen.getByText('Holding patrimoniale')).toBeInTheDocument();
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('Filiale A')).toBeInTheDocument();
    expect(screen.getByText('Filiale B')).toBeInTheDocument();
    expect(screen.queryByText(/Trésorerie 150/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Réserves 8/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^CCA /)).not.toBeInTheDocument();
  });

  it('met en évidence l’associé actif et ouvre sa modale au clic', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    const activeAssociate = screen.getByRole('button', { name: /Paramétrer Associé 2/ });
    expect(activeAssociate).toHaveClass('is-active');

    fireEvent.click(activeAssociate);

    expect(screen.getByText('Paramétrer l’associé')).toBeInTheDocument();
    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
    expect(screen.getByDisplayValue('62')).toBeInTheDocument();
    expect(screen.getByText('Taux maximum déductible')).toBeInTheDocument();
  });

  it('signale seulement les détentions supérieures à 100 %', () => {
    const onChange = vi.fn();
    const invalid = {
      ...INPUTS,
      company: {
        ...INPUTS.company,
        associates: INPUTS.company.associates.map((associate: any, index: number) => ({
          ...associate,
          ownershipLots: [{
            ...associate.ownershipLots[0],
            capitalPct: index === 0 ? 70 : 40,
            economicRightsPct: index === 0 ? 70 : 40,
          }],
        })),
      },
    };

    render(<TresoSocieteSection inputs={invalid} onChange={onChange} />);

    expect(screen.getByText('Détention capital supérieure à 100 %')).toBeInTheDocument();
    expect(screen.getByText('Droits économiques supérieurs à 100 %')).toBeInTheDocument();
  });
});
