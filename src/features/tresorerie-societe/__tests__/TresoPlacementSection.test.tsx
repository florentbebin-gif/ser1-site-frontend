// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TresoPlacementSection } from '../components/TresoPlacementSection';

const INPUTS = {
  version: 3,
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
    reducedCorporateTaxEligible: true,
    associates: [],
    loans: [],
    subsidiaries: [],
  },
  allocationMatrix: {
    mode: 'strategy' as any,
    sweepThreshold: 10000,
    pockets: [
      {
        id: 'poche-1',
        label: 'Court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        withdrawalPriority: 1,
        durationYears: 5,
        annualReturnRate: 0.04,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 80,
        annualAllocationPct: 60,
        repeatAtTerm: false,
        termDestination: 'treasury',
      },
      {
        id: 'poche-2',
        label: 'Moyen terme',
        kind: 'capitalisation',
        horizon: 'moyen_terme',
        withdrawalPriority: 2,
        durationYears: 6,
        annualReturnRate: 0.03,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 10,
        annualAllocationPct: 30,
        repeatAtTerm: false,
        termDestination: 'matrix',
      },
      {
        id: 'poche-3',
        label: 'Long terme',
        kind: 'capitalisation',
        horizon: 'long_terme',
        withdrawalPriority: 3,
        durationYears: 8,
        annualReturnRate: 0.03,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 40,
        annualAllocationPct: 30,
        repeatAtTerm: false,
        termDestination: 'matrix',
      },
    ],
  },
} as any;

describe('TresoPlacementSection', () => {
  it('affiche les totaux initial et annuel de la matrice', () => {
    const html = renderToStaticMarkup(
      <TresoPlacementSection inputs={INPUTS} onChange={() => {}} />,
    );

    expect(html).toContain('Total initial : 130 %');
    expect(html).toContain('Total annuel : 120 %');
  });

  it('présente les poches par horizon sans boutons de mode manuel', () => {
    render(<TresoPlacementSection inputs={INPUTS as any} onChange={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Placement unique' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stratégie multi-poches' })).not.toBeInTheDocument();
    expect(screen.getByText('Mode déduit : stratégie multi-poches')).toBeInTheDocument();
    expect(screen.getByText(/BFR inclus dans le seuil de sécurité/)).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /Court terme/i }))
      .getByRole('button', { name: /Paramétrer Court terme/i })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /Moyen terme/i }))
      .getByRole('button', { name: /Paramétrer Moyen terme/i })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /Long terme/i }))
      .getByRole('button', { name: /Paramétrer Long terme/i })).toBeInTheDocument();
  });

  it('ouvre une poche depuis l’ordre de consommation avec ses valeurs existantes', () => {
    render(<TresoPlacementSection inputs={INPUTS as any} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Paramétrer Court terme/i }));

    expect(screen.getByText('Paramétrer la poche')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Court terme')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
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

    expect(screen.getByText('Trésorerie conservée sur compte bancaire, sans rendement')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une poche/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      allocationMatrix: expect.objectContaining({
        pockets: [expect.objectContaining({ id: 'poche-1' })],
      }),
    }));
  });
});
