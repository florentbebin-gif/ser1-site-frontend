/**
 * Cache dédié pour base_contrat_settings.
 *
 * SÉPARÉ de fiscalSettingsCache.js pour éviter de forcer un fetch
 * supplémentaire sur les pages qui ne consomment pas le référentiel contrats.
 *
 * Pattern identique : singleton mémoire + localStorage anti-flash + TTL 24h.
 */

import { supabase } from '../supabaseClient';
import type { BaseContratSettings, BaseContratProduct } from '../types/baseContratSettings';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h
const LS_KEY = 'ser1:baseContratSettingsCache';
const SUPABASE_TIMEOUT = 8_000; // ms
const EVENT_NAME = 'ser1:base-contrat-updated';

const EMPTY_DATA: BaseContratSettings = { schemaVersion: 2, products: [] };

// ---------------------------------------------------------------------------
// Migration lazy V1 → V2
// Pattern identique à migrateV1toV2 dans fiscalSettingsCache.js
// ---------------------------------------------------------------------------

function familyToGrandeFamille(family: string): BaseContratProduct['grandeFamille'] {
  const map: Record<string, BaseContratProduct['grandeFamille']> = {
    'Assurance': 'Assurance',
    'Bancaire': 'Épargne bancaire',
    'Titres': 'Titres vifs',
    'Immobilier': 'Immobilier direct',
    'Défiscalisation': 'Dispositifs fiscaux immo',
    'Autres': 'Non coté/PE',
  };
  return map[family] ?? 'Non coté/PE';
}

function migrateBaseContratV1toV2(data: BaseContratSettings): BaseContratSettings {
  if (data.schemaVersion === 2 || data.schemaVersion === 3) return data;
  return {
    ...data,
    schemaVersion: 2,
    products: data.products.map((p) => ({
      ...p,
      grandeFamille: p.grandeFamille ?? familyToGrandeFamille(p.family ?? 'Autres'),
      nature: p.nature ?? 'Contrat / compte / enveloppe',
      detensiblePP: p.detensiblePP ?? (p.holders === 'PP' || p.holders === 'PP+PM'),
      eligiblePM: p.eligiblePM ?? (p.holders === 'PM' || p.holders === 'PP+PM' ? 'oui' : 'non'),
      eligiblePMPrecision: p.eligiblePMPrecision ?? null,
      souscriptionOuverte: p.souscriptionOuverte ?? (p.open2026 ? 'oui' : 'non'),
      commentaireQualification: p.commentaireQualification ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Migration lazy V2 → V3 (Taxonomie relationnelle)
// ---------------------------------------------------------------------------

function migrateBaseContratV2toV3(data: BaseContratSettings): BaseContratSettings {
  if (data.schemaVersion === 3) return data;
  
  // Si on vient de V1, on passe d'abord par V2
  const v2Data = data.schemaVersion === 1 ? migrateBaseContratV1toV2(data) : data;
  
  return {
    ...v2Data,
    schemaVersion: 3,
    products: v2Data.products.map((p) => {
      // 1. Mapping nature -> catalogKind
      let catalogKind: BaseContratProduct['catalogKind'] = 'wrapper';
      if (p.nature === 'Dispositif fiscal immobilier') {
        catalogKind = 'tax_overlay';
      } else if (p.nature === 'Actif / instrument') {
        catalogKind = 'asset';
      }
      
      // Cas particulier : protections (qui étaient souvent en 'Contrat')
      if (p.grandeFamille === 'Assurance' && (p.label.toLowerCase().includes('prévoyance') || p.label.toLowerCase().includes('emprunteur'))) {
        catalogKind = 'protection';
      }
      
      // 2. Mapping detensiblePP/eligiblePM -> directHoldable/corporateHoldable
      const directHoldable = p.detensiblePP ?? true;
      const corporateHoldable = p.eligiblePM === 'oui' || p.eligiblePM === 'parException';
      
      // 3. Initialisation allowedWrappers
      // Si c'est un asset détenable en direct, il peut être 'direct'.
      // Les relations exactes (ex: SCPI -> AV) seront affinées par l'admin.
      const allowedWrappers: string[] = [];
      
      return {
        ...p,
        catalogKind,
        directHoldable,
        corporateHoldable,
        allowedWrappers,
      };
    }),
  };
}

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

    const migrated = migrateBaseContratV2toV3(raw as BaseContratSettings);
    cache = { data: migrated, timestamp: Date.now() };
    persistCache();
    return migrated;
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

export async function isBaseContratSettingsSourceAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT);

  try {
    const { error } = await supabase
      .from('base_contrat_settings')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    if (error) {
      return false;
    }

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
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
