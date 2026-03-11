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
 */

import { supabase } from '../../supabaseClient';
import { migrateV1toV2 } from '../fiscalitySettingsMigrator';
import type { FiscalitySettingsV2 } from '../../types/fiscalitySettings';
import {
  DEFAULT_TAX_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
} from '../../constants/settingsDefaults';

// Re-export pour les consommateurs historiques
export { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS, DEFAULT_FISCALITY_SETTINGS };

// --- Types publics ---

type CacheKind = 'tax' | 'ps' | 'fiscality';

export interface CacheMeta {
  taxUpdatedAt: string | null;
  psUpdatedAt: string | null;
  fiscalityUpdatedAt: string | null;
}

export interface GetFiscalSettingsOptions {
  force?: boolean;
}

export interface GetFiscalSettingsResult {
  tax: typeof DEFAULT_TAX_SETTINGS;
  ps: typeof DEFAULT_PS_SETTINGS;
  /** V2 format au runtime — les champs V1 (assuranceVie, perIndividuel) sont préservés pour compatibilité. */
  fiscality: typeof DEFAULT_FISCALITY_SETTINGS;
  loading: false;
  error: null;
  meta: CacheMeta;
}

export interface LoadFiscalSettingsStrictResult {
  tax: typeof DEFAULT_TAX_SETTINGS;
  ps: typeof DEFAULT_PS_SETTINGS;
  /** V2 format au runtime — les champs V1 (assuranceVie, perIndividuel) sont préservés pour compatibilité. */
  fiscality: typeof DEFAULT_FISCALITY_SETTINGS;
  fromCache: boolean;
  error: string | null;
  meta: CacheMeta;
}

// --- Types internes ---

interface CacheState {
  tax: typeof DEFAULT_TAX_SETTINGS | null;
  ps: typeof DEFAULT_PS_SETTINGS | null;
  /** Stocké en V2 (après migrateV1toV2). Les champs V1 sont préservés en legacy props. */
  fiscality: FiscalitySettingsV2 | null;
  timestamp: number;
  inflight: Record<CacheKind, Promise<void> | null>;
  meta: CacheMeta;
}

interface PersistedPayload {
  tax: typeof DEFAULT_TAX_SETTINGS | null;
  ps: typeof DEFAULT_PS_SETTINGS | null;
  fiscality: unknown;
  timestamp: number;
  meta: CacheMeta;
}

// --- Cache singleton ---
const CACHE_KEY = 'ser1:fiscalSettingsCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h (les paramètres changent très rarement)
const SUPABASE_TIMEOUT = 8000; // 8s

let cache: CacheState = {
  tax: null,
  ps: null,
  fiscality: null,
  timestamp: 0,
  inflight: { tax: null, ps: null, fiscality: null },
  // updated_at values from Supabase rows (ISO strings or null)
  meta: { taxUpdatedAt: null, psUpdatedAt: null, fiscalityUpdatedAt: null },
};

function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout Supabase')), ms);
  });
}

function isCacheValid(kind: CacheKind): boolean {
  const now = Date.now();
  return cache[kind] !== null && cache.timestamp !== 0 && (now - cache.timestamp) < CACHE_TTL;
}

function persistCache(): void {
  try {
    const payload: PersistedPayload = {
      tax: cache.tax,
      ps: cache.ps,
      fiscality: cache.fiscality,
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
      cache.fiscality = payload.fiscality ? migrateV1toV2(payload.fiscality) : null;
      cache.timestamp = payload.timestamp;
      cache.meta = payload.meta ?? { taxUpdatedAt: null, psUpdatedAt: null, fiscalityUpdatedAt: null };
      return true;
    }
  } catch {
    // ignore parse errors
  }
  return false;
}

// --- Chargement depuis Supabase (avec timeout) ---
async function fetchFromSupabase(kind: CacheKind): Promise<void> {
  if (cache.inflight[kind]) return cache.inflight[kind]!;
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
      } else {
        res = await Promise.race([
          supabase.from('fiscality_settings').select('data, updated_at').eq('id', 1).maybeSingle(),
          createTimeoutPromise(SUPABASE_TIMEOUT),
        ]);
      }
      if (!res.error && res.data && res.data.data) {
        if (kind === 'tax') {
          cache.tax = res.data.data as typeof DEFAULT_TAX_SETTINGS;
          cache.meta.taxUpdatedAt = res.data.updated_at ?? null;
        } else if (kind === 'ps') {
          cache.ps = res.data.data as typeof DEFAULT_PS_SETTINGS;
          cache.meta.psUpdatedAt = res.data.updated_at ?? null;
        } else {
          cache.fiscality = migrateV1toV2(res.data.data);
          cache.meta.fiscalityUpdatedAt = res.data.updated_at ?? null;
        }
        cache.timestamp = Date.now();
        persistCache();
      }
    } catch {
      // On ne met pas à jour le cache si erreur (timeout ou autre)
    } finally {
      cache.inflight[kind] = null;
    }
  })();
  cache.inflight[kind] = promise;
  return promise;
}

// --- API publique ---
export async function getFiscalSettings({ force = false }: GetFiscalSettingsOptions = {}): Promise<GetFiscalSettingsResult> {
  // Hydrate depuis localStorage au premier appel
  if (!cache.timestamp) hydrateFromStorage();

  const result: GetFiscalSettingsResult = {
    tax: DEFAULT_TAX_SETTINGS,
    ps: DEFAULT_PS_SETTINGS,
    fiscality: DEFAULT_FISCALITY_SETTINGS,
    loading: false,
    error: null,
    meta: { ...cache.meta },
  };

  // Retourner cache si valide et pas de force
  if (!force) {
    const kinds: CacheKind[] = ['tax', 'ps', 'fiscality'];
    for (const kind of kinds) {
      if (isCacheValid(kind)) {
        if (kind === 'tax' && cache.tax) result.tax = cache.tax;
        else if (kind === 'ps' && cache.ps) result.ps = cache.ps;
        // fiscality: cast V2 → V1 shape (V2 preserves V1 legacy fields for consumers)
        else if (kind === 'fiscality' && cache.fiscality) result.fiscality = cache.fiscality as unknown as typeof DEFAULT_FISCALITY_SETTINGS;
      }
    }
  }

  // Lancer les fetchs en arrière-plan (stale-while-revalidate)
  for (const kind of ['tax', 'ps', 'fiscality'] as CacheKind[]) {
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
  const allCached = (['tax', 'ps', 'fiscality'] as CacheKind[]).every((k) => isCacheValid(k));
  if (allCached) {
    return {
      tax: cache.tax ?? DEFAULT_TAX_SETTINGS,
      ps: cache.ps ?? DEFAULT_PS_SETTINGS,
      // fiscality: cast V2 → V1 shape (V2 preserves V1 legacy fields for consumers)
      fiscality: (cache.fiscality ?? DEFAULT_FISCALITY_SETTINGS) as unknown as typeof DEFAULT_FISCALITY_SETTINGS,
      fromCache: true,
      error: null,
      meta: { ...cache.meta },
    };
  }

  // Attendre les fetchs Supabase pour les kinds manquants
  let fetchError: string | null = null;
  try {
    await Promise.allSettled(
      (['tax', 'ps', 'fiscality'] as CacheKind[]).map((kind) => fetchFromSupabase(kind))
    );
  } catch (e: unknown) {
    fetchError = (e instanceof Error ? e.message : null) ?? 'Erreur chargement Supabase';
  }

  return {
    tax: isCacheValid('tax') && cache.tax ? cache.tax : DEFAULT_TAX_SETTINGS,
    ps: isCacheValid('ps') && cache.ps ? cache.ps : DEFAULT_PS_SETTINGS,
    fiscality: (isCacheValid('fiscality') && cache.fiscality ? cache.fiscality : DEFAULT_FISCALITY_SETTINGS) as unknown as typeof DEFAULT_FISCALITY_SETTINGS,
    fromCache: false,
    error: fetchError,
    meta: { ...cache.meta },
  };
}

export async function invalidate(kind: CacheKind): Promise<void> {
  if (['tax', 'ps', 'fiscality'].includes(kind)) {
    cache[kind] = null;
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
