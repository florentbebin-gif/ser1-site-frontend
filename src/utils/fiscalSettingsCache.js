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

// --- Valeurs par défaut (fallback si Supabase ne répond pas) ---
export const DEFAULT_TAX_SETTINGS = {
  incomeTax: {
    currentYearLabel: '2025 (revenus 2024)',
    previousYearLabel: '2024 (revenus 2023)',
    scaleCurrent: [
      { from: 0, to: 11497, rate: 0 },
      { from: 11498, to: 29315, rate: 11 },
      { from: 29316, to: 83823, rate: 30 },
      { from: 83824, to: 180294, rate: 41 },
      { from: 180295, to: null, rate: 45 },
    ],
    scalePrevious: [
      { from: 0, to: 11294, rate: 0 },
      { from: 11295, to: 28797, rate: 11 },
      { from: 28798, to: 82341, rate: 30 },
      { from: 82342, to: 177106, rate: 41 },
      { from: 177107, to: null, rate: 45 },
    ],
    quotientFamily: {
      current: { plafondPartSup: 1791, plafondParentIsoléDeuxPremièresParts: 4224 },
      previous: { plafondPartSup: 1791, plafondParentIsoléDeuxPremièresParts: 4224 },
    },
    decote: {
      current: { triggerSingle: 1964, triggerCouple: 3248, amountSingle: 889, amountCouple: 1470, ratePercent: 45.25 },
      previous: { triggerSingle: 1964, triggerCouple: 3248, amountSingle: 889, amountCouple: 1470, ratePercent: 45.25 },
    },
    abat10: {
      current: { plafond: 14426, plancher: 504 },
      previous: { plafond: 14171, plancher: 495 },
    },
    domAbatement: {
      current: { gmr: { ratePercent: 30, cap: 2450 }, guyane: { ratePercent: 40, cap: 4050 } },
      previous: { gmr: { ratePercent: 30, cap: 2450 }, guyane: { ratePercent: 40, cap: 4050 } },
    },
  },
  pfu: {
    current: { rateIR: 12.8, rateSocial: 17.2, rateTotal: 30.0 },
    previous: { rateIR: 12.8, rateSocial: 17.2, rateTotal: 30.0 },
  },
  cehr: {
    current: {
      single: [{ from: 250000, to: 500000, rate: 3 }, { from: 500000, to: null, rate: 4 }],
      couple: [{ from: 500000, to: 1000000, rate: 3 }, { from: 1000000, to: null, rate: 4 }],
    },
    previous: {
      single: [{ from: 250000, to: 500000, rate: 3 }, { from: 500000, to: null, rate: 4 }],
      couple: [{ from: 500000, to: 1000000, rate: 3 }, { from: 1000000, to: null, rate: 4 }],
    },
  },
  cdhr: {
    current: { minEffectiveRate: 20, thresholdSingle: 250000, thresholdCouple: 500000 },
    previous: { minEffectiveRate: 20, thresholdSingle: 250000, thresholdCouple: 500000 },
  },
};

export const DEFAULT_PS_SETTINGS = {
  patrimony: {
    current: { totalRate: 17.2, csgDeductibleRate: 6.8 },
    previous: { totalRate: 17.2, csgDeductibleRate: 6.8 },
  },
};

export const DEFAULT_FISCALITY_SETTINGS = {
  assuranceVie: {
    retraitsCapital: {
      psRatePercent: 17.2,
      depuis2017: {
        moins8Ans: { irRatePercent: 12.8 },
        plus8Ans: {
          abattementAnnuel: { single: 4600, couple: 9200 },
          primesNettesSeuil: 150000,
          irRateUnderThresholdPercent: 7.5,
          irRateOverThresholdPercent: 12.8,
        },
      },
    },
    deces: {
      primesApres1998: {
        allowancePerBeneficiary: 152500,
        brackets: [
          { upTo: 852500, ratePercent: 20 },
          { upTo: null, ratePercent: 31.25 },
        ],
      },
      apres70ans: { globalAllowance: 30500 },
    },
  },
  perIndividuel: {
    sortieCapital: {
      pfu: { irRatePercent: 12.8, psRatePercent: 17.2 },
    },
  },
  dividendes: {
    abattementBaremePercent: 40,
  },
};

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
      cache.fiscality = payload.fiscality;
      cache.timestamp = payload.timestamp;
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
          supabase.from('tax_settings').select('data').eq('id', 1).maybeSingle(),
          createTimeoutPromise(SUPABASE_TIMEOUT),
        ]);
      } else if (kind === 'ps') {
        res = await Promise.race([
          supabase.from('ps_settings').select('data').eq('id', 1).maybeSingle(),
          createTimeoutPromise(SUPABASE_TIMEOUT),
        ]);
      } else if (kind === 'fiscality') {
        res = await Promise.race([
          supabase.from('fiscality_settings').select('data').eq('id', 1).maybeSingle(),
          createTimeoutPromise(SUPABASE_TIMEOUT),
        ]);
      } else {
        throw new Error('Invalid kind');
      }
      if (!res.error && res.data && res.data.data) {
        cache[kind] = res.data.data;
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
  // Si tu veux attendre, décommente la ligne suivante :
  // await Promise.allSettled(promises);

  return result;
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
