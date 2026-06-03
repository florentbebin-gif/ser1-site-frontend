// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
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

const sources: PrevoyanceRegimeSettings['sources'] = {
  references: [
    {
      organisme: 'Source de test',
      titre: 'Barème de test',
      url: 'https://example.test/prevoyance',
      dateConsultation: '2026-05-24',
      valeursCouvertes: ['test'],
      confiance: 'haute',
    },
  ],
};

const regimes: PrevoyanceRegimeSettings[] = [
  {
    code: 'salarie-cpam',
    label: 'Salarié secteur privé — CPAM',
    caisse: 'CPAM',
    population: 'salarie',
    defaultContractKind: 'collectif',
    year: 2026,
    data: baseData,
    sources,
  },
  {
    code: 'ssi-artisan-commercant',
    label: 'Artisan / commerçant — SSI',
    caisse: 'SSI',
    population: 'tns',
    defaultContractKind: 'individuel',
    year: 2026,
    data: baseData,
    sources,
  },
  {
    code: 'salarie-msa',
    label: 'Salarié agricole — MSA',
    caisse: 'MSA salariés',
    population: 'salarie',
    defaultContractKind: 'collectif',
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

vi.mock('@/settings/userMode', () => ({
  useUserMode: () => ({ mode: 'simplifie', setMode: vi.fn(), isLoading: false }),
}));

export const PREVOYANCE_PAGE_TEST_TIMEOUT_MS = 10_000;

export function resetPrevoyanceStorage(): void {
  sessionStorage.clear();
}

export function renderPrevoyancePage(): ReturnType<typeof render> {
  return render(<PrevoyancePage />);
}

export async function saisirDateNaissance(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Date de naissance'), '1980-01-01');
  await screen.findByText('Garanties souscrites hors régime obligatoire');
}

export async function choisirRegime(user: ReturnType<typeof userEvent.setup>, optionName: RegExp) {
  await user.click(await screen.findByRole('button', { name: /Artisan \/ commerçant|Salarié/i }));
  await user.click(await screen.findByRole('option', { name: optionName }));
}

export async function ajouterContrat(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Ajouter un contrat' }));
  await user.click(await screen.findByRole('button', { name: 'Fermer' }));
}

export async function creerTroisContrats(user: ReturnType<typeof userEvent.setup>) {
  await saisirDateNaissance(user);
  expect(await screen.findByRole('heading', { name: 'Contrat 1' })).toBeInTheDocument();

  await ajouterContrat(user);
  await ajouterContrat(user);

  await waitFor(() => {
    expect(screen.getAllByRole('heading', { name: /Contrat [123]/i })).toHaveLength(3);
  });
}

export async function ouvrirDecoupageArret(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('button', { name: /Modifier Contrat/i })[0]);
  expect(screen.queryByText('Cotisation annuelle')).toBeNull();
  expect(screen.getByLabelText('Franchise accident')).toHaveValue(0);
  expect(screen.getByLabelText('Franchise hospitalisation')).toHaveValue(0);
  expect(screen.getByLabelText('Franchise maladie')).toHaveValue(0);
  await user.click(screen.getByRole('button', { name: 'Cotisation' }));
  expect(screen.getByText('Cotisation annuelle')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Arrêt de travail' }));
  await user.click(screen.getAllByRole('button', { name: /Découper les périodes/i })[0]);
  expect(await screen.findByText('Découper l’arrêt de travail')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Ajouter une période/i })).toHaveClass(
    'sim-action-btn--add',
  );
  expect(
    screen.getByText('Utilisez le bouton supprimer pour retirer une période.'),
  ).toBeInTheDocument();
}
