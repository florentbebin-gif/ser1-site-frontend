// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRoleState } from '@/auth/useUserRole';
import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import SettingsComptablesSocietes from '../SettingsComptablesSocietes';
import SettingsImpots from '../SettingsImpots';

let isAdmin = true;
let taxSettingsData: typeof DEFAULT_TAX_SETTINGS = DEFAULT_TAX_SETTINGS;
let psSettingsData: typeof DEFAULT_PS_SETTINGS = DEFAULT_PS_SETTINGS;

const upsertCalls: Array<{ table: SettingsTable; payload: unknown }> = [];
const fromMock = vi.hoisted(() => vi.fn());
const invalidateMock = vi.hoisted(() => vi.fn());
const broadcastInvalidationMock = vi.hoisted(() => vi.fn());

type SettingsTable = 'tax_settings' | 'ps_settings';

function makeSettingsBuilder(table: SettingsTable) {
  const listResult = {
    data: [
      {
        data: table === 'tax_settings' ? taxSettingsData : psSettingsData,
      },
    ],
    error: null,
  };
  const singleResult = {
    data: {
      data: table === 'tax_settings' ? taxSettingsData : psSettingsData,
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

function getFieldInput(label: string, index = 0): HTMLInputElement {
  const fieldRow = screen.getAllByText(label)[index]?.closest('.settings-field-row');
  if (!(fieldRow instanceof HTMLElement)) {
    throw new Error(`Champ introuvable : ${label}`);
  }
  return within(fieldRow).getByRole('spinbutton') as HTMLInputElement;
}

function getSavedTaxPayload() {
  const call = upsertCalls.find((entry) => entry.table === 'tax_settings');
  if (!call) throw new Error('Aucune écriture tax_settings');
  return call.payload as { id: number; data: typeof DEFAULT_TAX_SETTINGS };
}

vi.mock('@/auth/useUserRole', () => ({
  useUserRole: (): UserRoleState => ({
    role: isAdmin ? 'admin' : 'user',
    user: null,
    isAdmin,
    isLoading: false,
  }),
}));

vi.mock('@/components/UserInfoBanner', () => ({
  UserInfoBanner: () => <div data-testid="user-info-banner" />,
}));

vi.mock('@/utils/cache/fiscalSettingsCache', () => ({
  invalidate: invalidateMock,
  broadcastInvalidation: broadcastInvalidationMock,
}));

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('SettingsImpots', () => {
  beforeEach(() => {
    isAdmin = true;
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
    invalidateMock.mockReset();
    broadcastInvalidationMock.mockReset();
    fromMock.mockReset();
    fromMock.mockImplementation((table: SettingsTable) => makeSettingsBuilder(table));
  });

  it('rend IFI/CDHR dans Impôts, sans section IS, et sauvegarde les deux blocs', async () => {
    const user = userEvent.setup();

    render(<SettingsImpots />);

    await screen.findByRole('button', { name: /Impôt sur la fortune immobilière/i });
    expect(
      screen.queryByRole('button', { name: /Impôt sur les sociétés/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Impôt sur la fortune immobilière/i }));
    const ifiThresholdInput = getFieldInput('Seuil d’entrée IFI');
    expect(ifiThresholdInput).toHaveValue(1_600_000);
    await user.clear(ifiThresholdInput);
    await user.type(ifiThresholdInput, '1700000');

    await user.click(screen.getByRole('button', { name: /CEHR \/ CDHR/i }));
    const cdhrSingleThresholdInput = getFieldInput('Seuil RFR – personne seule');
    expect(cdhrSingleThresholdInput).toHaveValue(280_000);
    await user.clear(cdhrSingleThresholdInput);
    await user.type(cdhrSingleThresholdInput, '310000');

    await user.click(screen.getByRole('button', { name: 'Enregistrer les paramètres impôts' }));

    await waitFor(() => {
      expect(upsertCalls).toHaveLength(1);
    });
    const saved = getSavedTaxPayload();
    expect(saved.data.ifi.current.threshold).toBe(1_700_000);
    expect(saved.data.cdhr.current.thresholdSingle).toBe(310_000);
    expect(screen.getByText('Paramètres impôts enregistrés.')).toBeInTheDocument();
  });

  it('expose le registre settings prêt, partiel et planifié en lecture seule', async () => {
    render(<SettingsImpots />);

    await screen.findByText('Registre settings');

    expect(screen.getByText('Prêt')).toBeInTheDocument();
    expect(screen.getByText('Planifié')).toBeInTheDocument();
    expect(screen.getByText('IFI - millésimes historiques')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /IFI - millésimes historiques/i })).toBeNull();
  });
});

describe('SettingsComptablesSocietes', () => {
  beforeEach(() => {
    isAdmin = true;
    taxSettingsData = DEFAULT_TAX_SETTINGS;
    psSettingsData = DEFAULT_PS_SETTINGS;
    upsertCalls.length = 0;
    invalidateMock.mockReset();
    broadcastInvalidationMock.mockReset();
    fromMock.mockReset();
    fromMock.mockImplementation((table: SettingsTable) => makeSettingsBuilder(table));
  });

  it('rend et sauvegarde l’IS dans Comptables & sociétés, sans bloc IFI', async () => {
    const user = userEvent.setup();

    render(<SettingsComptablesSocietes />);

    await screen.findByRole('button', { name: /Impôt sur les sociétés/i });
    expect(
      screen.queryByRole('button', { name: /Impôt sur la fortune immobilière/i }),
    ).not.toBeInTheDocument();

    const normalRateInput = getFieldInput('Taux normal IS');
    expect(normalRateInput).toHaveValue(DEFAULT_TAX_SETTINGS.corporateTax.current.normalRate);
    await user.clear(normalRateInput);
    await user.type(normalRateInput, '26');

    await user.click(
      screen.getByRole('button', { name: 'Enregistrer les paramètres comptables et sociétés' }),
    );

    await waitFor(() => {
      expect(upsertCalls).toHaveLength(1);
    });
    const saved = getSavedTaxPayload();
    expect(saved.data.corporateTax.current.normalRate).toBe(26);
    expect(saved.data.ifi).toEqual(DEFAULT_TAX_SETTINGS.ifi);
    expect(screen.getByText('Paramètres comptables et sociétés enregistrés.')).toBeInTheDocument();
  });

  it('expose les settings partiels et planifiés côté société en lecture seule', async () => {
    render(<SettingsComptablesSocietes />);

    await screen.findByText('Registre settings');

    expect(screen.getByText('Partiel')).toBeInTheDocument();
    expect(screen.getByText('Planifié')).toBeInTheDocument();
    expect(screen.getByText('Dividendes')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dividendes/i })).toBeNull();
  });
});
