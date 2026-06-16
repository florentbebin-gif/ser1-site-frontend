// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRoleState } from '@/auth/useUserRole';
import {
  DEFAULT_PASS_HISTORY,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import SettingsMemento from '../SettingsMemento';

let isAdmin = false;
let taxSettingsData: typeof DEFAULT_TAX_SETTINGS = DEFAULT_TAX_SETTINGS;
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const upsertCalls: unknown[] = [];

type SettingsTable = 'tax_settings' | 'ps_settings' | 'pass_history';

function makeSettingsBuilder(table: SettingsTable) {
  if (table === 'pass_history') {
    const passResult = {
      data: Object.entries(DEFAULT_PASS_HISTORY).map(([year, pass_amount]) => ({
        year: Number(year),
        pass_amount,
      })),
      error: null,
    };
    const passBuilder = {} as {
      select: () => typeof passBuilder;
      order: () => Promise<typeof passResult>;
    };

    passBuilder.select = vi.fn(() => passBuilder);
    passBuilder.order = vi.fn(() => Promise.resolve(passResult));
    return passBuilder;
  }

  const listResult = {
    data: [{ data: table === 'ps_settings' ? DEFAULT_PS_SETTINGS : taxSettingsData }],
    error: null,
  };
  const singleResult = {
    data: { data: table === 'ps_settings' ? DEFAULT_PS_SETTINGS : taxSettingsData },
    error: null,
  };
  const writeResult = { data: null, error: null };

  const builder = {} as {
    select: () => typeof builder;
    eq: () => typeof builder;
    maybeSingle: () => Promise<typeof singleResult>;
    upsert: (payload: unknown) => Promise<typeof writeResult>;
    then: PromiseLike<typeof listResult>['then'];
  };

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => Promise.resolve(singleResult));
  builder.upsert = vi.fn((payload: unknown) => {
    upsertCalls.push(payload);
    return Promise.resolve(writeResult);
  });
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(listResult).then(onFulfilled, onRejected);

  return builder;
}

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: (): UserRoleState => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    auth: {
      getUser: getUserMock,
    },
  },
}));

vi.mock('@/utils/cache/fiscalSettingsCache', () => ({
  invalidate: vi.fn(),
  broadcastInvalidation: vi.fn(),
}));

function findButtonByClass(className: string, label: string): HTMLButtonElement {
  const button = screen
    .getAllByRole('button')
    .find(
      (candidate): candidate is HTMLButtonElement =>
        candidate instanceof HTMLButtonElement &&
        candidate.classList.contains(className) &&
        candidate.textContent?.includes(label) === true,
    );

  if (!button) throw new Error(`Bouton introuvable : ${label}`);
  return button;
}

async function openReadPart(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = findButtonByClass('settings-memento-part__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

async function openReadChapter(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = findButtonByClass('settings-memento-read-chapter__header', label);
  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button);
  }
}

describe('SettingsMemento — Comptables et sociétés éclaté', () => {
  beforeEach(() => {
    isAdmin = false;
    taxSettingsData = DEFAULT_TAX_SETTINGS;
    fromMock.mockReset();
    getUserMock.mockReset();
    rpcMock.mockReset();
    upsertCalls.length = 0;
    fromMock.mockImplementation((table: SettingsTable) => makeSettingsBuilder(table));
    rpcMock.mockResolvedValue({ data: null, error: null });
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null });
  });

  it('affiche les blocs comptables sous les entrées métier sans input pour un non-admin', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Impôt sur les sociétés et placements');
    await openReadChapter(user, 'Société');

    expect(await screen.findByText('Taux IS')).toBeInTheDocument();
    expect(screen.getByText('Quote-part mère-fille')).toBeInTheDocument();
    expect(screen.getByText('Déductibilité des intérêts CCA')).toBeInTheDocument();
    expect(screen.getAllByText('25 %').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('input:not([type="search"])')).toHaveLength(0);
    expect(screen.queryByText('Comptables et sociétés')).not.toBeInTheDocument();

    await openReadPart(user, 'Social et protection sociale');
    await openReadChapter(user, 'Dirigeant');

    expect((await screen.findAllByText('Abattement dividendes au barème')).length).toBeGreaterThan(
      0,
    );
    expect(container.querySelectorAll('input:not([type="search"])')).toHaveLength(0);
  });

  it('sauvegarde un champ IS via le bouton global après fermeture du chapitre', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Impôt sur les sociétés et placements');
    await openReadChapter(user, 'Société');

    const normalRateInput = (await screen.findAllByLabelText('Taux normal IS'))[0];
    expect(normalRateInput).toBeEnabled();
    await user.clear(normalRateInput);
    await user.type(normalRateInput, '26');

    const globalSaveButton = await screen.findByRole('button', {
      name: 'Enregistrer les modifications',
    });
    await waitFor(() => {
      expect(globalSaveButton).toBeEnabled();
    });

    await openReadChapter(user, 'Société');
    await user.click(globalSaveButton);

    await waitFor(() => {
      expect(upsertCalls).toHaveLength(1);
    });
    expect(upsertCalls[0]).toEqual(
      expect.objectContaining({
        id: 1,
        updated_by: 'admin-id',
        data: expect.objectContaining({
          corporateTax: expect.objectContaining({
            current: expect.objectContaining({ normalRate: 26 }),
          }),
        }),
      }),
    );
    expect(
      screen.queryByRole('button', { name: 'Enregistrer les paramètres comptables et sociétés' }),
    ).not.toBeInTheDocument();
  });
});
