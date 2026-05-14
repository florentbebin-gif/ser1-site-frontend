// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TresoSocieteSection } from '../components/TresoSocieteSection';

const INPUTS = {
  version: 4,
  selectedAssociateId: 'associe-2',
  foyer: {
    selectedAssociateId: 'associe-2',
    currentAge: 45,
    retirementAge: 62,
    annualIncomeNeed: 24000,
    projectionStartYear: 2026,
  },
  company: {
    label: 'Ma holding',
    projectionStartYear: 2026,
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
        cca: {
          currentBalance: 0,
          exceptionalContributions: [],
          annualContribution: { amount: 0, startYear: 2026, endYear: 2026 },
          remunerationRate: 0,
        },
        remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
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
        cca: {
          currentBalance: 10000,
          exceptionalContributions: [],
          annualContribution: { amount: 12000, startYear: 2026, endYear: 2030 },
          remunerationRate: 0.04,
        },
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
        holdingOwnershipPct: 80,
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
        holdingOwnershipPct: 51,
        motherDaughterEligible: true,
        fiscalIntegrationEstimateEnabled: false,
        servicesSchedule: [],
        dividendsSchedule: [],
      },
    ],
  },
  allocationMatrix: {
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
    expect(screen.getByText('Ma holding')).toBeInTheDocument();
    expect(screen.getByText('Forme sociale : SAS')).toBeInTheDocument();
    expect(screen.getByText('Type société : HP')).toBeInTheDocument();
    expect(screen.queryByText('HP · SAS')).not.toBeInTheDocument();
    expect(screen.queryByText('Société existante')).not.toBeInTheDocument();
    expect(screen.queryByText('Société à créer')).not.toBeInTheDocument();
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
    expect(screen.getByRole('tab', { name: 'Profil' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByDisplayValue('45').length).toBeGreaterThan(0);
    expect(screen.queryByText('Âge de retraite')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'CCA' }));
    expect(screen.getByText('Taux maximum déductible')).toBeInTheDocument();
    expect(screen.getByText(/Les intérêts CCA sont saisis au taux convenu/i)).toBeInTheDocument();
    expect(screen.queryByText(/Les apports et leur programmation/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Apport exceptionnel')).not.toBeInTheDocument();
    expect(screen.queryByText('Apport annuel')).not.toBeInTheDocument();
  });

  it('paramètre le libellé société sans menu rémunérations dans la société', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Ma holding/i }));

    expect(screen.getByDisplayValue('Ma holding')).toBeInTheDocument();
    expect(screen.queryByText('Début de projection')).not.toBeInTheDocument();
    expect(screen.queryByText(/date de début de projection se règle dans le parcours associé/i))
      .not.toBeInTheDocument();
    expect(screen.queryByLabelText('Type de société')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Capital social')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Type société')).toBeInTheDocument();
    expect(screen.getByText('Trésorerie initiale')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /paramètres financiers de la société/i }));
    expect(screen.getByText('Paramètres financiers')).toBeInTheDocument();
    expect(screen.getByText('Capital social')).toBeInTheDocument();
    expect(screen.getByText('Prime d’émission')).toBeInTheDocument();
    expect(screen.getByText('Réserves initiales')).toBeInTheDocument();
    expect(screen.getByText('Réserve légale initiale')).toBeInTheDocument();
    expect(screen.getByText('Éligible au taux réduit d’IS')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rémunérations & TNS/i })).not.toBeInTheDocument();
  });

  it('retire la rémunération de la modale associé au profit de la timeline', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Associé 2/ }));

    expect(screen.queryByRole('tab', { name: 'Rémunération' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Profil' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText(/paliers de revenus se règlent depuis le parcours associé/i))
      .not.toBeInTheDocument();
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
    expect(screen.getByText('Valeur fiscale des titres')).toBeInTheDocument();
    expect(screen.queryByText('Base fiscale')).not.toBeInTheDocument();
    expect(screen.getByText('Année d’acquisition')).toBeInTheDocument();
    expect(screen.getByText('Régime PVLT titres de participation')).toBeInTheDocument();
  });

  it('explique les régimes fiscaux de cession depuis un bouton info', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Filiale A/ }));

    const infoButton = screen.getByRole('button', {
      name: /Comprendre le régime de cession/i,
    });
    expect(infoButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(infoButton);

    expect(infoButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Régime standard/i)).toBeInTheDocument();
    expect(screen.getByText(/plus-value imposable à l’IS/i)).toBeInTheDocument();
    expect(screen.getByText(/quote-part taxable de 12 %/i)).toBeInTheDocument();
    expect(screen.getByText(/plus-value nette long terme/i)).toBeInTheDocument();
    expect(screen.getByText(/taux réduit PME/i)).toBeInTheDocument();
  });

  it('rend la navigation latérale associé actionnable', () => {
    render(<TresoSocieteSection inputs={INPUTS} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Associé 2/ }));
    const ccaTab = screen.getByRole('tab', { name: 'CCA' });
    fireEvent.click(ccaTab);

    expect(ccaTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'ts-associate-tab-cca');
    expect(screen.getByText('Compte courant d’associé')).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('tab', { name: 'Détention' }));
    fireEvent.change(screen.getAllByDisplayValue('60')[0], { target: { value: '80' } });

    const nextInputs = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(nextInputs.company.associates[0].ownershipLots[0].capitalPct).toBe(80);
    expect(nextInputs.company.associates[0].ownershipLots[0].economicRightsPct).toBe(80);
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
