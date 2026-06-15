import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import {
  createComptablesSocietesDraft,
  loadComptablesSocietesDraft,
  saveComptablesSocietesDraft,
} from '../comptablesSocietesSaveAdapter';

const fromMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const invalidateMock = vi.hoisted(() => vi.fn());
const broadcastInvalidationMock = vi.hoisted(() => vi.fn());

let taxSettingsData: typeof DEFAULT_TAX_SETTINGS = DEFAULT_TAX_SETTINGS;
const upsertCalls: unknown[] = [];

function makeTaxSettingsBuilder() {
  const listResult = {
    data: [{ data: taxSettingsData }],
    error: null,
  };
  const singleResult = {
    data: { data: taxSettingsData },
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

describe('comptablesSocietesSaveAdapter', () => {
  beforeEach(() => {
    taxSettingsData = {
      ...DEFAULT_TAX_SETTINGS,
      corporateTax: {
        ...DEFAULT_TAX_SETTINGS.corporateTax,
        current: {
          ...DEFAULT_TAX_SETTINGS.corporateTax.current,
          normalRate: 26,
        },
      },
    };
    upsertCalls.length = 0;
    fromMock.mockReset();
    getUserMock.mockReset();
    invalidateMock.mockReset();
    broadcastInvalidationMock.mockReset();
    fromMock.mockImplementation(() => makeTaxSettingsBuilder());
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null });
  });

  it('charge tax_settings en fusionnant les paramètres corporateTax', async () => {
    const draft = await loadComptablesSocietesDraft();

    expect(draft.settings.corporateTax.current.normalRate).toBe(26);
    expect(draft.settings.corporateTax.previous.reducedThreshold).toBe(
      DEFAULT_TAX_SETTINGS.corporateTax.previous.reducedThreshold,
    );
  });

  it('sauvegarde corporateTax avec updated_by et invalide le cache fiscal', async () => {
    const draft = createComptablesSocietesDraft({
      ...DEFAULT_TAX_SETTINGS,
      corporateTax: {
        ...DEFAULT_TAX_SETTINGS.corporateTax,
        current: {
          ...DEFAULT_TAX_SETTINGS.corporateTax.current,
          normalRate: 26,
        },
      },
    });

    const result = await saveComptablesSocietesDraft(draft, true);

    expect(result).toEqual({
      ok: true,
      message: 'Paramètres comptables et sociétés enregistrés.',
    });
    expect(upsertCalls).toHaveLength(1);
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
    expect(invalidateMock).toHaveBeenCalledWith('tax');
    expect(broadcastInvalidationMock).toHaveBeenCalledWith('tax');
  });

  it('bloque un QPFC invalide avant tout upsert', async () => {
    const draft = createComptablesSocietesDraft({
      ...DEFAULT_TAX_SETTINGS,
      corporateTax: {
        ...DEFAULT_TAX_SETTINGS.corporateTax,
        current: {
          ...DEFAULT_TAX_SETTINGS.corporateTax.current,
          motherDaughterQpfc: { standard: 0, group: 5 },
        },
      },
    });

    const result = await saveComptablesSocietesDraft(draft, true);

    expect(result).toEqual({
      ok: false,
      message: 'Corrigez les erreurs comptables et sociétés avant de sauvegarder.',
    });
    expect(upsertCalls).toHaveLength(0);
  });
});
