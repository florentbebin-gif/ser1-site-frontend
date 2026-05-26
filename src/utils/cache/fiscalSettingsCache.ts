/**
 * fiscalSettingsCache.ts
 *
 * Service singleton pour charger, mettre en cache et invalider les paramètres fiscaux.
 * Objectifs :
 * - Éviter les refetchs inutiles (notamment sur /sim/ir)
 * - Garantir que l'UI ne bloque jamais indéfiniment (timeout + defaults immédiats)
 * - Persister en localStorage pour accélérer les cold starts
 * - Invalidation après sauvegarde admin
 *
 * Tables gérées :
 * - tax_settings
 * - ps_settings
 * - fiscality_settings
 * - pass_history
 */

import { supabase } from '../../supabaseClient';
import { toFiscalitySettingsV2 } from './fiscalitySettingsAccess';
import type { FiscalitySettingsV2 } from './fiscalitySettings';
import {
  DEFAULT_TAX_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PASS_HISTORY,
} from '../../constants/settingsDefaults';

// Re-export pour les consommateurs historiques
export {
  DEFAULT_TAX_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PASS_HISTORY,
};

// --- Types publics ---

type CacheKind = 'tax' | 'ps' | 'fiscality' | 'pass';

export interface CacheMeta {
  taxUpdatedAt: string | null;
  psUpdatedAt: string | null;
  fiscalityUpdatedAt: string | null;
  passUpdatedAt: string | null;
}

export interface GetFiscalSettingsOptions {
  force?: boolean;
}

export interface GetFiscalSettingsResult {
  tax: typeof DEFAULT_TAX_SETTINGS;
  ps: typeof DEFAULT_PS_SETTINGS;
  fiscality: FiscalitySettingsV2;
  passHistory: Record<number, number>;
  loading: false;
  error: string | null;
  meta: CacheMeta;
}

export interface LoadFiscalSettingsStrictResult {
  tax: typeof DEFAULT_TAX_SETTINGS;
  ps: typeof DEFAULT_PS_SETTINGS;
  fiscality: FiscalitySettingsV2;
  passHistory: Record<number, number>;
  fromCache: boolean;
  error: string | null;
  meta: CacheMeta;
}

// --- Types internes ---

interface CacheState {
  tax: typeof DEFAULT_TAX_SETTINGS | null;
  ps: typeof DEFAULT_PS_SETTINGS | null;
  fiscality: FiscalitySettingsV2 | null;
  passHistory: Record<number, number> | null;
  timestamp: number;
  inflight: Record<CacheKind, Promise<void> | null>;
  errors: Record<CacheKind, string | null>;
  meta: CacheMeta;
}

interface PersistedPayload {
  tax: typeof DEFAULT_TAX_SETTINGS | null;
  ps: typeof DEFAULT_PS_SETTINGS | null;
  fiscality: unknown;
  passHistory: Record<number, number> | null;
  timestamp: number;
  meta: CacheMeta;
}

// --- Cache singleton ---
const CACHE_KEY = 'ser1:fiscalSettingsCache:v2-ps-2026';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h (les paramètres changent très rarement)
const SUPABASE_TIMEOUT = 8000; // 8s

let cache: CacheState = {
  tax: null,
  ps: null,
  fiscality: null,
  passHistory: null,
  timestamp: 0,
  inflight: { tax: null, ps: null, fiscality: null, pass: null },
  errors: { tax: null, ps: null, fiscality: null, pass: null },
  // updated_at values from Supabase rows (ISO strings or null)
  meta: { taxUpdatedAt: null, psUpdatedAt: null, fiscalityUpdatedAt: null, passUpdatedAt: null },
};

function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout Supabase')), ms);
  });
}

function isCacheValid(kind: CacheKind): boolean {
  const now = Date.now();
  const data = kind === 'pass' ? cache.passHistory : cache[kind];
  return data !== null && cache.timestamp !== 0 && now - cache.timestamp < CACHE_TTL;
}

function persistCache(): void {
  try {
    const payload: PersistedPayload = {
      tax: cache.tax,
      ps: cache.ps,
      fiscality: cache.fiscality,
      passHistory: cache.passHistory,
      timestamp: cache.timestamp,
      meta: cache.meta,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore localStorage errors
  }
}

function hydrateFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const payload = JSON.parse(raw) as PersistedPayload;
    if (payload && typeof payload === 'object' && payload.timestamp) {
      cache.tax = payload.tax;
      cache.ps = payload.ps;
      cache.fiscality = payload.fiscality ? toFiscalitySettingsV2(payload.fiscality) : null;
      cache.passHistory = payload.passHistory ?? null;
      cache.timestamp = payload.timestamp;
      cache.meta = payload.meta ?? {
        taxUpdatedAt: null,
        psUpdatedAt: null,
        fiscalityUpdatedAt: null,
        passUpdatedAt: null,
      };
      return true;
    }
  } catch {
    // ignore parse errors
  }
  return false;
}

function getLatestUpdatedAt(rows: Array<{ updated_at?: unknown }>): string | null {
  let latest: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    if (typeof row.updated_at !== 'string') continue;
    const time = Date.parse(row.updated_at);
    if (Number.isNaN(time) || time <= latestTime) continue;
    latest = row.updated_at;
    latestTime = time;
  }

  return latest;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'Erreur chargement Supabase';
}

function getFirstCacheError(): string | null {
  return cache.errors.tax ?? cache.errors.ps ?? cache.errors.fiscality ?? cache.errors.pass;
}

// --- Chargement depuis Supabase (avec timeout) ---
async function fetchFromSupabase(kind: CacheKind): Promise<void> {
  const inflight = cache.inflight[kind];
  if (inflight) return inflight;
  const promise = (async (): Promise<void> => {
    try {
      let res;
      if (kind === 'tax') {
        res = await Promise.race([
          supabase.from('tax_settings').select('data, updated_at').eq('id', 1).maybeSingle(),
          createTimeoutPromise(SUPABASE_TIMEOUT),
        ]);
      } else if (kind === 'ps') {
        res = await Promise.race([
          supabase.from('ps_settings').select('data, updated_at').eq('id', 1).maybeSingle(),
          createTimeoutPromise(SUPABASE_TIMEOUT),
        ]);
      } else if (kind === 'fiscality') {
        res = await Promise.race([
          supabase.from('fiscality_settings').select('data, updated_at').eq('id', 1).maybeSingle(),
          createTimeoutPromise(SUPABASE_TIMEOUT),
        ]);
      } else {
        // kind === 'pass' — pass_history is a multi-row table, not a single-row data column
        try {
          const passRes = await Promise.race([
            supabase
              .from('pass_history')
              .select('year, pass_amount, updated_at')
              .order('year', { ascending: true }),
            createTimeoutPromise(SUPABASE_TIMEOUT),
          ]);
          if (passRes.error) {
            cache.errors.pass = toErrorMessage(passRes.error);
            return;
          }
          cache.errors.pass = null;
          if (passRes.data && passRes.data.length > 0) {
            const history: Record<number, number> = {};
            for (const row of passRes.data) {
              if (typeof row.year === 'number' && row.pass_amount != null) {
                history[row.year] = Number(row.pass_amount);
              }
            }
            if (Object.keys(history).length > 0) {
              cache.passHistory = history;
              cache.meta.passUpdatedAt = getLatestUpdatedAt(passRes.data);
              cache.timestamp = Date.now();
              persistCache();
            }
          }
        } catch (error) {
          cache.errors.pass = toErrorMessage(error);
          // pass_history fetch failed — keep fallback
        } finally {
          cache.inflight.pass = null;
        }
        return;
      }
      if (res.error) {
        cache.errors[kind] = toErrorMessage(res.error);
        return;
      }
      cache.errors[kind] = null;
      if (res.data && res.data.data) {
        if (kind === 'tax') {
          cache.tax = res.data.data as typeof DEFAULT_TAX_SETTINGS;
          cache.meta.taxUpdatedAt = res.data.updated_at ?? null;
        } else if (kind === 'ps') {
          cache.ps = res.data.data as typeof DEFAULT_PS_SETTINGS;
          cache.meta.psUpdatedAt = res.data.updated_at ?? null;
        } else {
          cache.fiscality = toFiscalitySettingsV2(res.data.data);
          cache.meta.fiscalityUpdatedAt = res.data.updated_at ?? null;
        }
        cache.timestamp = Date.now();
        persistCache();
      }
    } catch (error) {
      cache.errors[kind] = toErrorMessage(error);
      // On ne met pas à jour le cache si erreur (timeout ou autre)
    } finally {
      cache.inflight[kind] = null;
    }
  })();
  cache.inflight[kind] = promise;
  return promise;
}

// --- API publique ---
export async function getFiscalSettings({
  force = false,
}: GetFiscalSettingsOptions = {}): Promise<GetFiscalSettingsResult> {
  // Hydrate depuis localStorage au premier appel
  if (!cache.timestamp) hydrateFromStorage();

  const result: GetFiscalSettingsResult = {
    tax: DEFAULT_TAX_SETTINGS,
    ps: DEFAULT_PS_SETTINGS,
    fiscality: toFiscalitySettingsV2(DEFAULT_FISCALITY_SETTINGS),
    passHistory: DEFAULT_PASS_HISTORY,
    loading: false,
    error: getFirstCacheError(),
    meta: { ...cache.meta },
  };

  // Retourner cache si valide et pas de force
  if (!force) {
    const kinds: CacheKind[] = ['tax', 'ps', 'fiscality', 'pass'];
    for (const kind of kinds) {
      if (isCacheValid(kind)) {
        if (kind === 'tax' && cache.tax) result.tax = cache.tax;
        else if (kind === 'ps' && cache.ps) result.ps = cache.ps;
        else if (kind === 'fiscality' && cache.fiscality) result.fiscality = cache.fiscality;
        else if (kind === 'pass' && cache.passHistory) result.passHistory = cache.passHistory;
      }
    }
  }

  // Lancer les fetchs en arrière-plan (stale-while-revalidate)
  for (const kind of ['tax', 'ps', 'fiscality', 'pass'] as CacheKind[]) {
    fetchFromSupabase(kind);
  }
  // On n'attend pas: on retourne immédiatement cache/defaults

  return result;
}

/**
 * loadFiscalSettingsStrict — Mode strict : attend que Supabase répond avant de retourner.
 *
 * Si le cache localStorage est valide (< TTL), retourne immédiatement depuis le cache
 * (pas besoin de refetch). Sinon, attend le fetch Supabase (avec timeout).
 *
 * À utiliser uniquement pour les simulateurs critiques (IR, Succession).
 */
export async function loadFiscalSettingsStrict(): Promise<LoadFiscalSettingsStrictResult> {
  // Hydrate depuis localStorage au premier appel
  if (!cache.timestamp) hydrateFromStorage();

  // Si toutes les données sont en cache valide, pas besoin d'attendre
  const allCached = (['tax', 'ps', 'fiscality', 'pass'] as CacheKind[]).every((k) =>
    isCacheValid(k),
  );
  if (allCached) {
    return {
      tax: cache.tax ?? DEFAULT_TAX_SETTINGS,
      ps: cache.ps ?? DEFAULT_PS_SETTINGS,
      fiscality: cache.fiscality ?? toFiscalitySettingsV2(DEFAULT_FISCALITY_SETTINGS),
      passHistory: cache.passHistory ?? DEFAULT_PASS_HISTORY,
      fromCache: true,
      error: null,
      meta: { ...cache.meta },
    };
  }

  // Attendre les fetchs Supabase pour les kinds manquants
  let fetchError: string | null = null;
  try {
    await Promise.allSettled(
      (['tax', 'ps', 'fiscality', 'pass'] as CacheKind[]).map((kind) => fetchFromSupabase(kind)),
    );
  } catch (e: unknown) {
    fetchError = toErrorMessage(e);
  }
  fetchError = fetchError ?? getFirstCacheError();

  return {
    tax: isCacheValid('tax') && cache.tax ? cache.tax : DEFAULT_TAX_SETTINGS,
    ps: isCacheValid('ps') && cache.ps ? cache.ps : DEFAULT_PS_SETTINGS,
    fiscality:
      isCacheValid('fiscality') && cache.fiscality
        ? cache.fiscality
        : toFiscalitySettingsV2(DEFAULT_FISCALITY_SETTINGS),
    passHistory:
      isCacheValid('pass') && cache.passHistory ? cache.passHistory : DEFAULT_PASS_HISTORY,
    fromCache: false,
    error: fetchError,
    meta: { ...cache.meta },
  };
}

export async function invalidate(kind: CacheKind): Promise<void> {
  if (['tax', 'ps', 'fiscality', 'pass'].includes(kind)) {
    if (kind === 'pass') {
      cache.passHistory = null;
    } else {
      cache[kind] = null;
    }
    cache.timestamp = 0;
    persistCache();
    // Recharger immédiatement pour que les consommateurs aient la dernière version
    await fetchFromSupabase(kind);
  }
}

// Event pour broadcast d'invalidation (optionnel, mais pratique)
export function broadcastInvalidation(kind: CacheKind): void {
  try {
    window.dispatchEvent(new CustomEvent('ser1:fiscal-settings-updated', { detail: { kind } }));
  } catch {
    // ignore
  }
}

// Listener optionnel pour les composants qui veulent s'abonner
export function addInvalidationListener(callback: (_kind: CacheKind) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<{ kind: CacheKind }>).detail?.kind);
  window.addEventListener('ser1:fiscal-settings-updated', handler);
  return () => window.removeEventListener('ser1:fiscal-settings-updated', handler);
}
