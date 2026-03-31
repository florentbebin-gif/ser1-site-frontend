/**
 * usePerPotentiel — State management for the "Contrôle du potentiel ER" wizard.
 *
 * Manages wizard steps, form state, and delegates to the PER potentiel engine.
 * Persistence via sessionStorage.
 */

import { useState, useCallback, useMemo } from 'react';
import { calculatePerPotentiel } from '../../../engine/per';
import type {
  PerPotentielInput,
  PerPotentielResult,
  DeclarantRevenus,
  AvisIrPlafonds,
} from '../../../engine/per';
import type { FiscalContext } from '../../../hooks/useFiscalContext';

const SESSION_KEY = 'ser1:sim:per:potentiel:v1';

export type PerMode = 'versement-n' | 'declaration-n1';
export type WizardStep = 1 | 2 | 3 | 4;

export interface PerPotentielState {
  step: WizardStep;
  mode: PerMode | null;
  avisIrConnu: boolean;
  avisIr: AvisIrPlafonds | null;
  avisIr2: AvisIrPlafonds | null;
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  declarant1: DeclarantRevenus;
  declarant2: DeclarantRevenus;
  versementEnvisage: number;
  mutualisationConjoints: boolean;
}

const EMPTY_DECLARANT: DeclarantRevenus = {
  salaires: 0,
  fraisReels: false,
  fraisReelsMontant: 0,
  art62: 0,
  bic: 0,
  retraites: 0,
  fonciersNets: 0,
  autresRevenus: 0,
  cotisationsPer163Q: 0,
  cotisationsPerp: 0,
  cotisationsArt83: 0,
  cotisationsMadelin154bis: 0,
  cotisationsMadelinRetraite: 0,
  abondementPerco: 0,
  cotisationsPrevo: 0,
};

const DEFAULT_STATE: PerPotentielState = {
  step: 1,
  mode: null,
  avisIrConnu: false,
  avisIr: null,
  avisIr2: null,
  situationFamiliale: 'celibataire',
  nombreParts: 1,
  isole: false,
  declarant1: { ...EMPTY_DECLARANT },
  declarant2: { ...EMPTY_DECLARANT },
  versementEnvisage: 0,
  mutualisationConjoints: false,
};

function loadSession(): PerPotentielState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PerPotentielState;
  } catch { return null; }
}

function saveSession(state: PerPotentielState): void {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

export interface UsePerPotentielReturn {
  state: PerPotentielState;
  result: PerPotentielResult | null;
  setMode: (_mode: PerMode) => void;
  setAvisIrConnu: (_v: boolean) => void;
  updateAvisIr: (_patch: Partial<AvisIrPlafonds>, _decl?: 1 | 2) => void;
  updateSituation: (_patch: Partial<Pick<PerPotentielState, 'situationFamiliale' | 'nombreParts' | 'isole' | 'mutualisationConjoints'>>) => void;
  updateDeclarant: (_decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
  setVersementEnvisage: (_v: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (_s: WizardStep) => void;
  reset: () => void;
  canGoNext: boolean;
  showAvisStep: boolean;
  isCouple: boolean;
}

export function usePerPotentiel(fiscalContext: FiscalContext): UsePerPotentielReturn {
  const [state, setState] = useState<PerPotentielState>(() => loadSession() ?? { ...DEFAULT_STATE });

  const persist = useCallback((next: PerPotentielState) => {
    setState(next);
    saveSession(next);
  }, []);

  const setMode = useCallback((mode: PerMode) => {
    persist({ ...state, mode, step: 1 });
  }, [state, persist]);

  const setAvisIrConnu = useCallback((v: boolean) => {
    persist({ ...state, avisIrConnu: v });
  }, [state, persist]);

  const updateAvisIr = useCallback((patch: Partial<AvisIrPlafonds>, decl: 1 | 2 = 1) => {
    const key = decl === 1 ? 'avisIr' : 'avisIr2';
    const current = state[key] ?? { nonUtiliseAnnee1: 0, nonUtiliseAnnee2: 0, nonUtiliseAnnee3: 0, plafondCalcule: 0, anneeRef: new Date().getFullYear() - 1 };
    persist({ ...state, [key]: { ...current, ...patch } });
  }, [state, persist]);

  const updateSituation = useCallback((patch: Partial<Pick<PerPotentielState, 'situationFamiliale' | 'nombreParts' | 'isole' | 'mutualisationConjoints'>>) => {
    persist({ ...state, ...patch });
  }, [state, persist]);

  const updateDeclarant = useCallback((decl: 1 | 2, patch: Partial<DeclarantRevenus>) => {
    const key = decl === 1 ? 'declarant1' : 'declarant2';
    persist({ ...state, [key]: { ...state[key], ...patch } });
  }, [state, persist]);

  const setVersementEnvisage = useCallback((v: number) => {
    persist({ ...state, versementEnvisage: v });
  }, [state, persist]);

  const showAvisStep = state.mode === 'versement-n' && state.avisIrConnu;
  const isCouple = state.situationFamiliale === 'marie';

  const nextStep = useCallback(() => {
    let next = state.step + 1;
    if (state.step === 1 && !showAvisStep) next = 3;
    if (next > 4) next = 4;
    persist({ ...state, step: next as WizardStep });
  }, [state, persist, showAvisStep]);

  const prevStep = useCallback(() => {
    let prev = state.step - 1;
    if (state.step === 3 && !showAvisStep) prev = 1;
    if (prev < 1) prev = 1;
    persist({ ...state, step: prev as WizardStep });
  }, [state, persist, showAvisStep]);

  const goToStep = useCallback((s: WizardStep) => {
    persist({ ...state, step: s });
  }, [state, persist]);

  const reset = useCallback(() => {
    const fresh = { ...DEFAULT_STATE };
    setState(fresh);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* */ }
  }, []);

  const canGoNext = useMemo(() => {
    if (state.step === 1) return state.mode !== null;
    return true;
  }, [state.step, state.mode]);

  const result = useMemo((): PerPotentielResult | null => {
    if (state.step < 3) return null;
    if (!state.mode) return null;

    const input: PerPotentielInput = {
      mode: state.mode,
      anneeRef: new Date().getFullYear(),
      situationFiscale: {
        situationFamiliale: state.situationFamiliale,
        nombreParts: state.nombreParts,
        isole: state.isole,
        declarant1: state.declarant1,
        declarant2: isCouple ? state.declarant2 : undefined,
      },
      avisIr: state.avisIr ?? undefined,
      avisIr2: state.avisIr2 ?? undefined,
      versementEnvisage: state.versementEnvisage > 0 ? state.versementEnvisage : undefined,
      mutualisationConjoints: state.mutualisationConjoints,
      passHistory: fiscalContext.passHistoryByYear,
      taxSettings: fiscalContext._raw_tax,
      psSettings: fiscalContext._raw_ps,
    };

    try {
      return calculatePerPotentiel(input);
    } catch {
      return null;
    }
  }, [state, isCouple, fiscalContext]);

  return {
    state, result,
    setMode, setAvisIrConnu, updateAvisIr,
    updateSituation, updateDeclarant,
    setVersementEnvisage,
    nextStep, prevStep, goToStep, reset,
    canGoNext, showAvisStep, isCouple,
  };
}
