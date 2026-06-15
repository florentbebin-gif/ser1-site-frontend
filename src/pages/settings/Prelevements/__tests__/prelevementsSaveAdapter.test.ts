import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import {
  createPrelevementsDraft,
  loadPrelevementsDraft,
  savePrelevementsDraft,
  type PrelevementsPsSettings,
  type PrelevementsTaxSettings,
} from '../prelevementsSaveAdapter';

type SettingsTable = 'ps_settings' | 'tax_settings' | 'pass_history';

const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const invalidateMock = vi.hoisted(() => vi.fn());
const broadcastInvalidationMock = vi.hoisted(() => vi.fn());
const psUpsertCalls: unknown[] = [];
const passUpsertCalls: unknown[] = [];

let psSettingsData: typeof DEFAULT_PS_SETTINGS = DEFAULT_PS_SETTINGS;
let taxSettingsData: typeof DEFAULT_TAX_SETTINGS = DEFAULT_TAX_SETTINGS;
let passRows = [
  { year: 2025, pass_amount: 47_100 },
  { year: 2026, pass_amount: 48_060 },
];
let passSaveError: { message: string } | null = null;

function makeSettingsBuilder(table: Exclude<SettingsTable, 'pass_history'>) {
  const listResult = {
    data: [
      {
        data: table === 'ps_settings' ? psSettingsData : taxSettingsData,
      },
    ],
    error: null,
  };
  const writeResult = { data: null, error: null };

  const builder = {} as {
    select: () => typeof builder;
    eq: () => typeof builder;
    upsert: (payload: unknown) => Promise<typeof writeResult>;
    then: PromiseLike<typeof listResult>['then'];
  };

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.upsert = vi.fn((payload: unknown) => {
    psUpsertCalls.push(payload);
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
    ) => Promise<{ data: null; error: { message: string } | null }>;
  };

  builder.select = vi.fn(() => builder);
  builder.order = vi.fn(() => Promise.resolve(listResult));
  builder.upsert = vi.fn((payload: unknown, options: { onConflict: string }) => {
    passUpsertCalls.push({ payload, options });
    return Promise.resolve({ data: null, error: passSaveError });
  });

  return builder;
}

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

vi.mock('@/utils/cache/fiscalSettingsCache', () => ({
  invalidate: invalidateMock,
  broadcastInvalidation: broadcastInvalidationMock,
}));

describe('prelevementsSaveAdapter', () => {
  beforeEach(() => {
    psSettingsData = {
      ...DEFAULT_PS_SETTINGS,
      patrimony: {
        ...DEFAULT_PS_SETTINGS.patrimony,
        current: {
          ...DEFAULT_PS_SETTINGS.patrimony.current,
          generalRate: 18.6,
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
    passSaveError = null;
    psUpsertCalls.length = 0;
    passUpsertCalls.length = 0;
    fromMock.mockReset();
    rpcMock.mockReset();
    invalidateMock.mockReset();
    broadcastInvalidationMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
    fromMock.mockImplementation((table: SettingsTable) => {
      if (table === 'pass_history') return makePassHistoryBuilder();
      return makeSettingsBuilder(table);
    });
  });

  it('charge ps_settings, tax_settings et pass_history en réservant la maintenance PASS aux admins', async () => {
    const draft = await loadPrelevementsDraft(true);

    expect(rpcMock).toHaveBeenCalledWith('ensure_pass_history_current');
    expect(draft.settings.patrimony.current.generalRate).toBe(18.6);
    expect(draft.taxSettings.incomeTax.currentYearLabel).toBe('2026 (revenus 2025)');
    expect(draft.passRows).toEqual(passRows);
  });

  it('sauvegarde ps_settings puis pass_history et invalide les caches sociaux', async () => {
    const settings = {
      ...(psSettingsData as PrelevementsPsSettings),
      socialDirigeant: {
        ...psSettingsData.socialDirigeant,
        current: {
          ...psSettingsData.socialDirigeant.current,
          dividends: {
            ...psSettingsData.socialDirigeant.current.dividends,
            tnsSocialBasePct: 12,
          },
        },
      },
    };
    const draft = createPrelevementsDraft(settings, taxSettingsData as PrelevementsTaxSettings, [
      { year: 2026, pass_amount: 49_000 },
    ]);

    const result = await savePrelevementsDraft(draft, true);

    expect(result).toEqual({
      ok: true,
      message: 'Paramètres de prélèvements sociaux enregistrés.',
    });
    expect(psUpsertCalls).toEqual([
      expect.objectContaining({
        id: 1,
        data: expect.objectContaining({
          socialDirigeant: expect.objectContaining({
            current: expect.objectContaining({
              dividends: expect.objectContaining({ tnsSocialBasePct: 12 }),
            }),
          }),
        }),
      }),
    ]);
    expect(passUpsertCalls).toEqual([
      {
        payload: [{ year: 2026, pass_amount: 49_000 }],
        options: { onConflict: 'year' },
      },
    ]);
    expect(invalidateMock).toHaveBeenCalledWith('ps');
    expect(invalidateMock).toHaveBeenCalledWith('pass');
    expect(broadcastInvalidationMock).toHaveBeenCalledWith('ps');
    expect(broadcastInvalidationMock).toHaveBeenCalledWith('pass');
  });

  it('bloque un seuil dirigeant invalide avant tout upsert', async () => {
    const draft = createPrelevementsDraft(
      {
        ...(psSettingsData as PrelevementsPsSettings),
        socialDirigeant: {
          ...psSettingsData.socialDirigeant,
          current: {
            ...psSettingsData.socialDirigeant.current,
            dividends: {
              ...psSettingsData.socialDirigeant.current.dividends,
              tnsSocialBasePct: 101,
            },
          },
        },
      },
      taxSettingsData as PrelevementsTaxSettings,
      passRows,
    );

    const result = await savePrelevementsDraft(draft, true);

    expect(result).toEqual({
      ok: false,
      message: 'Corrigez les erreurs de prélèvements sociaux avant de sauvegarder.',
    });
    expect(psUpsertCalls).toHaveLength(0);
    expect(passUpsertCalls).toHaveLength(0);
  });

  it("remonte l'erreur PASS sans message de succès", async () => {
    passSaveError = { message: 'PASS refusé' };
    const draft = createPrelevementsDraft(
      psSettingsData as PrelevementsPsSettings,
      taxSettingsData as PrelevementsTaxSettings,
      passRows,
    );

    const result = await savePrelevementsDraft(draft, true);

    expect(result).toEqual({
      ok: false,
      message: "Erreur lors de l'enregistrement du PASS.",
    });
    expect(psUpsertCalls).toHaveLength(1);
    expect(passUpsertCalls).toHaveLength(1);
  });
});
