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
import type { TresoInputs, TresoInputsV2, TresoInputsV4 } from '../../../engine/tresorerie/types';
import {
  buildTresoInputsV2FromLegacy,
  buildTresoInputsV4FromLegacy,
  buildTresoInputsV4FromV2,
  buildTresoInputsV4FromV3,
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
export const DEFAULT_TRESO_INPUTS_V4: TresoInputsV4 =
  buildTresoInputsV4FromLegacy(DEFAULT_TRESO_INPUTS_LEGACY);

const DEFAULT_STATE: TresoState = {
  inputsV4: DEFAULT_TRESO_INPUTS_V4,
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
  const inputsV4 =
    raw.inputsV4 ??
    (raw.inputsV3 ? buildTresoInputsV4FromV3(raw.inputsV3) : undefined) ??
    (raw.inputsV2 ? buildTresoInputsV4FromV2(raw.inputsV2) : undefined) ??
    (legacyWithEmbeddedV2?.v2 ? buildTresoInputsV4FromV2(legacyWithEmbeddedV2.v2) : undefined) ??
    buildTresoInputsV4FromLegacy(legacyInputs);
  return {
    inputsV4,
    projectionVisible: false,
    projectionMode: 'resume',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TresoStateResult {
  state: TresoState;
  hydrated: boolean;

  // Handlers globaux
  setInputsV4: (nextInputs: TresoInputsV4) => void;
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
        inputsV4: state.inputsV4,
      };
      sessionStorage.setItem(STORE_KEY, JSON.stringify(persisted));
    } catch {
      // sessionStorage plein ou indisponible
    }
  }, [hydrated, state.inputsV4]);

  // ── Listener reset ────────────────────────────────────────────────────────
  useEffect(() => {
    return onResetEvent(({ simId }) => {
      if (simId !== 'tresorerie-societe') return;
      setState(DEFAULT_STATE);
      try { sessionStorage.removeItem(STORE_KEY); } catch { /* noop */ }
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setInputsV4 = useCallback((nextInputs: TresoInputsV4) => {
    setState(s => ({ ...s, inputsV4: nextInputs }));
  }, []);

  const setInputsV2 = useCallback((nextInputs: TresoInputsV2) => {
    setState(s => ({ ...s, inputsV4: buildTresoInputsV4FromV2(nextInputs) }));
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
    setInputsV4,
    setInputsV2,
    setProjectionVisible,
    setProjectionMode,
  };
}
