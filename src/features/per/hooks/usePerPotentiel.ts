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
  PerHistoricalBasis,
} from '../../../engine/per';
import type { FiscalContext } from '../../../hooks/useFiscalContext';
import { getAvisReferenceYears, getPerWorkflowYears } from '../utils/perWorkflowYears';

const SESSION_KEY = 'ser1:sim:per:potentiel:v2';

export type PerMode = 'versement-n' | 'declaration-n1';
export type WizardStep = 1 | 2 | 3 | 4 | 5;
export type PerDeclarantScope = 'revenus-n1' | 'projection-n';

export interface PerPotentielState {
  step: WizardStep;
  mode: PerMode | null;
  historicalBasis: PerHistoricalBasis | null;
  needsCurrentYearEstimate: boolean;
  avisIr: AvisIrPlafonds | null;
  avisIr2: AvisIrPlafonds | null;
  situationFamiliale: 'celibataire' | 'marie';
  nombreParts: number;
  isole: boolean;
  revenusN1Declarant1: DeclarantRevenus;
  revenusN1Declarant2: DeclarantRevenus;
  projectionNDeclarant1: DeclarantRevenus;
  projectionNDeclarant2: DeclarantRevenus;
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

function makeDefaultState(): PerPotentielState {
  return {
    step: 1,
    mode: null,
    historicalBasis: null,
    needsCurrentYearEstimate: false,
    avisIr: null,
    avisIr2: null,
    situationFamiliale: 'celibataire',
    nombreParts: 1,
    isole: false,
    revenusN1Declarant1: { ...EMPTY_DECLARANT },
    revenusN1Declarant2: { ...EMPTY_DECLARANT },
    projectionNDeclarant1: { ...EMPTY_DECLARANT },
    projectionNDeclarant2: { ...EMPTY_DECLARANT },
    versementEnvisage: 0,
    mutualisationConjoints: false,
  };
}

function loadSession(): PerPotentielState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PerPotentielState>;
    if (!parsed || typeof parsed !== 'object' || !('historicalBasis' in parsed)) {
      return null;
    }
    return {
      ...makeDefaultState(),
      ...parsed,
      revenusN1Declarant1: { ...EMPTY_DECLARANT, ...parsed.revenusN1Declarant1 },
      revenusN1Declarant2: { ...EMPTY_DECLARANT, ...parsed.revenusN1Declarant2 },
      projectionNDeclarant1: { ...EMPTY_DECLARANT, ...parsed.projectionNDeclarant1 },
      projectionNDeclarant2: { ...EMPTY_DECLARANT, ...parsed.projectionNDeclarant2 },
    };
  } catch {
    return null;
  }
}

function saveSession(state: PerPotentielState): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function buildSituationInput(
  state: PerPotentielState,
  scope: PerDeclarantScope,
  isCouple: boolean,
): PerPotentielInput['situationFiscale'] {
  const declarant1 = scope === 'revenus-n1' ? state.revenusN1Declarant1 : state.projectionNDeclarant1;
  const declarant2 = scope === 'revenus-n1' ? state.revenusN1Declarant2 : state.projectionNDeclarant2;

  return {
    situationFamiliale: state.situationFamiliale,
    nombreParts: state.nombreParts,
    isole: state.isole,
    declarant1,
    declarant2: isCouple ? declarant2 : undefined,
  };
}

function buildVisibleSteps(
  mode: PerMode | null,
  needsCurrentYearEstimate: boolean,
): WizardStep[] {
  if (!mode) {
    return [1];
  }

  if (mode === 'declaration-n1') {
    return [1, 2, 3, 5];
  }

  return needsCurrentYearEstimate ? [1, 2, 3, 4, 5] : [1, 2, 3, 5];
}

export interface UsePerPotentielReturn {
  state: PerPotentielState;
  result: PerPotentielResult | null;
  baseResult: PerPotentielResult | null;
  visibleSteps: WizardStep[];
  setMode: (_mode: PerMode) => void;
  setHistoricalBasis: (_basis: PerHistoricalBasis) => void;
  setNeedsCurrentYearEstimate: (_value: boolean) => void;
  updateAvisIr: (_patch: Partial<AvisIrPlafonds>, _decl?: 1 | 2) => void;
  updateSituation: (_patch: Partial<Pick<PerPotentielState, 'situationFamiliale' | 'nombreParts' | 'isole' | 'mutualisationConjoints'>>) => void;
  updateDeclarant: (_scope: PerDeclarantScope, _decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
  setVersementEnvisage: (_v: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (_s: WizardStep) => void;
  reset: () => void;
  canGoNext: boolean;
  isCouple: boolean;
}

export function usePerPotentiel(fiscalContext: FiscalContext): UsePerPotentielReturn {
  const [state, setState] = useState<PerPotentielState>(() => loadSession() ?? makeDefaultState());
  const years = useMemo(() => getPerWorkflowYears(fiscalContext), [fiscalContext]);
  const visibleSteps = useMemo(
    () => buildVisibleSteps(state.mode, state.needsCurrentYearEstimate),
    [state.mode, state.needsCurrentYearEstimate],
  );

  const persist = useCallback((next: PerPotentielState) => {
    setState(next);
    saveSession(next);
  }, []);

  const setMode = useCallback((mode: PerMode) => {
    const nextBasis = mode === 'declaration-n1'
      ? 'previous-avis-plus-n1'
      : state.historicalBasis ?? 'previous-avis-plus-n1';
    const nextNeedsEstimate = mode === 'declaration-n1'
      ? false
      : state.needsCurrentYearEstimate;

    persist({
      ...state,
      mode,
      step: 1,
      historicalBasis: nextBasis,
      needsCurrentYearEstimate: nextNeedsEstimate,
    });
  }, [state, persist]);

  const setHistoricalBasis = useCallback((historicalBasis: PerHistoricalBasis) => {
    persist({
      ...state,
      historicalBasis,
      step: 1,
      avisIr: null,
      avisIr2: null,
    });
  }, [state, persist]);

  const setNeedsCurrentYearEstimate = useCallback((needsCurrentYearEstimate: boolean) => {
    persist({ ...state, needsCurrentYearEstimate, step: 1 });
  }, [state, persist]);

  const updateAvisIr = useCallback((patch: Partial<AvisIrPlafonds>, decl: 1 | 2 = 1) => {
    const key: 'avisIr' | 'avisIr2' = decl === 1 ? 'avisIr' : 'avisIr2';
    const basis = state.mode === 'declaration-n1'
      ? 'previous-avis-plus-n1'
      : state.historicalBasis ?? 'previous-avis-plus-n1';
    const avisContext = getAvisReferenceYears(years, basis);
    const current = state[key] ?? {
      nonUtiliseAnnee1: 0,
      nonUtiliseAnnee2: 0,
      nonUtiliseAnnee3: 0,
      plafondCalcule: 0,
      anneeRef: avisContext.incomeYear,
    };
    persist({ ...state, [key]: { ...current, ...patch, anneeRef: current.anneeRef || avisContext.incomeYear } });
  }, [state, persist, years]);

  const updateSituation = useCallback((patch: Partial<Pick<PerPotentielState, 'situationFamiliale' | 'nombreParts' | 'isole' | 'mutualisationConjoints'>>) => {
    persist({ ...state, ...patch });
  }, [state, persist]);

  const updateDeclarant = useCallback((scope: PerDeclarantScope, decl: 1 | 2, patch: Partial<DeclarantRevenus>) => {
    const key: 'revenusN1Declarant1' | 'revenusN1Declarant2' | 'projectionNDeclarant1' | 'projectionNDeclarant2' = scope === 'revenus-n1'
      ? (decl === 1 ? 'revenusN1Declarant1' : 'revenusN1Declarant2')
      : (decl === 1 ? 'projectionNDeclarant1' : 'projectionNDeclarant2');
    persist({ ...state, [key]: { ...state[key], ...patch } });
  }, [state, persist]);

  const setVersementEnvisage = useCallback((v: number) => {
    persist({ ...state, versementEnvisage: v });
  }, [state, persist]);

  const isCouple = state.situationFamiliale === 'marie';
  const currentIndex = visibleSteps.indexOf(state.step);

  const nextStep = useCallback(() => {
    const next = visibleSteps[Math.min(currentIndex + 1, visibleSteps.length - 1)];
    persist({ ...state, step: next });
  }, [state, persist, visibleSteps, currentIndex]);

  const prevStep = useCallback(() => {
    const prev = visibleSteps[Math.max(currentIndex - 1, 0)];
    persist({ ...state, step: prev });
  }, [state, persist, visibleSteps, currentIndex]);

  const goToStep = useCallback((step: WizardStep) => {
    if (!visibleSteps.includes(step)) {
      return;
    }
    persist({ ...state, step });
  }, [state, persist, visibleSteps]);

  const reset = useCallback(() => {
    const fresh = makeDefaultState();
    setState(fresh);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const canGoNext = useMemo(() => {
    if (state.step !== 1) {
      return true;
    }

    if (!state.mode) {
      return false;
    }

    if (state.mode === 'versement-n') {
      return state.historicalBasis !== null;
    }

    return true;
  }, [state.step, state.mode, state.historicalBasis]);

  const buildInput = useCallback((useProjection: boolean): PerPotentielInput | null => {
    if (!state.mode) {
      return null;
    }

    const historicalBasis = state.mode === 'declaration-n1'
      ? 'previous-avis-plus-n1'
      : state.historicalBasis;

    if (!historicalBasis) {
      return null;
    }

    return {
      mode: state.mode,
      historicalBasis,
      anneeRef: years.currentTaxYear,
      situationFiscale: buildSituationInput(state, 'revenus-n1', isCouple),
      projectionFiscale: useProjection
        ? buildSituationInput(state, 'projection-n', isCouple)
        : undefined,
      avisIr: state.avisIr ?? undefined,
      avisIr2: state.avisIr2 ?? undefined,
      versementEnvisage: state.versementEnvisage > 0 ? state.versementEnvisage : undefined,
      mutualisationConjoints: state.mutualisationConjoints,
      passHistory: fiscalContext.passHistoryByYear,
      taxSettings: fiscalContext._raw_tax,
      psSettings: fiscalContext._raw_ps,
    };
  }, [state, years.currentTaxYear, isCouple, fiscalContext]);

  const baseResult = useMemo((): PerPotentielResult | null => {
    if (state.step < 3) {
      return null;
    }

    const input = buildInput(false);
    if (!input) {
      return null;
    }

    try {
      return calculatePerPotentiel(input);
    } catch {
      return null;
    }
  }, [state.step, buildInput]);

  const result = useMemo((): PerPotentielResult | null => {
    if (state.step < 3) {
      return null;
    }

    const shouldUseProjection = state.mode === 'versement-n'
      && (state.historicalBasis === 'current-avis' || state.needsCurrentYearEstimate);
    const input = buildInput(shouldUseProjection);
    if (!input) {
      return null;
    }

    try {
      return calculatePerPotentiel(input);
    } catch {
      return null;
    }
  }, [state.step, state.mode, state.historicalBasis, state.needsCurrentYearEstimate, buildInput]);

  return {
    state,
    result,
    baseResult,
    visibleSteps,
    setMode,
    setHistoricalBasis,
    setNeedsCurrentYearEstimate,
    updateAvisIr,
    updateSituation,
    updateDeclarant,
    setVersementEnvisage,
    nextStep,
    prevStep,
    goToStep,
    reset,
    canGoNext,
    isCouple,
  };
}
