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
import type { TresoInputs, TresoInputsV2, TresoInputsV6 } from '../../../engine/tresorerie/types';
import {
  buildTresoInputsV6FromLegacy,
  buildTresoInputsV6FromV2,
  buildTresoInputsV6FromV3,
  buildTresoInputsV6FromV4,
  buildTresoInputsV6FromV5,
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

export const DEFAULT_TRESO_INPUTS_V6: TresoInputsV6 =
  buildTresoInputsV6FromLegacy(BLANK_TRESO_INPUTS_LEGACY);

const DEFAULT_STATE: TresoState = {
  inputsV6: DEFAULT_TRESO_INPUTS_V6,
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
  const inputsV6 =
    raw.inputsV6 ??
    (raw.inputsV5 ? buildTresoInputsV6FromV5(raw.inputsV5) : undefined) ??
    (raw.inputsV4 ? buildTresoInputsV6FromV4(raw.inputsV4) : undefined) ??
    (raw.inputsV3 ? buildTresoInputsV6FromV3(raw.inputsV3) : undefined) ??
    (raw.inputsV2 ? buildTresoInputsV6FromV2(raw.inputsV2) : undefined) ??
    (legacyWithEmbeddedV2?.v2 ? buildTresoInputsV6FromV2(legacyWithEmbeddedV2.v2) : undefined) ??
    buildTresoInputsV6FromLegacy(legacyInputs);
  return {
    inputsV6,
    projectionVisible: false,
    projectionMode: 'resume',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TresoStateResult {
  state: TresoState;
  hydrated: boolean;

  // Handlers globaux
  setInputsV6: (nextInputs: TresoInputsV6) => void;
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
        inputsV6: state.inputsV6,
      };
      sessionStorage.setItem(STORE_KEY, JSON.stringify(persisted));
    } catch {
      // sessionStorage plein ou indisponible
    }
  }, [hydrated, state.inputsV6]);

  // ── Listener reset ────────────────────────────────────────────────────────
  useEffect(() => {
    return onResetEvent(({ simId }) => {
      if (simId !== 'tresorerie-societe') return;
      setState(DEFAULT_STATE);
      try { sessionStorage.removeItem(STORE_KEY); } catch { /* noop */ }
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setInputsV6 = useCallback((nextInputs: TresoInputsV6) => {
    setState(s => ({ ...s, inputsV6: nextInputs }));
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
    setInputsV6,
    setProjectionVisible,
    setProjectionMode,
  };
}
