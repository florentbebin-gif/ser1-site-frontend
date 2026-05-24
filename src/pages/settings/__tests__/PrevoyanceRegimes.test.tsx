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
import PrevoyanceRegimes from '../PrevoyanceRegimes';

let isAdmin = false;
const reloadMock = vi.fn();

const baseData: PrevoyanceRegimeSettings['data'] = {
  arret: {
    carences: { maladie: 3, accident: 0, hospitalisation: 0 },
    maxDurationDays: 1095,
    paliers: [
      {
        fromDay: 4,
        toDay: 1095,
        label: 'IJSS régime général',
        amount: { mode: 'formula', value: null, label: '50 % du salaire journalier moyen' },
      },
    ],
  },
  invalidite: {
    paliers: [
      {
        fromRate: 33,
        toRate: 65,
        label: 'Catégorie 1',
        amount: { mode: 'fixed_eur_year', value: 4059.72, label: '4 059,72 € min' },
      },
      {
        fromRate: 66,
        toRate: null,
        label: 'Catégorie 2',
        amount: { mode: 'fixed_eur_year', value: 24030, label: '24 030 € max' },
      },
    ],
  },
  deces: {
    capital: { mode: 'formula', value: null, label: 'Capital décès forfaitaire' },
    doublementAccident: false,
    doubleEffet: false,
    renteConjoint: null,
    renteEducation: null,
  },
  cotisations: {
    mode: 'percent_salary',
    value: 7,
    assiette: 'TA',
    repartition: { employeur: 60, salarie: 40 },
  },
};

const sources: PrevoyanceRegimeSettings['sources'] = {
  references: [
    {
      organisme: 'Ameli',
      titre: 'Invalidité et capital décès',
      url: 'https://www.ameli.fr/',
      dateConsultation: '2026-05-24',
      valeursCouvertes: ['invalidité', 'décès'],
      confiance: 'haute',
    },
  ],
  noteAdmin: 'Note interne invisible aux users.',
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

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
}));

vi.mock('@/components/UserInfoBanner', () => ({
  UserInfoBanner: () => <div data-testid="user-info-banner" />,
}));

vi.mock('@/hooks/usePrevoyanceSettings', () => ({
  usePrevoyanceSettings: () => ({
    regimes,
    maintien,
    loading: false,
    reload: reloadMock,
  }),
}));

describe('PrevoyanceRegimes', () => {
  beforeEach(() => {
    isAdmin = false;
    reloadMock.mockReset();
  });

  async function renderPage() {
    render(<PrevoyanceRegimes />);
    await screen.findByText('Prévoyance — régimes');
  }

  it('affiche la page aux users en lecture seule avec les références consultables', async () => {
    await renderPage();

    expect(screen.getByTestId('user-info-banner')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Salarié secteur privé — CPAM/i })).toHaveAttribute(
        'aria-expanded',
        'true',
      ),
    );
    expect(screen.getByRole('link', { name: 'Ameli' })).toHaveAttribute(
      'href',
      'https://www.ameli.fr/',
    );
    expect(
      screen.getByText(
        (_, element) => element?.textContent === 'Valeurs couvertes : invalidité, décès',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Cotisations')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Maintien employeur' })).not.toBeInTheDocument();
    expect(screen.queryByText('Note interne invisible aux users.')).not.toBeInTheDocument();
  });

  it('affiche les actions secondaires aux admins', async () => {
    isAdmin = true;

    await renderPage();

    expect(screen.getByRole('button', { name: 'Maintien employeur' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument(),
    );
  });

  it('ouvre et ferme les régimes avec aria-expanded', async () => {
    const user = userEvent.setup();
    await renderPage();

    const cpam = screen.getByRole('button', { name: /Salarié secteur privé — CPAM/i });
    await waitFor(() => expect(cpam).toHaveAttribute('aria-expanded', 'true'));

    await user.click(cpam);
    expect(cpam).toHaveAttribute('aria-expanded', 'false');

    const ssi = screen.getByRole('button', { name: /Artisan \/ commerçant — SSI/i });
    await user.click(ssi);
    expect(ssi).toHaveAttribute('aria-expanded', 'true');
  });

  it('filtre par libellé, caisse et code', async () => {
    const user = userEvent.setup();
    await renderPage();

    const search = screen.getByPlaceholderText('Rechercher un régime, une caisse ou un code');
    await user.type(search, 'MSA salariés');
    expect(screen.getByRole('button', { name: /Salarié agricole — MSA/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Salarié secteur privé — CPAM/i }),
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'ssi-artisan');
    expect(
      screen.getByRole('button', { name: /Artisan \/ commerçant — SSI/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Salarié agricole — MSA/i }),
    ).not.toBeInTheDocument();
  });
});
