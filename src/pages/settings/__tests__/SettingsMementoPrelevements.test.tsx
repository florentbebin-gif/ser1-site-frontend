// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRoleState } from '@/auth/useUserRole';
import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import SettingsMemento from '../SettingsMemento';

vi.setConfig({ testTimeout: 15_000 });

let isAdmin = false;
let psSettingsData: typeof DEFAULT_PS_SETTINGS = DEFAULT_PS_SETTINGS;
let taxSettingsData: typeof DEFAULT_TAX_SETTINGS = DEFAULT_TAX_SETTINGS;
let passRows = [
  { year: 2025, pass_amount: 47_100 },
  { year: 2026, pass_amount: 48_060 },
];

type SettingsTable = 'tax_settings' | 'ps_settings' | 'fiscality_settings' | 'pass_history';

const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const psUpsertCalls: unknown[] = [];
const passUpsertCalls: unknown[] = [];

function makeDataForTable(table: SettingsTable) {
  if (table === 'ps_settings') return psSettingsData;
  if (table === 'fiscality_settings') return DEFAULT_FISCALITY_SETTINGS;
  return taxSettingsData;
}

function makeSettingsBuilder(table: Exclude<SettingsTable, 'pass_history'>) {
  const listResult = {
    data: [{ data: makeDataForTable(table) }],
    error: null,
  };
  const singleResult = {
    data: { data: makeDataForTable(table) },
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
    if (table === 'ps_settings') psUpsertCalls.push(payload);
    return Promise.resolve(writeResult);
  });
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(listResult).then(onFulfilled, onRejected);

  return builder;
}

function makePassHistoryBuilder() {
  const listResult = { data: passRows, error: null };

  const builder = {} as {
    select: () => typeof builder;
    order: () => Promise<typeof listResult>;
    upsert: (
      payload: unknown,
      options: { onConflict: string },
    ) => Promise<{ data: null; error: null }>;
  };

  builder.select = vi.fn(() => builder);
  builder.order = vi.fn(() => Promise.resolve(listResult));
  builder.upsert = vi.fn((payload: unknown, options: { onConflict: string }) => {
    passUpsertCalls.push({ payload, options });
    return Promise.resolve({ data: null, error: null });
  });

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
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null }),
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

describe('SettingsMemento — Prélèvements sociaux éclaté', () => {
  beforeEach(() => {
    isAdmin = false;
    psSettingsData = {
      ...DEFAULT_PS_SETTINGS,
      patrimony: {
        ...DEFAULT_PS_SETTINGS.patrimony,
        current: {
          ...DEFAULT_PS_SETTINGS.patrimony.current,
          generalRate: 18.6,
        },
      },
      socialDirigeant: {
        ...DEFAULT_PS_SETTINGS.socialDirigeant,
        current: {
          ...DEFAULT_PS_SETTINGS.socialDirigeant.current,
          dividends: {
            ...DEFAULT_PS_SETTINGS.socialDirigeant.current.dividends,
            tnsSocialBasePct: 10,
          },
        },
      },
    };
    taxSettingsData = {
      ...DEFAULT_TAX_SETTINGS,
      incomeTax: {
        ...DEFAULT_TAX_SETTINGS.incomeTax,
        currentYearLabel: '2026 (revenus 2025)',
        previousYearLabel: '2025 (revenus 2024)',
      },
    };
    passRows = [
      { year: 2025, pass_amount: 47_100 },
      { year: 2026, pass_amount: 48_060 },
    ];
    psUpsertCalls.length = 0;
    passUpsertCalls.length = 0;
    fromMock.mockReset();
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
    fromMock.mockImplementation((table: SettingsTable) => {
      if (table === 'pass_history') return makePassHistoryBuilder();
      return makeSettingsBuilder(table);
    });
  });

  it('affiche les blocs aux bonnes entrées sans input pour un non-admin', async () => {
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Impôt sur les sociétés et placements');
    await openReadChapter(user, 'Placements');

    expect(
      await screen.findByText('Prélèvements sociaux sur patrimoine et capital'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Enregistrer les paramètres')).not.toBeInTheDocument();
    const patrimonyFrame = screen
      .getByText('Prélèvements sociaux sur patrimoine et capital')
      .closest('.settings-prelevements-entry-section');
    if (!(patrimonyFrame instanceof HTMLElement)) {
      throw new Error('Section prélèvements patrimoine introuvable');
    }
    expect(within(patrimonyFrame).getByText('18,6 %')).toBeInTheDocument();
    expect(patrimonyFrame?.querySelectorAll('input')).toHaveLength(0);

    await openReadPart(user, 'Social et protection sociale');
    await openReadChapter(user, 'Retraite');

    expect(await screen.findByText('Repères sociaux retraite')).toBeInTheDocument();
    expect(screen.getByText('Historique du PASS')).toBeInTheDocument();
    expect(screen.getByText('47 100 €')).toBeInTheDocument();
    expect(screen.getByText('Prélèvements sociaux sur pensions de retraite')).toBeInTheDocument();
    expect(screen.getByText('Seuils RFR pour CSG, CRDS et CASA')).toBeInTheDocument();
    const retirementFrame = screen
      .getByText('Repères sociaux retraite')
      .closest('.settings-prelevements-entry-section');
    expect(retirementFrame?.querySelectorAll('input')).toHaveLength(0);

    await openReadChapter(user, 'Dirigeant');

    expect(await screen.findByText('Seuil social des dividendes TNS')).toBeInTheDocument();
    expect(screen.getByText('Périmètres sociaux dirigeant à compléter')).toBeInTheDocument();
    expect(screen.getByText('Rémunération TNS - à compléter')).toBeInTheDocument();
    const socialScopeFrame = screen
      .getByText('Périmètres sociaux dirigeant à compléter')
      .closest('.settings-prelevements-entry-section');
    if (!(socialScopeFrame instanceof HTMLElement)) {
      throw new Error('Section périmètres sociaux dirigeant introuvable');
    }
    expect(within(socialScopeFrame).getByText('Périmètre social à compléter')).toBeInTheDocument();
    expect(within(socialScopeFrame).queryByText('Partiel')).not.toBeInTheDocument();
    const dirigeantFrames = Array.from(
      new Set(
        screen
          .getAllByText(/Seuil social des dividendes TNS|Périmètres sociaux dirigeant à compléter/)
          .map((title) => title.closest('.settings-prelevements-entry-section')),
      ),
    );
    expect(dirigeantFrames).toHaveLength(2);
    for (const frame of dirigeantFrames) {
      expect(frame?.querySelectorAll('input')).toHaveLength(0);
    }
  });

  it('sauvegarde PASS et ps_settings via le bouton global après fermeture du chapitre', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Social et protection sociale');
    await openReadChapter(user, 'Retraite');

    const passInput = await screen.findByLabelText('PASS 2025');
    await user.clear(passInput);
    await user.type(passInput, '47200');

    const globalSaveButton = await screen.findByRole('button', {
      name: 'Enregistrer les modifications',
    });
    await waitFor(() => {
      expect(globalSaveButton).toBeEnabled();
    });

    await openReadChapter(user, 'Retraite');
    await user.click(globalSaveButton);

    await waitFor(() => {
      expect(psUpsertCalls).toHaveLength(1);
      expect(passUpsertCalls).toHaveLength(1);
    });
    expect(passUpsertCalls[0]).toEqual({
      payload: [
        { year: 2025, pass_amount: 47_200 },
        { year: 2026, pass_amount: 48_060 },
      ],
      options: { onConflict: 'year' },
    });
    expect(screen.getByText('Prélèvements sociaux enregistré.')).toBeInTheDocument();
  });

  it('désactive le bouton global quand le seuil social dirigeant est invalide', async () => {
    isAdmin = true;
    const user = userEvent.setup();
    render(<SettingsMemento />);

    await openReadPart(user, 'Social et protection sociale');
    await openReadChapter(user, 'Dirigeant');

    const section = await screen.findByText('Seuil social des dividendes TNS');
    const frame = section.closest('.settings-prelevements-entry-section');
    if (!(frame instanceof HTMLElement)) throw new Error('Section dirigeant introuvable');

    const input = within(frame).getByLabelText('Seuil dividendes TNS soumis aux charges sociales');
    await user.clear(input);
    await user.type(input, '101');

    await waitFor(() => {
      const globalSaveButton = screen.getByRole('button', {
        name: 'Enregistrer les modifications',
      });
      expect(globalSaveButton).toBeDisabled();
      expect(globalSaveButton).toHaveAttribute(
        'title',
        expect.stringContaining('Corrigez les erreurs de prélèvements sociaux'),
      );
    });
    expect(psUpsertCalls).toHaveLength(0);
  });
});
