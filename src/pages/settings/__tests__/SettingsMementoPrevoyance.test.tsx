// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PREVOYANCE_MAINTIEN_LEGAL_CODE } from '@/domain/prevoyance/constants';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';

import SettingsMemento from '../SettingsMemento';

const regime: PrevoyanceRegimeSettings = {
  code: 'salarie-cpam',
  label: 'Salarié secteur privé — CPAM',
  caisse: 'CPAM',
  population: 'salarie',
  defaultContractKind: 'collectif',
  year: 2026,
  data: {
    arret: {
      carences: { maladie: 3, accident: 0, hospitalisation: 0 },
      maxDurationDays: 1095,
      paliers: [
        {
          fromDay: 4,
          toDay: 1095,
          label: 'IJSS régime général',
          amount: { mode: 'formula', value: null, label: 'Formule régime' },
        },
      ],
    },
    invalidite: {
      paliers: [],
    },
    deces: {
      capital: { mode: 'formula', value: null, label: 'Capital décès forfaitaire' },
      doublementAccident: false,
      doubleEffet: false,
      renteConjoint: null,
      renteEducation: null,
    },
    cotisations: {
      mode: 'none',
      value: null,
      repartition: null,
    },
  },
  sources: {
    references: [],
  },
};

const maintien: PrevoyanceMaintienEmployeurSettings = {
  code: PREVOYANCE_MAINTIEN_LEGAL_CODE,
  label: 'Code du travail',
  year: 2026,
  data: {
    maintienEmployeur: {
      carenceDays: 7,
      minAncienneteYears: 1,
      paliers: [],
    },
  },
  sources: {
    references: [],
  },
};

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: () => ({
    role: 'admin',
    user: null,
    isAdmin: true,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/usePrevoyanceSettings', () => ({
  usePrevoyanceSettings: () => ({
    regimes: [regime],
    maintien: [maintien],
    loading: false,
    reload: vi.fn(),
  }),
}));

async function openCalculatorCard(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => {
    const candidate = screen
      .getAllByRole('button')
      .find(
        (item): item is HTMLButtonElement =>
          item instanceof HTMLButtonElement &&
          item.classList.contains('settings-memento-calculator-card__header') &&
          item.textContent?.includes(label) === true,
      );

    if (!candidate) throw new Error(`Carte paramètres introuvable : ${label}`);
    return candidate;
  });

  await user.click(button);
}

async function openAdminSection(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = await waitFor(() => {
    const candidate = screen
      .getAllByRole('button')
      .find(
        (item): item is HTMLButtonElement =>
          item instanceof HTMLButtonElement &&
          item.classList.contains('settings-memento-admin-section__header') &&
          item.textContent?.includes(label) === true,
      );

    if (!candidate) throw new Error(`Section admin introuvable : ${label}`);
    return candidate;
  });

  await user.click(button);
}

describe('SettingsMemento — prévoyance', () => {
  it('rend les régimes prévoyance depuis la vue paramètres calculateurs', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    expect(
      screen.queryByPlaceholderText('Rechercher un régime, une caisse ou un code'),
    ).not.toBeInTheDocument();

    await openAdminSection(user, 'Paramètres calculateurs');
    await openCalculatorCard(user, 'Prévoyance et régimes');

    expect(
      await screen.findByRole('heading', { name: /Prévoyance — régimes/i }, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Rechercher un régime, une caisse ou un code'),
    ).toBeInTheDocument();
  });
});
