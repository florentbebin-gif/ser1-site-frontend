/**
 * useTresorerieState.ts — State centralisé, handlers et persistance sessionStorage
 *
 * Gère l'état complet du simulateur trésorerie société IS :
 * inputs utilisateur, visibilité de la projection, mode de vue.
 * Persistance : sessionStorage, clé 'ser1:sim:tresorerie-societe'.
 */

import { useCallback, useEffect, useState } from 'react';
import { storageKeyFor, onResetEvent } from '@/utils/reset';
import type { TresoState, TresoPersistedState } from '../types';
import type { TresoInputsV6 } from '@/engine/tresorerie/types';
import { migrateUnknownTresorerieInputsToV6 } from '@/engine/tresorerie/migrations/tresorerieV2Migration';

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const DEFAULT_TRESO_INPUTS_COMPAT = {
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

const BLANK_TRESO_INPUTS_COMPAT = {
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

export const DEFAULT_TRESO_INPUTS_V6: TresoInputsV6 = migrateUnknownTresorerieInputsToV6(
  BLANK_TRESO_INPUTS_COMPAT,
) as TresoInputsV6;

const DEFAULT_STATE: TresoState = {
  inputsV6: DEFAULT_TRESO_INPUTS_V6,
  projectionVisible: false,
  projectionMode: 'resume',
};

const STORE_KEY = storageKeyFor('tresorerie-societe');

// ─── Normalisation chargement ─────────────────────────────────────────────────

export function normalizeTresoreriePersistedState(raw: TresoPersistedState): TresoState {
  const inputsV6 =
    raw.inputsV6 ??
    migrateUnknownTresorerieInputsToV6(raw.inputsV5) ??
    migrateUnknownTresorerieInputsToV6(raw.inputsV4) ??
    migrateUnknownTresorerieInputsToV6(raw.inputsV3) ??
    migrateUnknownTresorerieInputsToV6(raw.inputsV2) ??
    migrateUnknownTresorerieInputsToV6({
      ...DEFAULT_TRESO_INPUTS_COMPAT,
      ...(typeof raw.inputs === 'object' && raw.inputs ? raw.inputs : {}),
    }) ??
    DEFAULT_TRESO_INPUTS_V6;
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
      try {
        sessionStorage.removeItem(STORE_KEY);
      } catch {
        /* noop */
      }
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setInputsV6 = useCallback((nextInputs: TresoInputsV6) => {
    setState((s) => ({ ...s, inputsV6: nextInputs }));
  }, []);

  const setProjectionVisible = useCallback((v: boolean) => {
    setState((s) => ({ ...s, projectionVisible: v }));
  }, []);

  const setProjectionMode = useCallback((v: 'resume' | 'detail') => {
    setState((s) => ({ ...s, projectionMode: v }));
  }, []);

  return {
    state,
    hydrated,
    setInputsV6,
    setProjectionVisible,
    setProjectionMode,
  };
}
