// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TresoSocieteSection } from '../components/TresoSocieteSection';

const INPUTS = {
  version: 4,
  selectedAssociateId: 'associe-2',
  company: {
    label: 'Ma holding',
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
        remuneration: {
          source: 'holding',
          loadedAnnualCost: 50000,
          socialChargeRate: 0.45,
          endYear: 2030,
          annualNeedAfterStop: 30000,
        },
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
        treasuryInitial: 20000,
        workingCapitalRequirement: 5000,
        distributableReserves: 12000,
        servicesSchedule: [{ amount: 7000, startYear: 2026, endYear: 2028 }],
        dividendsSchedule: [{ amount: 18000, startYear: 2026, endYear: 2030 }],
        disposal: {
          year: 2031,
          estimatedPrice: 100000,
          taxBasis: 40000,
          fees: 2000,
          regime: 'pvlt',
        },
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
    minimumBankBalance: 50000,
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

  it('porte les pourcentages sur les liens du schéma, pas dans les blocs', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    const associate = screen.getByRole('button', { name: /Paramétrer Associé 1/ });
    const subsidiary = screen.getByRole('button', { name: /Paramétrer Filiale A/ });

    expect(within(associate).queryByText('60 %')).not.toBeInTheDocument();
    expect(within(subsidiary).queryByText('80 %')).not.toBeInTheDocument();
    expect(screen.getByText('60 %')).toBeInTheDocument();
    expect(screen.getByText('80 %')).toBeInTheDocument();
  });

  it('n’étire pas un organigramme simple sur toute la largeur du bloc', () => {
    const simpleInputs = {
      ...INPUTS,
      selectedAssociateId: 'associe-1',
      company: {
        ...INPUTS.company,
        associates: [INPUTS.company.associates[0]],
        subsidiaries: [],
      },
    };

    render(<TresoSocieteSection inputs={simpleInputs} onChange={vi.fn()} />);

    const svg = screen.getByRole('img', { name: /Schéma des détentions société/i });
    expect(Number.parseFloat(svg.style.width)).toBeLessThan(230);
  });

  it('met en évidence l’associé actif et ouvre sa modale au clic', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    const activeAssociate = screen.getByRole('button', { name: /Paramétrer Associé 2/ });
    expect(activeAssociate).toHaveClass('is-active');
    expect(within(activeAssociate).getByText('Actif')).toBeInTheDocument();

    fireEvent.click(activeAssociate);

    expect(screen.getByText('Paramétrer l’associé')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('45').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('62')).toBeInTheDocument();
    expect(screen.getByText('Taux maximum déductible')).toBeInTheDocument();
  });

  it('paramètre le libellé société sans menu rémunérations dans la société', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Holding patrimoniale/i }));

    expect(screen.getByDisplayValue('Ma holding')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rémunérations & TNS/i })).not.toBeInTheDocument();
  });

  it('déplace la rémunération dans la modale associé avec source holding ou filiale', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Associé 2/ }));

    expect(screen.getByRole('button', { name: /Rémunération/i })).toBeInTheDocument();
    expect(screen.getByText('Rémunération nette estimée')).toBeInTheDocument();
    expect(screen.getByDisplayValue(value => value.replace(/\s/g, '') === '50000')).toBeInTheDocument();
    expect(screen.getByText('Filiale A')).toBeInTheDocument();
  });

  it('enrichit la modale filiale avec trésorerie, paliers vers la mère et cession', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Filiale A/ }));

    expect(screen.queryByLabelText(/Ordre d’affichage/i)).not.toBeInTheDocument();
    expect(screen.getByText('Prestations annuelles vers la mère')).toBeInTheDocument();
    expect(screen.getByText('Dividendes annuels vers la mère')).toBeInTheDocument();
    expect(screen.getByText('Trésorerie de la filiale')).toBeInTheDocument();
    expect(screen.getByText('BFR filiale')).toBeInTheDocument();
    expect(screen.getByText('Réserves distribuables')).toBeInTheDocument();
    expect(screen.getByText('Scénario de cession')).toBeInTheDocument();
    expect(screen.getByText('Année d’acquisition')).toBeInTheDocument();
    expect(screen.getByText('Régime PVLT titres de participation')).toBeInTheDocument();
  });

  it('rend la navigation latérale associé actionnable', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Associé 2/ }));
    const remunerationTab = screen.getByRole('button', { name: 'Rémunération' });
    fireEvent.click(remunerationTab);

    expect(remunerationTab).toHaveAttribute('aria-current', 'page');
  });

  it('ajoute un palier de dividendes filiale depuis la modale', () => {
    const onChange = vi.fn();
    render(<TresoSocieteSection inputs={INPUTS} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Filiale A/ }));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un palier de dividendes/i }));

    const nextInputs = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(nextInputs.company.subsidiaries[0].dividendsSchedule).toHaveLength(2);
    expect(nextInputs.company.subsidiaries[0].dividendsSchedule[1]).toEqual(expect.objectContaining({
      startYear: 2031,
    }));
  });

  it('rééquilibre les autres associés quand une saisie ferait dépasser 100 %', () => {
    const onChange = vi.fn();
    render(<TresoSocieteSection inputs={INPUTS} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Associé 1/ }));
    fireEvent.change(screen.getAllByDisplayValue('60')[0], { target: { value: '80' } });

    const nextInputs = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(nextInputs.company.associates[0].ownershipLots[0].capitalPct).toBe(80);
    expect(nextInputs.company.associates[1].ownershipLots[0].capitalPct).toBe(20);
  });

  it('ouvre la modale associé au clavier depuis le schéma SVG', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    const activeAssociate = screen.getByRole('button', { name: /Paramétrer Associé 2/ });
    fireEvent.keyDown(activeAssociate, { key: 'Enter' });

    expect(screen.getByText('Paramétrer l’associé')).toBeInTheDocument();
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
