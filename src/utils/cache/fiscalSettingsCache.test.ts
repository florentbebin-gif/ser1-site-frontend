import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.hoisted(() => vi.fn());

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: fromMock,
  },
}));

type MaybeSingleResult = {
  data: { data: unknown; updated_at: string | null } | null;
  error: unknown;
};

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    clear: vi.fn(() => values.clear()),
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function mockFiscalTables(
  taxResult: Promise<MaybeSingleResult> | MaybeSingleResult,
  psResult: Promise<MaybeSingleResult> | MaybeSingleResult,
  fiscalityResult: Promise<MaybeSingleResult> | MaybeSingleResult,
  passResult:
    | Promise<{ data: Array<{ year: number; pass_amount: number }>; error: unknown }>
    | { data: Array<{ year: number; pass_amount: number }>; error: unknown },
) {
  fromMock.mockImplementation((table: string) => {
    if (table === 'pass_history') {
      return {
        select: () => ({
          order: () => passResult,
        }),
      };
    }

    const resultByTable: Record<string, Promise<MaybeSingleResult> | MaybeSingleResult> = {
      tax_settings: taxResult,
      ps_settings: psResult,
      fiscality_settings: fiscalityResult,
    };

    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () => resultByTable[table],
        }),
      }),
    };
  });
}

describe('fiscalSettingsCache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    fromMock.mockReset();
    Object.defineProperty(globalThis, 'localStorage', {
      value: createStorage(),
      configurable: true,
    });
  });

  it('retourne les valeurs par défaut immédiatement en mode stale', async () => {
    const cache = await import('./fiscalSettingsCache');
    mockFiscalTables(
      { data: { data: cache.DEFAULT_TAX_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_PS_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_FISCALITY_SETTINGS, updated_at: null }, error: null },
      { data: [], error: null },
    );

    const result = await cache.getFiscalSettings();

    expect(result.tax).toBe(cache.DEFAULT_TAX_SETTINGS);
    expect(result.ps).toBe(cache.DEFAULT_PS_SETTINGS);
    expect(result.fiscality).toBe(cache.DEFAULT_FISCALITY_SETTINGS);
    expect(result.passHistory).toBe(cache.DEFAULT_PASS_HISTORY);
    expect(fromMock).toHaveBeenCalledWith('tax_settings');
    expect(fromMock).toHaveBeenCalledWith('ps_settings');
    expect(fromMock).toHaveBeenCalledWith('fiscality_settings');
    expect(fromMock).toHaveBeenCalledWith('pass_history');
  });

  it('alimente le cache en arrière-plan sans faire attendre le premier appel stale', async () => {
    const cache = await import('./fiscalSettingsCache');
    const tax = createDeferred<MaybeSingleResult>();
    const ps = createDeferred<MaybeSingleResult>();
    const fiscality = createDeferred<MaybeSingleResult>();
    const pass = createDeferred<{
      data: Array<{ year: number; pass_amount: number }>;
      error: null;
    }>();
    const supabaseTax = {
      ...cache.DEFAULT_TAX_SETTINGS,
      incomeTax: {
        ...cache.DEFAULT_TAX_SETTINGS.incomeTax,
        currentYearLabel: 'IR Supabase arrière-plan',
      },
    };
    mockFiscalTables(tax.promise, ps.promise, fiscality.promise, pass.promise);

    const first = await cache.getFiscalSettings();

    expect(first.tax).toBe(cache.DEFAULT_TAX_SETTINGS);
    expect(first.ps).toBe(cache.DEFAULT_PS_SETTINGS);
    expect(first.fiscality).toBe(cache.DEFAULT_FISCALITY_SETTINGS);
    expect(first.passHistory).toBe(cache.DEFAULT_PASS_HISTORY);

    tax.resolve({
      data: { data: supabaseTax, updated_at: '2026-05-18T00:00:00.000Z' },
      error: null,
    });
    ps.resolve({ data: { data: cache.DEFAULT_PS_SETTINGS, updated_at: null }, error: null });
    fiscality.resolve({
      data: { data: cache.DEFAULT_FISCALITY_SETTINGS, updated_at: null },
      error: null,
    });
    pass.resolve({ data: [{ year: 2026, pass_amount: 48123 }], error: null });

    await vi.waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledTimes(4);
    });

    const second = await cache.getFiscalSettings();

    expect(second.tax.incomeTax.currentYearLabel).toBe('IR Supabase arrière-plan');
    expect(second.passHistory).toEqual({ 2026: 48123 });
    expect(second.meta.taxUpdatedAt).toBe('2026-05-18T00:00:00.000Z');
  });

  it('hydrate un cache localStorage valide', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T12:00:00.000Z'));
    const cache = await import('./fiscalSettingsCache');
    const tax = {
      ...cache.DEFAULT_TAX_SETTINGS,
      incomeTax: {
        ...cache.DEFAULT_TAX_SETTINGS.incomeTax,
        currentYearLabel: 'IR test cache',
      },
    };
    localStorage.setItem(
      'ser1:fiscalSettingsCache:v2-ps-2026',
      JSON.stringify({
        tax,
        ps: cache.DEFAULT_PS_SETTINGS,
        fiscality: cache.DEFAULT_FISCALITY_SETTINGS,
        passHistory: { 2026: 48123 },
        timestamp: Date.now(),
        meta: {
          taxUpdatedAt: '2026-05-18T00:00:00.000Z',
          psUpdatedAt: null,
          fiscalityUpdatedAt: null,
        },
      }),
    );
    mockFiscalTables(
      { data: { data: cache.DEFAULT_TAX_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_PS_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_FISCALITY_SETTINGS, updated_at: null }, error: null },
      { data: [], error: null },
    );

    const result = await cache.getFiscalSettings();

    expect(result.tax.incomeTax.currentYearLabel).toBe('IR test cache');
    expect(result.passHistory).toEqual({ 2026: 48123 });
    expect(result.meta.taxUpdatedAt).toBe('2026-05-18T00:00:00.000Z');
  });

  it('ignore un cache localStorage expiré', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T12:00:00.000Z'));
    const cache = await import('./fiscalSettingsCache');
    localStorage.setItem(
      'ser1:fiscalSettingsCache:v2-ps-2026',
      JSON.stringify({
        tax: {
          ...cache.DEFAULT_TAX_SETTINGS,
          incomeTax: {
            ...cache.DEFAULT_TAX_SETTINGS.incomeTax,
            currentYearLabel: 'IR expiré',
          },
        },
        ps: cache.DEFAULT_PS_SETTINGS,
        fiscality: cache.DEFAULT_FISCALITY_SETTINGS,
        passHistory: null,
        timestamp: Date.now() - 24 * 60 * 60 * 1000 - 1,
        meta: { taxUpdatedAt: null, psUpdatedAt: null, fiscalityUpdatedAt: null },
      }),
    );
    mockFiscalTables(
      { data: { data: cache.DEFAULT_TAX_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_PS_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_FISCALITY_SETTINGS, updated_at: null }, error: null },
      { data: [], error: null },
    );

    const result = await cache.getFiscalSettings();

    expect(result.tax).toBe(cache.DEFAULT_TAX_SETTINGS);
  });

  it('ignore un cache localStorage corrompu', async () => {
    const cache = await import('./fiscalSettingsCache');
    localStorage.setItem('ser1:fiscalSettingsCache:v2-ps-2026', '{json invalide');
    mockFiscalTables(
      { data: { data: cache.DEFAULT_TAX_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_PS_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_FISCALITY_SETTINGS, updated_at: null }, error: null },
      { data: [], error: null },
    );

    const result = await cache.getFiscalSettings();

    expect(result.tax).toBe(cache.DEFAULT_TAX_SETTINGS);
    expect(result.error).toBeNull();
  });

  it('mutualise les fetchs stricts concurrents', async () => {
    const cache = await import('./fiscalSettingsCache');
    const tax = createDeferred<MaybeSingleResult>();
    const ps = createDeferred<MaybeSingleResult>();
    const fiscality = createDeferred<MaybeSingleResult>();
    const pass = createDeferred<{
      data: Array<{ year: number; pass_amount: number }>;
      error: null;
    }>();
    mockFiscalTables(tax.promise, ps.promise, fiscality.promise, pass.promise);

    const first = cache.loadFiscalSettingsStrict();
    const second = cache.loadFiscalSettingsStrict();

    expect(fromMock.mock.calls.filter(([table]) => table === 'tax_settings')).toHaveLength(1);
    expect(fromMock.mock.calls.filter(([table]) => table === 'ps_settings')).toHaveLength(1);
    expect(fromMock.mock.calls.filter(([table]) => table === 'fiscality_settings')).toHaveLength(1);
    expect(fromMock.mock.calls.filter(([table]) => table === 'pass_history')).toHaveLength(1);

    tax.resolve({ data: { data: cache.DEFAULT_TAX_SETTINGS, updated_at: null }, error: null });
    ps.resolve({ data: { data: cache.DEFAULT_PS_SETTINGS, updated_at: null }, error: null });
    fiscality.resolve({
      data: { data: cache.DEFAULT_FISCALITY_SETTINGS, updated_at: null },
      error: null,
    });
    pass.resolve({ data: [{ year: 2026, pass_amount: 48123 }], error: null });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });

  it('invalide un kind et le recharge immédiatement', async () => {
    const cache = await import('./fiscalSettingsCache');
    mockFiscalTables(
      { data: { data: cache.DEFAULT_TAX_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_PS_SETTINGS, updated_at: null }, error: null },
      { data: { data: cache.DEFAULT_FISCALITY_SETTINGS, updated_at: null }, error: null },
      { data: [], error: null },
    );
    await cache.loadFiscalSettingsStrict();
    fromMock.mockClear();

    await cache.invalidate('tax');

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith('tax_settings');
  });

  it('diffuse un événement d’invalidation', async () => {
    const dispatchEvent = vi.fn();
    class TestCustomEvent<T> extends Event {
      detail: T;

      constructor(type: string, init: { detail?: T }) {
        super(type);
        this.detail = init.detail as T;
      }
    }
    Object.defineProperty(globalThis, 'window', {
      value: { dispatchEvent },
      configurable: true,
    });
    Object.defineProperty(globalThis, 'CustomEvent', {
      value: TestCustomEvent,
      configurable: true,
    });
    const cache = await import('./fiscalSettingsCache');

    cache.broadcastInvalidation('ps');

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ser1:fiscal-settings-updated',
        detail: { kind: 'ps' },
      }),
    );
  });
});
