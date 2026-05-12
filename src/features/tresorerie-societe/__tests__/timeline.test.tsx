// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssociateRevenuePhaseInputV6, TresoInputsV6 } from '@/engine/tresorerie/types';
import { TresoTimelineSection } from '../components/timeline/TresoTimelineSection';
import { computeTimelineRange } from '../components/timeline/timelineLayout';

function phase(patch: Partial<AssociateRevenuePhaseInputV6>): AssociateRevenuePhaseInputV6 {
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

const BASE_INPUTS: TresoInputsV6 = {
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
    }],
    loans: [],
    subsidiaries: [{
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
    }],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    minimumBankBalance: 50000,
    pockets: [],
  },
};

function cloneInputs(patch?: (inputs: TresoInputsV6) => void): TresoInputsV6 {
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

  it('permet d’allonger l’horizon de projection', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Horizon de projection'), { target: { value: '25' } });

    expect(screen.getByText('2050')).toBeInTheDocument();
  });

  it('place le début et l’horizon de projection dans la même grille de réglages', () => {
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={vi.fn()} />);

    const grid = document.querySelector('.ts-timeline-settings-grid');

    expect(grid).toBeInTheDocument();
    expect(grid).toContainElement(screen.getByLabelText('Début de projection'));
    expect(grid).toContainElement(screen.getByLabelText('Horizon de projection'));
  });

  it('élargit le SVG quand l’horizon devient long', () => {
    const inputs = cloneInputs();
    const layout = computeTimelineRange(inputs.company, inputs.company.associates[0], 30);

    expect(layout.svgWidth).toBeGreaterThan(1000);
  });

  it('supprime les jalons et badges numérotés du schéma', () => {
    const inputs = cloneInputs();
    const layout = computeTimelineRange(inputs.company, inputs.company.associates[0], 15);

    render(<TresoTimelineSection inputs={inputs} onChange={vi.fn()} />);

    expect(layout.paliers).toHaveLength(2);
    expect(document.querySelectorAll('.ts-timeline-track__phase-badge')).toHaveLength(0);
    expect(document.querySelectorAll('.ts-timeline-track__milestone-label')).toHaveLength(0);
  });

  it('masque les libellés internes des bandes trop courtes pour éviter les chevauchements', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs(inputs => {
          inputs.company.subsidiaries = [];
          inputs.company.associates[0].revenuePhases = [
            phase({
              id: 'phase-2026',
              label: 'A',
              startYear: 2026,
              endYear: 2026,
              remuneration: {
                enabled: true,
                source: 'holding',
                loadedAnnualCost: 0,
                socialChargeRate: 0,
              },
            }),
            phase({
              id: 'phase-2027',
              label: 'B',
              startYear: 2027,
              endYear: 2027,
            }),
          ];
        })}
        onChange={vi.fn()}
      />,
    );

    expect(document.querySelectorAll('.ts-timeline-track__phase-badge')).toHaveLength(0);
    expect(screen.queryByText(/2026-2026 · besoin/i)).not.toBeInTheDocument();
    expect(document.querySelector('.ts-timeline-track')).toBeInTheDocument();
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
    expect(screen.getByLabelText('Année de début')).toHaveDisplayValue('2026');
    expect(screen.getByLabelText('Année de fin')).toHaveDisplayValue('2030');
    expect(screen.getByDisplayValue(value => value.replace(/\s/g, '') === '80000')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Rémunération/i }).length).toBeGreaterThan(0);
  });

  it('bloque l’enregistrement si deux paliers activent la même sous-phase sur les mêmes années', () => {
    render(
      <TresoTimelineSection
        inputs={cloneInputs(inputs => {
          inputs.company.associates[0].revenuePhases[1].remuneration = {
            enabled: true,
            source: 'holding',
            loadedAnnualCost: 50000,
            socialChargeRate: 0.2,
          };
        })}
        onChange={vi.fn()}
      />,
    );

    openFirstPhaseModal();
    fireEvent.change(screen.getByLabelText('Année de début'), { target: { value: '2031' } });
    fireEvent.change(screen.getByLabelText('Année de fin'), { target: { value: '2035' } });

    expect(screen.getByRole('alert')).toHaveTextContent(/sous-phase Rémunération/i);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  });

  it('persiste l’année de fin saisie dans le palier', () => {
    const onChange = vi.fn();
    render(<TresoTimelineSection inputs={cloneInputs()} onChange={onChange} />);

    openFirstPhaseModal();
    fireEvent.change(screen.getByLabelText('Année de fin'), { target: { value: '2029' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      company: expect.objectContaining({
        associates: expect.arrayContaining([
          expect.objectContaining({
            revenuePhases: expect.arrayContaining([
              expect.objectContaining({ id: 'phase-remu', endYear: 2029 }),
            ]),
          }),
        ]),
      }),
    }));
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
