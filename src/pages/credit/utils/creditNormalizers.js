/**
 * creditNormalizers.js - State management pour CreditV2
 * 
 * Inspiré de placement/utils/normalizers.js
 * Centralise la structure du state et les fonctions de normalisation.
 */

import { nowYearMonth } from './creditFormatters.js';

// ============================================================================
// DEFAULT STATE
// ============================================================================

export const DEFAULT_PRET = {
  capital: 300000,
  duree: 240,
  taux: 3.50,
  tauxAssur: 0.30,
  quotite: 100,
  type: 'amortissable',
  startYM: null, // hérite de global.startYM si null
};

export const DEFAULT_STATE = {
  // Paramètres globaux (partagés entre tous les prêts)
  startYM: nowYearMonth(),
  assurMode: 'CRD', // 'CI' | 'CRD'
  creditType: 'amortissable',
  viewMode: 'mensuel', // 'mensuel' | 'annuel'
  
  // Prêts (null = non créé/inactif)
  pret1: { ...DEFAULT_PRET },
  pret2: null,
  pret3: null,
  
  // Options de lissage
  lisserPret1: false,
  lissageMode: 'mensu', // 'mensu' | 'duree'
  
  // UI state (non persisté)
  activeTab: 0, // 0 = pret1, 1 = pret2, 2 = pret3
  touched: { capital: false, duree: false },
};

// ============================================================================
// HELPERS DE NORMALISATION
// ============================================================================

/**
 * Normalise un état chargé depuis le localStorage/sessionStorage
 * Gère la migration depuis l'ancien format (Credit.jsx legacy)
 */
export function normalizeLoadedState(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_STATE };
  }

  // Migration depuis l'ancien format (champs plats → structure pret1/pret2/pret3)
  const migrated = migrateFromLegacyFormat(raw);

  return {
    ...DEFAULT_STATE,
    ...migrated,
    // Assurer que pret1 existe toujours
    pret1: { ...DEFAULT_PRET, ...migrated.pret1 },
    // Normaliser les prêts optionnels
    pret2: migrated.pret2 ? { ...DEFAULT_PRET, ...migrated.pret2 } : null,
    pret3: migrated.pret3 ? { ...DEFAULT_PRET, ...migrated.pret3 } : null,
    // Reset UI state
    activeTab: 0,
    touched: { capital: false, duree: false },
  };
}

/**
 * Migre depuis l'ancien format Credit.jsx (champs individuels)
 * vers le nouveau format structuré
 */
function migrateFromLegacyFormat(raw) {
  // Si déjà au nouveau format, retourner tel quel
  if (raw.pret1 && typeof raw.pret1 === 'object') {
    return raw;
  }

  // Migration depuis l'ancien format
  const migrated = {
    startYM: raw.startYM ?? DEFAULT_STATE.startYM,
    assurMode: raw.assurMode ?? DEFAULT_STATE.assurMode,
    creditType: raw.creditType ?? DEFAULT_STATE.creditType,
    viewMode: raw.viewMode ?? DEFAULT_STATE.viewMode,
    lisserPret1: raw.lisserPret1 ?? false,
    lissageMode: raw.lissageMode ?? 'mensu',
    activeTab: 0,
  };

  // Migrer pret1 depuis les champs legacy
  migrated.pret1 = {
    capital: raw.capital ?? DEFAULT_PRET.capital,
    duree: raw.duree ?? DEFAULT_PRET.duree,
    taux: raw.taux ?? DEFAULT_PRET.taux,
    tauxAssur: raw.tauxAssur ?? DEFAULT_PRET.tauxAssur,
    quotite: raw.quotite ?? DEFAULT_PRET.quotite,
    type: raw.creditType ?? DEFAULT_PRET.type,
    startYM: raw.startYM ?? null,
  };

  // Migrer pret2/pret3 depuis pretsPlus[] legacy
  if (raw.pretsPlus && Array.isArray(raw.pretsPlus)) {
    raw.pretsPlus.forEach((p, idx) => {
      if (idx === 0) {
        migrated.pret2 = {
          id: p.id || generateId(),
          capital: p.capital ?? DEFAULT_PRET.capital,
          duree: p.duree ?? DEFAULT_PRET.duree,
          taux: p.taux ?? DEFAULT_PRET.taux,
          tauxAssur: p.tauxAssur ?? DEFAULT_PRET.tauxAssur,
          quotite: p.quotite ?? DEFAULT_PRET.quotite,
          type: p.type ?? raw.creditType ?? DEFAULT_PRET.type,
          startYM: p.startYM ?? raw.startYM ?? null,
          assurMode: p.assurMode ?? raw.assurMode ?? 'CRD',
        };
      }
      if (idx === 1) {
        migrated.pret3 = {
          id: p.id || generateId(),
          capital: p.capital ?? DEFAULT_PRET.capital,
          duree: p.duree ?? DEFAULT_PRET.duree,
          taux: p.taux ?? DEFAULT_PRET.taux,
          tauxAssur: p.tauxAssur ?? DEFAULT_PRET.tauxAssur,
          quotite: p.quotite ?? DEFAULT_PRET.quotite,
          type: p.type ?? raw.creditType ?? DEFAULT_PRET.type,
          startYM: p.startYM ?? raw.startYM ?? null,
          assurMode: p.assurMode ?? raw.assurMode ?? 'CRD',
        };
      }
    });
  }

  return migrated;
}

/**
 * Construit l'état à persister (sérialisable)
 * Exclut les états UI temporaires
 */
export function buildPersistedState(state) {
  return {
    startYM: state.startYM,
    assurMode: state.assurMode,
    creditType: state.creditType,
    viewMode: state.viewMode,
    pret1: state.pret1,
    pret2: state.pret2,
    pret3: state.pret3,
    lisserPret1: state.lisserPret1,
    lissageMode: state.lissageMode,
  };
}

/**
 * Génère un ID unique pour les prêts
 */
export function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// ============================================================================
// HELPERS DE MUTATION STATE
// ============================================================================

/**
 * Crée un nouveau prêt (pret2 ou pret3)
 */
export function createNewPret(baseParams = {}) {
  return {
    id: generateId(),
    ...DEFAULT_PRET,
    ...baseParams,
  };
}

/**
 * Met à jour un prêt existant (patch partiel)
 */
export function patchPret(pret, patch) {
  return { ...pret, ...patch };
}

// ============================================================================
// FORMATS RAW (pour inputs contrôlés)
// ============================================================================

/**
 * Initialise les valeurs raw pour les inputs de taux
 */
export function initRawValues(state) {
  const raw = {};
  
  // Pret1
  raw.pret1 = {
    taux: formatTauxRaw(state.pret1?.taux),
    tauxAssur: formatTauxRaw(state.pret1?.tauxAssur),
    quotite: String(state.pret1?.quotite ?? 100),
  };
  
  // Pret2
  if (state.pret2) {
    raw.pret2 = {
      taux: formatTauxRaw(state.pret2.taux),
      tauxAssur: formatTauxRaw(state.pret2.tauxAssur),
      quotite: String(state.pret2.quotite ?? 100),
    };
  }
  
  // Pret3
  if (state.pret3) {
    raw.pret3 = {
      taux: formatTauxRaw(state.pret3.taux),
      tauxAssur: formatTauxRaw(state.pret3.tauxAssur),
      quotite: String(state.pret3.quotite ?? 100),
    };
  }
  
  return raw;
}

function formatTauxRaw(value) {
  const num = Number(value) || 0;
  return num.toFixed(2).replace('.', ',');
}
