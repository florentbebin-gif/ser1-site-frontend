/**
 * fiscalSettingsCache.js
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

import { supabase } from '../supabaseClient';
import { migrateV1toV2 } from './fiscalitySettingsMigrator';
import {
  DEFAULT_TAX_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_FISCALITY_SETTINGS,
} from '../constants/settingsDefaults';

// Re-export pour les consommateurs historiques
export { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS, DEFAULT_FISCALITY_SETTINGS };

// --- Cache singleton ---
const CACHE_KEY = 'ser1:fiscalSettingsCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h (les paramètres changent très rarement)
const SUPABASE_TIMEOUT = 8000; // 8s

let cache = {
  tax: null,
  ps: null,
  fiscality: null,
  timestamp: 0,
  inflight: { tax: null, ps: null, fiscality: null },
  // updated_at values from Supabase rows (ISO strings or null)
  meta: { taxUpdatedAt: null, psUpdatedAt: null, fiscalityUpdatedAt: null },
};

function createTimeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout Supabase')), ms);
  });
}

function isCacheValid(kind) {
  const now = Date.now();
  return cache[kind] && cache.timestamp && (now - cache.timestamp) < CACHE_TTL;
}

function persistCache() {
  try {
    const payload = {
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

function hydrateFromStorage() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const payload = JSON.parse(raw);
    if (payload && typeof payload === 'object' && payload.timestamp) {
      cache.tax = payload.tax;
      cache.ps = payload.ps;
      cache.fiscality = payload.fiscality ? migrateV1toV2(payload.fiscality) : payload.fiscality;
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
async function fetchFromSupabase(kind) {
  if (cache.inflight[kind]) return cache.inflight[kind];
  const promise = (async () => {
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
        throw new Error('Invalid kind');
      }
      if (!res.error && res.data && res.data.data) {
        cache[kind] = kind === 'fiscality'
          ? migrateV1toV2(res.data.data)
          : res.data.data;
        // Persist updated_at from Supabase row
        const updatedAt = res.data.updated_at ?? null;
        if (kind === 'tax') cache.meta.taxUpdatedAt = updatedAt;
        else if (kind === 'ps') cache.meta.psUpdatedAt = updatedAt;
        else if (kind === 'fiscality') cache.meta.fiscalityUpdatedAt = updatedAt;
        cache.timestamp = Date.now();
        persistCache();
      } else {
        // On ne met pas à jour le cache si erreur ou pas de données
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
export async function getFiscalSettings({ force = false } = {}) {
  // Hydrate depuis localStorage au premier appel
  if (!cache.timestamp) hydrateFromStorage();

  const result = {
    tax: DEFAULT_TAX_SETTINGS,
    ps: DEFAULT_PS_SETTINGS,
    fiscality: DEFAULT_FISCALITY_SETTINGS,
    loading: false,
    error: null,
    meta: { ...cache.meta },
  };

  // Retourner cache si valide et pas de force
  if (!force) {
    ['tax', 'ps', 'fiscality'].forEach((kind) => {
      if (isCacheValid(kind)) {
        result[kind] = cache[kind];
      }
    });
  }

  // Lancer les fetchs en arrière-plan (stale-while-revalidate)
  ['tax', 'ps', 'fiscality'].forEach((kind) => {
    fetchFromSupabase(kind);
  });
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
 *
 * @returns {{ tax, ps, fiscality, fromCache: boolean, error: string|null, meta: { taxUpdatedAt: string|null, psUpdatedAt: string|null, fiscalityUpdatedAt: string|null } }}
 */
export async function loadFiscalSettingsStrict() {
  // Hydrate depuis localStorage au premier appel
  if (!cache.timestamp) hydrateFromStorage();

  // Si toutes les données sont en cache valide, pas besoin d'attendre
  const allCached = ['tax', 'ps', 'fiscality'].every((k) => isCacheValid(k));
  if (allCached) {
    return {
      tax: cache.tax,
      ps: cache.ps,
      fiscality: cache.fiscality,
      fromCache: true,
      error: null,
      meta: { ...cache.meta },
    };
  }

  // Attendre les fetchs Supabase pour les kinds manquants
  let fetchError = null;
  try {
    await Promise.allSettled(
      ['tax', 'ps', 'fiscality'].map((kind) => fetchFromSupabase(kind))
    );
  } catch (e) {
    fetchError = e?.message || 'Erreur chargement Supabase';
  }

  return {
    tax: isCacheValid('tax') ? cache.tax : DEFAULT_TAX_SETTINGS,
    ps: isCacheValid('ps') ? cache.ps : DEFAULT_PS_SETTINGS,
    fiscality: isCacheValid('fiscality') ? cache.fiscality : DEFAULT_FISCALITY_SETTINGS,
    fromCache: false,
    error: fetchError,
    meta: { ...cache.meta },
  };
}

export async function invalidate(kind) {
  if (['tax', 'ps', 'fiscality'].includes(kind)) {
    cache[kind] = null;
    cache.timestamp = 0;
    persistCache();
    // Recharger immédiatement pour que les consommateurs aient la dernière version
    await fetchFromSupabase(kind);
  }
}

// Event pour broadcast d'invalidation (optionnel, mais pratique)
export function broadcastInvalidation(kind) {
  try {
    window.dispatchEvent(new CustomEvent('ser1:fiscal-settings-updated', { detail: { kind } }));
  } catch {
    // ignore
  }
}

// Listener optionnel pour les composants qui veulent s'abonner
export function addInvalidationListener(callback) {
  const handler = (e) => callback(e.detail?.kind);
  window.addEventListener('ser1:fiscal-settings-updated', handler);
  return () => window.removeEventListener('ser1:fiscal-settings-updated', handler);
}
