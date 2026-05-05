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
import type {
  TresoInputs,
  DistributionPocketInput,
  CapitalisationPocketInput,
  CreditIsPocketInput,
  CreditIrPocketInput,
  HoldingParticipationInput,
} from '../../../engine/tresorerie/types';

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

export const DEFAULT_TRESO_INPUTS: TresoInputs = {
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

const DEFAULT_STATE: TresoState = {
  inputs: DEFAULT_TRESO_INPUTS,
  projectionVisible: false,
  projectionMode: 'resume',
};

const STORE_KEY = storageKeyFor('tresorerie-societe');

// ─── Normalisation chargement ─────────────────────────────────────────────────

function normalizeLoaded(raw: TresoPersistedState): TresoState {
  const inputs: TresoInputs = {
    ...DEFAULT_TRESO_INPUTS,
    ...(raw.inputs ?? {}),
  };
  return {
    inputs,
    projectionVisible: false,
    projectionMode: 'resume',
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TresoStateResult {
  state: TresoState;
  hydrated: boolean;

  // Handlers globaux
  setInputs: (patch: Partial<TresoInputs>) => void;
  setProjectionVisible: (v: boolean) => void;
  setProjectionMode: (v: 'resume' | 'detail') => void;

  // Handlers poche distribution
  setDistribution: (v: DistributionPocketInput | undefined) => void;
  // Handlers poche capitalisation
  setCapitalisation: (v: CapitalisationPocketInput | undefined) => void;
  // Handlers crédit IS
  setCreditIS: (v: CreditIsPocketInput | undefined) => void;
  // Handlers crédit IR
  setCreditIR: (v: CreditIrPocketInput | undefined) => void;
  // Handlers holding
  setHolding: (v: HoldingParticipationInput | undefined) => void;
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
        setState(normalizeLoaded(parsed));
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
      const persisted: TresoPersistedState = { inputs: state.inputs };
      sessionStorage.setItem(STORE_KEY, JSON.stringify(persisted));
    } catch {
      // sessionStorage plein ou indisponible
    }
  }, [hydrated, state.inputs]);

  // ── Listener reset ────────────────────────────────────────────────────────
  useEffect(() => {
    return onResetEvent(({ simId }) => {
      if (simId !== 'tresorerie-societe') return;
      setState(DEFAULT_STATE);
      try { sessionStorage.removeItem(STORE_KEY); } catch { /* noop */ }
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setInputs = useCallback((patch: Partial<TresoInputs>) => {
    setState(s => ({ ...s, inputs: { ...s.inputs, ...patch } }));
  }, []);

  const setProjectionVisible = useCallback((v: boolean) => {
    setState(s => ({ ...s, projectionVisible: v }));
  }, []);

  const setProjectionMode = useCallback((v: 'resume' | 'detail') => {
    setState(s => ({ ...s, projectionMode: v }));
  }, []);

  const setDistribution = useCallback((v: DistributionPocketInput | undefined) => {
    setState(s => ({ ...s, inputs: { ...s.inputs, distribution: v } }));
  }, []);

  const setCapitalisation = useCallback((v: CapitalisationPocketInput | undefined) => {
    setState(s => ({ ...s, inputs: { ...s.inputs, capitalisation: v } }));
  }, []);

  const setCreditIS = useCallback((v: CreditIsPocketInput | undefined) => {
    setState(s => ({ ...s, inputs: { ...s.inputs, creditIS: v } }));
  }, []);

  const setCreditIR = useCallback((v: CreditIrPocketInput | undefined) => {
    setState(s => ({ ...s, inputs: { ...s.inputs, creditIR: v } }));
  }, []);

  const setHolding = useCallback((v: HoldingParticipationInput | undefined) => {
    setState(s => ({ ...s, inputs: { ...s.inputs, holding: v } }));
  }, []);

  return {
    state,
    hydrated,
    setInputs,
    setProjectionVisible,
    setProjectionMode,
    setDistribution,
    setCapitalisation,
    setCreditIS,
    setCreditIR,
    setHolding,
  };
}
