// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TresoInputsV5 } from '@/engine/tresorerie/types';
import { TresoTimelineSection } from '../components/timeline/TresoTimelineSection';

const BASE_INPUTS: TresoInputsV5 = {
  version: 5,
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
    treasuryInitial: 150000,
    annualStructureCosts: 3000,
    incomeStatement: {
      annualRevenue: 0,
      annualStructureCosts: 3000,
      workingCapitalRequirement: 0,
    },
    reducedCorporateTaxEligible: true,
    associates: [{
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
        exceptionalContributions: [],
        annualContribution: { amount: 0, startYear: 2026, endYear: 2026 },
        remunerationRate: 0,
      },
      revenuePhases: [
        {
          id: 'phase-remu',
          label: 'Rémunération holding',
          startYear: 2026,
          source: 'holding',
          loadedAnnualCost: 80000,
          socialChargeRate: 0.3,
          annualNetIncomeNeed: 0,
          useCcaForCompletion: true,
        },
        {
          id: 'phase-besoin',
          label: 'Besoin retraite',
          startYear: 2031,
          source: 'none',
          loadedAnnualCost: 0,
          socialChargeRate: 0,
          annualNetIncomeNeed: 40000,
          useCcaForCompletion: false,
        },
      ],
    }],
    loans: [],
    subsidiaries: [{
      id: 'filiale-1',
      label: 'Filiale A',
      parentEntityId: 'company',
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
    }],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    minimumBankBalance: 50000,
    pockets: [],
  },
};

function cloneInputs(patch?: (inputs: TresoInputsV5) => void): TresoInputsV5 {
  const inputs = structuredClone(BASE_INPUTS);
  patch?.(inputs);
  return inputs;
}

function openFirstPhaseModal() {
  const [phaseButton] = screen.getAllByRole('button', { name: /Modifier Rémunération holding/i });
  fireEvent.click(phaseButton);
}

describe('TresoTimelineSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche un état de démarrage si la société ou le profil associé est incomplet', () => {
    const onChange = vi.fn();
    const openSociety = vi.fn();
    window.addEventListener('ts:open-society-panel', openSociety);

    render(
      <TresoTimelineSection
        inputs={cloneInputs(inputs => {
          inputs.company.label = '';
          inputs.company.associates[0].profile!.currentAge = 0;
        })}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Parcours de revenus de l’associé')).toBeInTheDocument();
    expect(screen.getByText(/Compléter la société et l’associé/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Compléter la société/i }));
    expect(openSociety).toHaveBeenCalledTimes(1);
    window.removeEventListener('ts:open-society-panel', openSociety);
  });

  it('reprend l’en-tête standard des sections du simulateur', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Parcours de revenus de l’associé/i }))
      .toHaveClass('ts-section__title');
    expect(screen.getByText(/Phases de rémunération/i)).toHaveClass('ts-section__subtitle');
    expect(document.querySelector('.sim-card__icon')).toBeInTheDocument();
    expect(document.querySelector('.ts-section__divider')).toBeInTheDocument();
  });

  it('affiche un message informatif pour un associé personne morale', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs(inputs => {
          inputs.company.associates[0].kind = 'pm';
        })}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Une personne morale ne porte pas de parcours de revenu personnel/i))
      .toBeInTheDocument();
  });

  it('ouvre la modale du palier avec les valeurs existantes', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    openFirstPhaseModal();

    expect(screen.getByText('Paramétrer le palier')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('2026')).toHaveLength(2);
    expect(screen.getByDisplayValue(value => value.replace(/\s/g, '') === '80000')).toBeInTheDocument();
    expect(screen.getAllByText(/Net annuel estimé/i).length).toBeGreaterThan(0);
  });

  it('bloque l’enregistrement si deux paliers commencent la même année', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    openFirstPhaseModal();
    fireEvent.change(screen.getByLabelText('Année de début'), { target: { value: '2031' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/Un autre palier commence déjà en 2031/i);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  });

  it('recalcule la fin dérivée dès que l’année de début est modifiée', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    openFirstPhaseModal();
    fireEvent.change(screen.getByLabelText('Année de début'), { target: { value: '2032' } });

    expect(screen.getByText(/Jusqu’à l’horizon de projection/i)).toBeInTheDocument();
  });

  it('désactive la suppression quand il ne reste qu’un seul palier', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs(inputs => {
          inputs.company.associates[0].revenuePhases = [inputs.company.associates[0].revenuePhases[0]];
        })}
        onChange={vi.fn()}
      />,
    );

    openFirstPhaseModal();

    const footer = screen.getByTestId('ts-phase-modal-footer');
    expect(within(footer).getByRole('button', { name: /Supprimer ce palier/i })).toBeDisabled();
  });
});
