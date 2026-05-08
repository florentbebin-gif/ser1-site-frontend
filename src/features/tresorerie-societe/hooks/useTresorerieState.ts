/**
 * useTresorerieState.ts — State centralisé, handlers et persistance sessionStorage
 *
 * Gère l'état complet du simulateur trésorerie société IS :
 * inputs utilisateur, visibilité de la projection, mode de vue.
 * Persistance : sessionStorage, clé 'ser1:sim:tresorerie-societe'.
 */

import { useCallback, useEffect, useState } from 'react';
import { storageKeyFor, onResetEvent } from '../../../utils/reset';
import type { TresoState, TresoPersistedState } from '../types';
import type { TresoInputs, TresoInputsV2, TresoInputsV3 } from '../../../engine/tresorerie/types';
import {
  buildTresoInputsV2FromLegacy,
  buildTresoInputsV3FromLegacy,
  buildTresoInputsV3FromV2,
} from '../utils/tresorerieV2Migration';

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const DEFAULT_TRESO_INPUTS_LEGACY: TresoInputs = {
  typeCreation: 'newco',
  ageActuel: 50,
  ageRetraite: 65,
  besoinsRetraiteAnnuels: 30000,
  fraisStructureAnnuels: 3000,
  ccaInitial: 0,
  apportAnnuelCCA: 16600,
  dureeActiveAns: 15,
  tresorerieInitiale: 0,
  reservesInitiales: 0,
  anneeCivileDebut: new Date().getFullYear(),
  distribution: undefined,
  capitalisation: undefined,
  creditIS: undefined,
  creditIR: undefined,
  holding: undefined,
};

export const DEFAULT_TRESO_INPUTS_V2: TresoInputsV2 =
  buildTresoInputsV2FromLegacy(DEFAULT_TRESO_INPUTS_LEGACY);
export const DEFAULT_TRESO_INPUTS_V3: TresoInputsV3 =
  buildTresoInputsV3FromLegacy(DEFAULT_TRESO_INPUTS_LEGACY);

const DEFAULT_STATE: TresoState = {
  inputsV3: DEFAULT_TRESO_INPUTS_V3,
  projectionVisible: false,
  projectionMode: 'resume',
};

const STORE_KEY = storageKeyFor('tresorerie-societe');

// ─── Normalisation chargement ─────────────────────────────────────────────────

export function normalizeTresoreriePersistedState(raw: TresoPersistedState): TresoState {
  const legacyInputs: TresoInputs = {
    ...DEFAULT_TRESO_INPUTS_LEGACY,
    ...(raw.inputs ?? {}),
  };
  const legacyWithEmbeddedV2 = raw.inputs as (TresoInputs & { v2?: TresoInputsV2 }) | undefined;
  const inputsV3 =
    raw.inputsV3 ??
    (raw.inputsV2 ? buildTresoInputsV3FromV2(raw.inputsV2) : undefined) ??
    (legacyWithEmbeddedV2?.v2 ? buildTresoInputsV3FromV2(legacyWithEmbeddedV2.v2) : undefined) ??
    buildTresoInputsV3FromLegacy(legacyInputs);
  return {
    inputsV3,
    projectionVisible: false,
    projectionMode: 'resume',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TresoStateResult {
  state: TresoState;
  hydrated: boolean;

  // Handlers globaux
  setInputsV3: (nextInputs: TresoInputsV3) => void;
  setInputsV2: (nextInputs: TresoInputsV2) => void;
  setProjectionVisible: (v: boolean) => void;
  setProjectionMode: (v: 'resume' | 'detail') => void;
}

export function useTresorerieState(): TresoStateResult {
  const [state, setState] = useState<TresoState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // ── Hydration depuis sessionStorage ──────────────────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TresoPersistedState;
        setState(normalizeTresoreriePersistedState(parsed));
      }
    } catch {
      // sessionStorage indisponible ou JSON invalide — on garde les defaults
    }
    setHydrated(true);
  }, []);

  // ── Persistance à chaque changement d'inputs ──────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    try {
      const persisted: TresoPersistedState = {
        inputsV3: state.inputsV3,
      };
      sessionStorage.setItem(STORE_KEY, JSON.stringify(persisted));
    } catch {
      // sessionStorage plein ou indisponible
    }
  }, [hydrated, state.inputsV3]);

  // ── Listener reset ────────────────────────────────────────────────────────
  useEffect(() => {
    return onResetEvent(({ simId }) => {
      if (simId !== 'tresorerie-societe') return;
      setState(DEFAULT_STATE);
      try { sessionStorage.removeItem(STORE_KEY); } catch { /* noop */ }
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setInputsV3 = useCallback((nextInputs: TresoInputsV3) => {
    setState(s => ({ ...s, inputsV3: nextInputs }));
  }, []);

  const setInputsV2 = useCallback((nextInputs: TresoInputsV2) => {
    setState(s => ({ ...s, inputsV3: buildTresoInputsV3FromV2(nextInputs) }));
  }, []);

  const setProjectionVisible = useCallback((v: boolean) => {
    setState(s => ({ ...s, projectionVisible: v }));
  }, []);

  const setProjectionMode = useCallback((v: 'resume' | 'detail') => {
    setState(s => ({ ...s, projectionMode: v }));
  }, []);

  return {
    state,
    hydrated,
    setInputsV3,
    setInputsV2,
    setProjectionVisible,
    setProjectionMode,
  };
}
