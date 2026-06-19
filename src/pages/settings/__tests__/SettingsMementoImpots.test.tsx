// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRoleState } from '@/auth/useUserRole';
import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import SettingsMemento from '../SettingsMemento';

let isAdmin = false;
let taxSettingsData: typeof DEFAULT_TAX_SETTINGS = DEFAULT_TAX_SETTINGS;
let psSettingsData: typeof DEFAULT_PS_SETTINGS = DEFAULT_PS_SETTINGS;

type SettingsTable = 'tax_settings' | 'ps_settings' | 'fiscality_settings';

const fromMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const upsertCalls: Array<{ table: SettingsTable; payload: unknown }> = [];

function makeSettingsBuilder(table: SettingsTable) {
  const listResult = {
    data: [
      {
        data: table === 'ps_settings' ? psSettingsData : taxSettingsData,
      },
    ],
    error: null,
  };
  const singleResult = {
    data: {
      data: table === 'ps_settings' ? psSettingsData : taxSettingsData,
    },
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
    upsertCalls.push({ table, payload });
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

async function selectMementoTab(
  user: ReturnType<typeof userEvent.setup>,
  tablistName: RegExp | string,
  tabName: RegExp | string,
) {
  const tablist = await screen.findByRole('tablist', { name: tablistName });
  const tab = await within(tablist).findByRole('tab', { name: tabName });
  await user.click(tab);
}

function getNumberInput(label: string): HTMLInputElement {
  const fieldRow = screen.getAllByText(label)[0]?.closest('.settings-field-row');
  if (!(fieldRow instanceof HTMLElement)) {
    throw new Error(`Champ introuvable : ${label}`);
  }
  return within(fieldRow).getByRole('spinbutton') as HTMLInputElement;
}

describe('SettingsMemento — Impôts éclaté', () => {
  beforeEach(() => {
    isAdmin = false;
    taxSettingsData = {
      ...DEFAULT_TAX_SETTINGS,
      ifi: {
        current: {
          ...DEFAULT_TAX_SETTINGS.ifi.current,
          threshold: 1_600_000,
        },
      },
      cdhr: {
        ...DEFAULT_TAX_SETTINGS.cdhr,
        current: {
          ...DEFAULT_TAX_SETTINGS.cdhr.current,
          thresholdSingle: 280_000,
        },
      },
    };
    psSettingsData = DEFAULT_PS_SETTINGS;
    upsertCalls.length = 0;
    fromMock.mockReset();
    getUserMock.mockReset();
    fromMock.mockImplementation((table: SettingsTable) => makeSettingsBuilder(table));
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null });
  });

  it('affiche les blocs IR et IFI sans input ni panneau monolithique pour un non-admin', async () => {
    const user = userEvent.setup();
    const { container } = render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');
    await selectMementoTab(
      user,
      /Sections du chapitre Fiscalité foyer/i,
      'Paramètres de référence',
    );

    expect(await screen.findByText('Barème de l’impôt sur le revenu')).toBeInTheDocument();
    expect(screen.getByText('Abattement DOM sur l’IR')).toBeInTheDocument();
    expect(screen.getByText('Prélèvement forfaitaire unique')).toBeInTheDocument();
    expect(screen.getByText('CEHR / CDHR')).toBeInTheDocument();
    expect(screen.getAllByText('Impôt sur la fortune immobilière').length).toBeGreaterThan(0);
    expect(screen.getByText('1 600 000 €')).toBeInTheDocument();
    expect(container.querySelectorAll('input:not([type="search"])')).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'Enregistrer les paramètres impôts' }),
    ).not.toBeInTheDocument();
  });

  // Flux lourd (chapitre lazy sous Suspense, ~13 frappes utilisateur, sauvegarde globale) :
  // timeout élargi pour rester stable sous la charge CI parallèle, sans masquer de blocage réel.
  it('sauvegarde IFI/CDHR via le bouton global après fermeture du chapitre', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Fiscalité');
    await openReadChapter(user, 'Fiscalité foyer');
    await selectMementoTab(
      user,
      /Sections du chapitre Fiscalité foyer/i,
      'Paramètres de référence',
    );

    const ifiThresholdInput = await screen.findByLabelText('Seuil d’entrée IFI');
    await user.clear(ifiThresholdInput);
    await user.type(ifiThresholdInput, '1700000');

    const cdhrSingleThresholdInput = getNumberInput('Seuil RFR – personne seule');
    await user.clear(cdhrSingleThresholdInput);
    await user.type(cdhrSingleThresholdInput, '310000');

    const globalSaveButton = await screen.findByRole('button', {
      name: 'Enregistrer les modifications',
    });
    await waitFor(() => {
      expect(globalSaveButton).toBeEnabled();
    });

    await openReadChapter(user, 'Fiscalité foyer');
    await user.click(globalSaveButton);

    await waitFor(() => {
      expect(upsertCalls).toHaveLength(1);
    });
    expect(upsertCalls[0]).toEqual({
      table: 'tax_settings',
      payload: expect.objectContaining({
        id: 1,
        updated_by: 'admin-id',
        data: expect.objectContaining({
          ifi: expect.objectContaining({
            current: expect.objectContaining({ threshold: 1_700_000 }),
          }),
          cdhr: expect.objectContaining({
            current: expect.objectContaining({ thresholdSingle: 310_000 }),
          }),
        }),
      }),
    });
  }, 15_000);
});
