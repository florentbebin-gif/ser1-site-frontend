/**
 * Cache dédié pour base_contrat_settings.
 *
 * SÉPARÉ de fiscalSettingsCache.js pour éviter de forcer un fetch
 * supplémentaire sur les pages qui ne consomment pas le référentiel contrats.
 *
 * Pattern identique : singleton mémoire + localStorage anti-flash + TTL 24h.
 */

import { supabase } from '../supabaseClient';
import type { BaseContratSettings } from '../types/baseContratSettings';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h
const LS_KEY = 'ser1:baseContratSettingsCache';
const SUPABASE_TIMEOUT = 8_000; // ms
const EVENT_NAME = 'ser1:base-contrat-updated';

const EMPTY_DATA: BaseContratSettings = { schemaVersion: 1, products: [] };

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let cache: { data: BaseContratSettings | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

// ---------------------------------------------------------------------------
// localStorage helpers (safe — never throws)
// ---------------------------------------------------------------------------

function persistCache(): void {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ data: cache.data, timestamp: cache.timestamp }),
    );
  } catch {
    /* quota exceeded or private browsing — ignore */
  }
}

function restoreCache(): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.data && typeof parsed.timestamp === 'number') {
      cache = { data: parsed.data, timestamp: parsed.timestamp };
    }
  } catch {
    /* corrupted data — ignore */
  }
}

// Restore on module load (anti-flash)
restoreCache();

// ---------------------------------------------------------------------------
// Fetch from Supabase
// ---------------------------------------------------------------------------

async function fetchFromSupabase(): Promise<BaseContratSettings> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT);

  try {
    const { data: rows, error } = await supabase
      .from('base_contrat_settings')
      .select('data')
      .eq('id', 1)
      .abortSignal(controller.signal);

    if (error) {
      // Table may not exist yet (migration not applied) — return empty
      if (error.code === '42P01' || error.code === 'PGRST204') {
        return EMPTY_DATA;
      }
      console.warn('[baseContratCache] fetch error:', error.message);
      return cache.data ?? EMPTY_DATA;
    }

    const raw = rows?.[0]?.data;
    if (!raw || typeof raw !== 'object') return EMPTY_DATA;

    const result = raw as BaseContratSettings;
    cache = { data: result, timestamp: Date.now() };
    persistCache();
    return result;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      console.warn('[baseContratCache] fetch timeout');
    }
    return cache.data ?? EMPTY_DATA;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getBaseContratSettings(
  opts?: { force?: boolean },
): Promise<BaseContratSettings> {
  const force = opts?.force ?? false;

  // Valid in-memory cache
  if (!force && cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  return fetchFromSupabase();
}

export async function saveBaseContratSettings(
  data: BaseContratSettings,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('base_contrat_settings')
      .upsert({ id: 1, data }, { onConflict: 'id' });

    if (error) {
      console.error('[baseContratCache] save error:', error.message);
      return { error: error.message };
    }

    // Update local cache
    cache = { data, timestamp: Date.now() };
    persistCache();
    broadcastInvalidation();
    return { error: null };
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Unknown error';
    console.error('[baseContratCache] save exception:', msg);
    return { error: msg };
  }
}

export function invalidateBaseContrat(): void {
  cache = { data: null, timestamp: 0 };
  persistCache();
}

export function broadcastInvalidation(): void {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* SSR or test env — ignore */
  }
}

export function addBaseContratListener(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
