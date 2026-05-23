// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import PrevoyancePage from '../PrevoyancePage';

const baseData: PrevoyanceRegimeSettings['data'] = {
  arret: {
    carences: { maladie: 3, accident: 0, hospitalisation: 0 },
    maxDurationDays: 1095,
    paliers: [
      {
        fromDay: 4,
        toDay: 1095,
        label: 'IJSS',
        amount: { mode: 'formula', value: null, label: 'RO' },
      },
    ],
  },
  invalidite: {
    paliers: [
      {
        fromRate: 0,
        toRate: 32,
        label: 'Non déclenché',
        amount: { mode: 'fixed_eur_month', value: 0, label: '0 €' },
      },
      {
        fromRate: 33,
        toRate: null,
        label: 'Pension invalidité',
        amount: { mode: 'formula', value: null, label: 'RO invalidité' },
      },
    ],
  },
  deces: {
    capital: { mode: 'formula', value: null, label: 'Capital RO' },
    doublementAccident: false,
    doubleEffet: false,
    renteConjoint: null,
    renteEducation: null,
  },
  cotisations: { mode: 'none', value: null },
};

const sources = {
  fiche: 'Mémento 2026',
  pagesPdf: [1],
  noteValidation: 'Test',
};

const regimes: PrevoyanceRegimeSettings[] = [
  {
    code: 'salarie-cpam',
    label: 'Salarié CPAM',
    caisse: 'CPAM',
    population: 'salarie',
    defaultContractKind: 'collectif',
    year: 2026,
    data: baseData,
    sources,
  },
  {
    code: 'ssi',
    label: 'SSI',
    caisse: 'SSI',
    population: 'tns',
    defaultContractKind: 'individuel',
    year: 2026,
    data: baseData,
    sources,
  },
];

const maintien: PrevoyanceMaintienEmployeurSettings[] = [
  {
    code: PREVOYANCE_MAINTIEN_LEGAL_CODE,
    label: 'Code du travail',
    year: 2026,
    data: {
      maintienEmployeur: {
        carenceDays: 7,
        minAncienneteYears: 1,
        paliers: [
          {
            fromAncienneteYears: 1,
            toAncienneteYears: null,
            firstPeriodDays: 30,
            firstPeriodRate: 90,
            secondPeriodDays: 30,
            secondPeriodRate: 66.67,
          },
        ],
      },
    },
    sources,
  },
];

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: { passHistoryByYear: { 2026: 48_060 } },
  }),
}));

vi.mock('@/utils/cache/prevoyanceSettingsCache', () => ({
  getPrevoyanceRegimeSettings: vi.fn(async () => regimes),
  getPrevoyanceMaintienEmployeurSettings: vi.fn(async () => maintien),
}));

describe('PrevoyancePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('affiche le parcours salarié sans frais professionnels', async () => {
    render(<PrevoyancePage />);

    expect(await screen.findByText('Contrats entreprise')).toBeInTheDocument();
    expect(screen.queryByText('Frais professionnels')).not.toBeInTheDocument();
    expect(screen.getByText(/employeur/i)).toBeInTheDocument();
  });

  it('bascule en TNS et permet trois contrats en colonnes', async () => {
    const user = userEvent.setup();
    render(<PrevoyancePage />);

    await screen.findByText('Contrats entreprise');
    await user.click(screen.getByRole('radio', { name: 'TNS / libéral' }));
    expect(await screen.findByText('Contrats individuels')).toBeInTheDocument();
    expect(screen.getAllByText('Frais professionnels').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Ajouter' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => {
      expect(screen.getAllByLabelText(/Nom du contrat/i)).toHaveLength(3);
    });
  });
});
