// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TresoPlacementSection } from '../components/TresoPlacementSection';

const INPUTS = {
  version: 4,
  foyer: {
    selectedAssociateId: 'associe-1',
    currentAge: 50,
    retirementAge: 65,
    annualIncomeNeed: 30000,
    projectionStartYear: 2026,
  },
  company: {
    creationType: 'existante',
    legalForm: 'sas',
    shareCapital: 0,
    sharePremium: 0,
    reservesInitial: 0,
    treasuryInitial: 100000,
    annualStructureCosts: 3000,
    incomeStatement: {
      annualRevenue: 0,
      annualStructureCosts: 3000,
      workingCapitalRequirement: 25000,
    },
    reducedCorporateTaxEligible: true,
    associates: [],
    loans: [],
    subsidiaries: [],
  },
  allocationMatrix: {
    sweepThreshold: 10000,
    minimumBankBalance: 10000,
    pockets: [
      {
        id: 'poche-1',
        label: 'Court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        durationYears: 5,
        annualReturnRate: 0.04,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 80,
        annualAllocationPct: 60,
        repeatAtTerm: false,
      },
      {
        id: 'poche-2',
        label: 'Moyen terme',
        kind: 'capitalisation',
        horizon: 'moyen_terme',
        durationYears: 6,
        annualReturnRate: 0.03,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 10,
        annualAllocationPct: 30,
        repeatAtTerm: false,
      },
      {
        id: 'poche-3',
        label: 'Long terme',
        kind: 'capitalisation',
        horizon: 'long_terme',
        durationYears: 8,
        annualReturnRate: 0.03,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 40,
        annualAllocationPct: 30,
        repeatAtTerm: false,
      },
    ],
  },
} as any;

describe('TresoPlacementSection', () => {
  it('affiche les totaux initial et annuel de la matrice', () => {
    const html = renderToStaticMarkup(
      <TresoPlacementSection inputs={INPUTS} onChange={() => {}} />,
    );

    expect(html).toContain('Répartition de l’allocation initiale : 130 %');
    expect(html).toContain('Répartition du balayage annuel : 120 %');
  });

  it('présente la banque pivot et les poches par horizon sans mode manuel', () => {
    render(<TresoPlacementSection inputs={INPUTS as any} onChange={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Placement unique' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stratégie multi-poches' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Mode déduit/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Solde minimum banque \+ BFR/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Compte bancaire/i })).toBeInTheDocument();
    expect(screen.getByText('0 %')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /Court terme/i }))
      .getByRole('button', { name: /Paramétrer Court terme/i })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /Moyen terme/i }))
      .getByRole('button', { name: /Paramétrer Moyen terme/i })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /Long terme/i }))
      .getByRole('button', { name: /Paramétrer Long terme/i })).toBeInTheDocument();
    expect(screen.getByText('4 %')).toBeInTheDocument();
  });

  it('affiche une barre empilée de répartition initiale en euros', () => {
    const balancedInputs = {
      ...INPUTS,
      allocationMatrix: {
        ...INPUTS.allocationMatrix,
        pockets: [
          { ...INPUTS.allocationMatrix.pockets[0], initialAllocationPct: 30 },
          { ...INPUTS.allocationMatrix.pockets[1], initialAllocationPct: 20 },
          { ...INPUTS.allocationMatrix.pockets[2], initialAllocationPct: 10 },
        ],
      },
    };
    render(<TresoPlacementSection inputs={balancedInputs as any} onChange={vi.fn()} />);

    const stack = screen.getByLabelText('Répartition de la trésorerie initiale');
    expect(within(stack).getByRole('button', { name: /Compte bancaire libre : 5[\s\u202f]000 €/i })).toBeDisabled();
    expect(within(stack).getByRole('button', { name: /Solde minimum \+ BFR : 35[\s\u202f]000 €/i })).toBeDisabled();
    expect(within(stack).getByRole('button', { name: /Court terme : 30[\s\u202f]000 €/i })).toBeInTheDocument();

    fireEvent.click(within(stack).getByRole('button', { name: /Court terme : 30[\s\u202f]000 €/i }));
    expect(screen.getByText('Paramétrer la poche')).toBeInTheDocument();
  });

  it('affiche une alerte quand la projection signale un déficit bancaire', () => {
    render(
      <TresoPlacementSection
        inputs={INPUTS as any}
        projectionRows={[{
          year: 3,
          alerteTresorerieBancaireInsuffisante: true,
          deficitTresorerieBancaire: 12000,
        } as any]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Compte bancaire insuffisant en 2028');
    expect(screen.getByRole('alert')).toHaveTextContent('12 000 €');
  });

  it('ouvre une poche depuis sa colonne avec ses valeurs existantes sans ordre ni destination', () => {
    render(<TresoPlacementSection inputs={INPUTS as any} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Court terme/i }));

    expect(screen.getByText('Paramétrer la poche')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Court terme')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Ordre de consommation/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Destination au terme/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Au terme, le produit revient sur le compte bancaire/i)).toBeInTheDocument();
  });

  it('supprime une poche depuis la modale', () => {
    const onChange = vi.fn();
    render(<TresoPlacementSection inputs={INPUTS as any} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Long terme/i }));
    fireEvent.click(screen.getByRole('button', { name: /Supprimer la poche/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      allocationMatrix: expect.objectContaining({
        pockets: [
          expect.objectContaining({ id: 'poche-1' }),
          expect.objectContaining({ id: 'poche-2' }),
        ],
      }),
    }));
  });

  it('supprime la dernière poche depuis la modale', () => {
    const onChange = vi.fn();
    const onePocketInputs = {
      ...INPUTS,
      allocationMatrix: {
        ...INPUTS.allocationMatrix,
        pockets: [INPUTS.allocationMatrix.pockets[0]],
      },
    };
    render(<TresoPlacementSection inputs={onePocketInputs as any} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Court terme/i }));
    fireEvent.click(screen.getByRole('button', { name: /Supprimer la poche/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      allocationMatrix: expect.objectContaining({
        pockets: [],
      }),
    }));
  });

  it('autorise la suppression de la dernière poche et crée une nouvelle poche depuis l’état vide', () => {
    const emptyInputs = {
      ...INPUTS,
      allocationMatrix: {
        ...INPUTS.allocationMatrix,
        pockets: [],
      },
    };
    const onChange = vi.fn();

    render(<TresoPlacementSection inputs={emptyInputs as any} onChange={onChange} />);

    expect(screen.getByRole('button', {
      name: /Aucun placement, trésorerie sur compte bancaire : 100[\s\u202f]000 €/i,
    })).toBeDisabled();
    expect(screen.getByText('Trésorerie conservée sur compte bancaire, sans rendement')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une poche court terme/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      allocationMatrix: expect.objectContaining({
        pockets: [expect.objectContaining({ id: 'poche-1' })],
      }),
    }));
  });
});
