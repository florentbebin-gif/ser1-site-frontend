import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import {
  createImpotsDraft,
  loadImpotsDraft,
  saveImpotsDraft,
  type ImpotsPsSettings,
  type ImpotsTaxSettings,
} from '../impotsSaveAdapter';

type SettingsTable = 'tax_settings' | 'ps_settings';

const fromMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const invalidateMock = vi.hoisted(() => vi.fn());
const broadcastInvalidationMock = vi.hoisted(() => vi.fn());
const upsertCalls: Array<{ table: SettingsTable; payload: unknown }> = [];

let taxSettingsData: typeof DEFAULT_TAX_SETTINGS = DEFAULT_TAX_SETTINGS;
let psSettingsData: typeof DEFAULT_PS_SETTINGS = DEFAULT_PS_SETTINGS;

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

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: fromMock,
    auth: {
      getUser: getUserMock,
    },
  },
}));

vi.mock('@/utils/cache/fiscalSettingsCache', () => ({
  invalidate: invalidateMock,
  broadcastInvalidation: broadcastInvalidationMock,
}));

describe('impotsSaveAdapter', () => {
  beforeEach(() => {
    taxSettingsData = {
      ...DEFAULT_TAX_SETTINGS,
      ifi: {
        current: {
          ...DEFAULT_TAX_SETTINGS.ifi.current,
          threshold: 1_600_000,
        },
      },
    };
    psSettingsData = {
      ...DEFAULT_PS_SETTINGS,
      patrimony: {
        ...DEFAULT_PS_SETTINGS.patrimony,
        current: {
          ...DEFAULT_PS_SETTINGS.patrimony.current,
          generalRate: 17,
        },
      },
    };
    upsertCalls.length = 0;
    fromMock.mockReset();
    getUserMock.mockReset();
    invalidateMock.mockReset();
    broadcastInvalidationMock.mockReset();
    fromMock.mockImplementation((table: SettingsTable) => makeSettingsBuilder(table));
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null });
  });

  it('charge tax_settings et ps_settings dans un draft Impôts', async () => {
    const draft = await loadImpotsDraft();

    expect(draft.taxSettings.ifi.current.threshold).toBe(1_600_000);
    expect(draft.psSettings.patrimony.current.generalRate).toBe(17);
  });

  it('sauvegarde uniquement tax_settings avec updated_by et invalidation fiscale', async () => {
    const draft = createImpotsDraft(
      {
        ...(taxSettingsData as ImpotsTaxSettings),
        cdhr: {
          ...taxSettingsData.cdhr,
          current: {
            ...taxSettingsData.cdhr.current,
            thresholdSingle: 310_000,
          },
        },
      },
      psSettingsData as ImpotsPsSettings,
    );

    const result = await saveImpotsDraft(draft, true);

    expect(result.ok).toBe(true);
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]).toEqual({
      table: 'tax_settings',
      payload: expect.objectContaining({
        id: 1,
        updated_by: 'admin-id',
        data: expect.objectContaining({
          cdhr: expect.objectContaining({
            current: expect.objectContaining({ thresholdSingle: 310_000 }),
          }),
          ifi: expect.objectContaining({
            current: expect.objectContaining({ threshold: 1_600_000 }),
          }),
        }),
      }),
    });
    expect(invalidateMock).toHaveBeenCalledWith('tax');
    expect(broadcastInvalidationMock).toHaveBeenCalledWith('tax');
  });
});
