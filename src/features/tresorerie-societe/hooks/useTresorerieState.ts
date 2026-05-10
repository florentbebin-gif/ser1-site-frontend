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
import type { TresoInputs, TresoInputsV2, TresoInputsV5 } from '../../../engine/tresorerie/types';
import {
  buildTresoInputsV5FromLegacy,
  buildTresoInputsV5FromV2,
  buildTresoInputsV5FromV3,
  buildTresoInputsV5FromV4,
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

const BLANK_TRESO_INPUTS_LEGACY: TresoInputs = {
  typeCreation: 'newco',
  ageActuel: 0,
  ageRetraite: 0,
  besoinsRetraiteAnnuels: 0,
  fraisStructureAnnuels: 0,
  ccaInitial: 0,
  apportAnnuelCCA: 0,
  dureeActiveAns: 0,
  tresorerieInitiale: 0,
  reservesInitiales: 0,
  anneeCivileDebut: new Date().getFullYear(),
  distribution: undefined,
  capitalisation: undefined,
  creditIS: undefined,
  creditIR: undefined,
  holding: undefined,
};

export const DEFAULT_TRESO_INPUTS_V5: TresoInputsV5 =
  buildTresoInputsV5FromLegacy(BLANK_TRESO_INPUTS_LEGACY);

const DEFAULT_STATE: TresoState = {
  inputsV5: DEFAULT_TRESO_INPUTS_V5,
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
  const inputsV5 =
    raw.inputsV5 ??
    (raw.inputsV4 ? buildTresoInputsV5FromV4(raw.inputsV4) : undefined) ??
    (raw.inputsV3 ? buildTresoInputsV5FromV3(raw.inputsV3) : undefined) ??
    (raw.inputsV2 ? buildTresoInputsV5FromV2(raw.inputsV2) : undefined) ??
    (legacyWithEmbeddedV2?.v2 ? buildTresoInputsV5FromV2(legacyWithEmbeddedV2.v2) : undefined) ??
    buildTresoInputsV5FromLegacy(legacyInputs);
  return {
    inputsV5,
    projectionVisible: false,
    projectionMode: 'resume',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TresoStateResult {
  state: TresoState;
  hydrated: boolean;

  // Handlers globaux
  setInputsV5: (nextInputs: TresoInputsV5) => void;
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
        inputsV5: state.inputsV5,
      };
      sessionStorage.setItem(STORE_KEY, JSON.stringify(persisted));
    } catch {
      // sessionStorage plein ou indisponible
    }
  }, [hydrated, state.inputsV5]);

  // ── Listener reset ────────────────────────────────────────────────────────
  useEffect(() => {
    return onResetEvent(({ simId }) => {
      if (simId !== 'tresorerie-societe') return;
      setState(DEFAULT_STATE);
      try { sessionStorage.removeItem(STORE_KEY); } catch { /* noop */ }
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setInputsV5 = useCallback((nextInputs: TresoInputsV5) => {
    setState(s => ({ ...s, inputsV5: nextInputs }));
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
    setInputsV5,
    setProjectionVisible,
    setProjectionMode,
  };
}
