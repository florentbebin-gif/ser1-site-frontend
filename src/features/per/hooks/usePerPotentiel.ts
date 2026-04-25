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
import type { PerChildDraft } from '../utils/perParts';
import { shouldUseProjectionForCalculation } from '../utils/perProjectionScope';
import { resolvePerCalculationYear } from '../utils/perCalculationYear';
import { projectionToAvisIrPlafonds } from '../utils/perSyntheticAvis';
import { getNextPerChildId, normalizePerChildren, normalizePerFoyer } from '../utils/perFoyerState';
import { buildVisibleSteps } from '../utils/perVisibleSteps';

const SESSION_KEY = 'ser1:sim:per:potentiel:v4';

export type PerMode = 'versement-n' | 'declaration-n1';
export type WizardStep = 1 | 2 | 3 | 4 | 5;
export type PerDeclarantScope = 'revenus-n1' | 'projection-n';
export type PerDeclarantPatch = { decl: 1 | 2; patch: Partial<DeclarantRevenus> };
type PerSituationPatch = Partial<{
  situationFamiliale: 'celibataire' | 'marie';
  isole: boolean;
  mutualisationConjoints: boolean;
}>;

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
  children: PerChildDraft[];
  projectionSituationFamiliale: 'celibataire' | 'marie';
  projectionNombreParts: number;
  projectionIsole: boolean;
  projectionChildren: PerChildDraft[];
  projectionMutualisationConjoints: boolean;
  projectionFoyerEdited: boolean;
  revenusN1Declarant1: DeclarantRevenus;
  revenusN1Declarant2: DeclarantRevenus;
  projectionNDeclarant1: DeclarantRevenus;
  projectionNDeclarant2: DeclarantRevenus;
  versementEnvisage: number;
  mutualisationConjoints: boolean;
}

const EMPTY_DECLARANT: DeclarantRevenus = {
  statutTns: false,
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

function normalizeState(state: PerPotentielState): PerPotentielState {
  const visibleSteps = buildVisibleSteps(state.mode, state.historicalBasis, state.needsCurrentYearEstimate);
  const fallbackStep = visibleSteps[visibleSteps.length - 1] ?? 1;
  const step = visibleSteps.includes(state.step) ? state.step : fallbackStep;
  const foyer = normalizePerFoyer({
    situationFamiliale: state.situationFamiliale,
    isole: state.isole,
    children: state.children,
    mutualisationConjoints: state.mutualisationConjoints,
  });
  const projectionFoyer = state.projectionFoyerEdited
    ? normalizePerFoyer({
      situationFamiliale: state.projectionSituationFamiliale,
      isole: state.projectionIsole,
      children: state.projectionChildren,
      mutualisationConjoints: state.projectionMutualisationConjoints,
    })
    : foyer;

  return {
    ...state,
    step,
    situationFamiliale: foyer.situationFamiliale,
    isole: foyer.isole,
    children: foyer.children,
    mutualisationConjoints: foyer.mutualisationConjoints,
    nombreParts: foyer.nombreParts,
    projectionSituationFamiliale: projectionFoyer.situationFamiliale,
    projectionIsole: projectionFoyer.isole,
    projectionChildren: projectionFoyer.children,
    projectionMutualisationConjoints: projectionFoyer.mutualisationConjoints,
    projectionNombreParts: projectionFoyer.nombreParts,
  };
}

function makeDefaultState(): PerPotentielState {
  return normalizeState({
    step: 1,
    mode: null,
    historicalBasis: null,
    needsCurrentYearEstimate: false,
    avisIr: null,
    avisIr2: null,
    situationFamiliale: 'celibataire',
    nombreParts: 1,
    isole: false,
    children: [],
    projectionSituationFamiliale: 'celibataire',
    projectionNombreParts: 1,
    projectionIsole: false,
    projectionChildren: [],
    projectionMutualisationConjoints: false,
    projectionFoyerEdited: false,
    revenusN1Declarant1: { ...EMPTY_DECLARANT },
    revenusN1Declarant2: { ...EMPTY_DECLARANT },
    projectionNDeclarant1: { ...EMPTY_DECLARANT },
    projectionNDeclarant2: { ...EMPTY_DECLARANT },
    versementEnvisage: 0,
    mutualisationConjoints: false,
  });
}

function loadSession(): PerPotentielState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PerPotentielState>;
    if (!parsed || typeof parsed !== 'object' || !('historicalBasis' in parsed)) {
      return null;
    }
    return normalizeState({
      ...makeDefaultState(),
      ...parsed,
      revenusN1Declarant1: { ...EMPTY_DECLARANT, ...parsed.revenusN1Declarant1 },
      revenusN1Declarant2: { ...EMPTY_DECLARANT, ...parsed.revenusN1Declarant2 },
      projectionNDeclarant1: { ...EMPTY_DECLARANT, ...parsed.projectionNDeclarant1 },
      projectionNDeclarant2: { ...EMPTY_DECLARANT, ...parsed.projectionNDeclarant2 },
      children: normalizePerChildren(parsed.children),
      projectionChildren: normalizePerChildren(parsed.projectionChildren),
    });
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
  forceCouple = false,
): PerPotentielInput['situationFiscale'] {
  const declarant1 = scope === 'revenus-n1' ? state.revenusN1Declarant1 : state.projectionNDeclarant1;
  const declarant2 = scope === 'revenus-n1' ? state.revenusN1Declarant2 : state.projectionNDeclarant2;
  const situationFamiliale = scope === 'revenus-n1'
    ? state.situationFamiliale
    : state.projectionSituationFamiliale;
  const nombreParts = scope === 'revenus-n1'
    ? state.nombreParts
    : state.projectionNombreParts;
  const isole = scope === 'revenus-n1'
    ? state.isole
    : state.projectionIsole;
  const isCouple = situationFamiliale === 'marie' || forceCouple;

  return {
    situationFamiliale,
    nombreParts,
    isole,
    declarant1,
    declarant2: isCouple ? declarant2 : undefined,
  };
}

export interface UsePerPotentielReturn {
  state: PerPotentielState;
  result: PerPotentielResult | null;
  visibleSteps: WizardStep[];
  setMode: (_mode: PerMode) => void;
  setHistoricalBasis: (_basis: PerHistoricalBasis) => void;
  setNeedsCurrentYearEstimate: (_value: boolean) => void;
  updateAvisIr: (_patch: Partial<AvisIrPlafonds>, _decl?: 1 | 2) => void;
  updateSituation: (_patch: PerSituationPatch) => void;
  updateProjectionSituation: (_patch: PerSituationPatch) => void;
  updateDeclarant: (_scope: PerDeclarantScope, _decl: 1 | 2, _patch: Partial<DeclarantRevenus>) => void;
  updateDeclarants: (_scope: PerDeclarantScope, _patches: PerDeclarantPatch[]) => void;
  addChild: () => void;
  addProjectionChild: () => void;
  updateChildMode: (_childId: number, _mode: PerChildDraft['mode']) => void;
  updateProjectionChildMode: (_childId: number, _mode: PerChildDraft['mode']) => void;
  removeChild: (_childId: number) => void;
  removeProjectionChild: (_childId: number) => void;
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
    () => buildVisibleSteps(state.mode, state.historicalBasis, state.needsCurrentYearEstimate),
    [state.mode, state.historicalBasis, state.needsCurrentYearEstimate],
  );

  const persist = useCallback((next: PerPotentielState) => {
    const normalized = normalizeState(next);
    setState(normalized);
    saveSession(normalized);
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

  const updateSituation = useCallback((patch: PerSituationPatch) => {
    persist({ ...state, ...patch });
  }, [state, persist]);

  const updateProjectionSituation = useCallback((patch: PerSituationPatch) => {
    persist({
      ...state,
      projectionFoyerEdited: true,
      projectionSituationFamiliale: patch.situationFamiliale ?? state.projectionSituationFamiliale,
      projectionIsole: patch.isole ?? state.projectionIsole,
      projectionMutualisationConjoints: patch.mutualisationConjoints ?? state.projectionMutualisationConjoints,
    });
  }, [state, persist]);

  const updateDeclarant = useCallback((scope: PerDeclarantScope, decl: 1 | 2, patch: Partial<DeclarantRevenus>) => {
    const key: 'revenusN1Declarant1' | 'revenusN1Declarant2' | 'projectionNDeclarant1' | 'projectionNDeclarant2' = scope === 'revenus-n1'
      ? (decl === 1 ? 'revenusN1Declarant1' : 'revenusN1Declarant2')
      : (decl === 1 ? 'projectionNDeclarant1' : 'projectionNDeclarant2');
    persist({ ...state, [key]: { ...state[key], ...patch } });
  }, [state, persist]);

  const updateDeclarants = useCallback((scope: PerDeclarantScope, patches: PerDeclarantPatch[]) => {
    const next = patches.reduce((acc, { decl, patch }) => {
      const key: 'revenusN1Declarant1' | 'revenusN1Declarant2' | 'projectionNDeclarant1' | 'projectionNDeclarant2' = scope === 'revenus-n1'
        ? (decl === 1 ? 'revenusN1Declarant1' : 'revenusN1Declarant2')
        : (decl === 1 ? 'projectionNDeclarant1' : 'projectionNDeclarant2');

      return {
        ...acc,
        [key]: { ...acc[key], ...patch },
      };
    }, state);

    persist(next);
  }, [state, persist]);

  const addChild = useCallback(() => {
    const nextChild: PerChildDraft = {
      id: getNextPerChildId(state.children),
      mode: 'charge',
    };
    persist({ ...state, children: [...state.children, nextChild] });
  }, [state, persist]);

  const addProjectionChild = useCallback(() => {
    const nextChild: PerChildDraft = {
      id: getNextPerChildId(state.projectionChildren),
      mode: 'charge',
    };
    persist({
      ...state,
      projectionFoyerEdited: true,
      projectionChildren: [...state.projectionChildren, nextChild],
    });
  }, [state, persist]);

  const updateChildMode = useCallback((childId: number, mode: PerChildDraft['mode']) => {
    persist({
      ...state,
      children: state.children.map((child) => (
        child.id === childId
          ? { ...child, mode }
          : child
      )),
    });
  }, [state, persist]);

  const updateProjectionChildMode = useCallback((childId: number, mode: PerChildDraft['mode']) => {
    persist({
      ...state,
      projectionFoyerEdited: true,
      projectionChildren: state.projectionChildren.map((child) => (
        child.id === childId
          ? { ...child, mode }
          : child
      )),
    });
  }, [state, persist]);

  const removeChild = useCallback((childId: number) => {
    persist({
      ...state,
      children: state.children.filter((child) => child.id !== childId),
    });
  }, [state, persist]);

  const removeProjectionChild = useCallback((childId: number) => {
    persist({
      ...state,
      projectionFoyerEdited: true,
      projectionChildren: state.projectionChildren.filter((child) => child.id !== childId),
    });
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

  const buildInput = useCallback((
    useProjection: boolean,
    avisOverride?: Pick<PerPotentielInput, 'avisIr' | 'avisIr2'>,
  ): PerPotentielInput | null => {
    if (!state.mode) {
      return null;
    }

    const historicalBasis = state.mode === 'declaration-n1'
      ? 'previous-avis-plus-n1'
      : state.historicalBasis;

    if (!historicalBasis) {
      return null;
    }

    const forceProjectionCouple = useProjection
      && !state.needsCurrentYearEstimate
      && Boolean(avisOverride?.avisIr2 ?? state.avisIr2);

    return {
      mode: state.mode,
      historicalBasis,
      ...resolvePerCalculationYear({
        step: state.step,
        mode: state.mode,
        historicalBasis,
        useProjection,
        years,
      }),
      situationFiscale: buildSituationInput(state, 'revenus-n1'),
      projectionFiscale: useProjection
        ? buildSituationInput(state, 'projection-n', forceProjectionCouple)
        : undefined,
      avisIr: avisOverride?.avisIr ?? state.avisIr ?? undefined,
      avisIr2: avisOverride?.avisIr2 ?? state.avisIr2 ?? undefined,
      versementEnvisage: state.versementEnvisage > 0 ? state.versementEnvisage : undefined,
      mutualisationConjoints: useProjection
        ? state.projectionMutualisationConjoints
        : state.mutualisationConjoints,
      passHistory: fiscalContext.passHistoryByYear,
      taxSettings: fiscalContext._raw_tax,
      psSettings: fiscalContext._raw_ps,
    };
  }, [state, years, fiscalContext]);

  const result = useMemo((): PerPotentielResult | null => {
    if (state.step < 3) {
      return null;
    }

    const shouldUseProjection = shouldUseProjectionForCalculation({
      step: state.step,
      mode: state.mode,
      historicalBasis: state.historicalBasis,
      needsCurrentYearEstimate: state.needsCurrentYearEstimate,
    });
    try {
      let avisOverride: Pick<PerPotentielInput, 'avisIr' | 'avisIr2'> | undefined;
      if (
        shouldUseProjection &&
        state.mode === 'versement-n' &&
        state.historicalBasis === 'previous-avis-plus-n1'
      ) {
        const revenusInput = buildInput(false);
        if (!revenusInput) {
          return null;
        }

        const revenusResult = calculatePerPotentiel(revenusInput);
        avisOverride = {
          avisIr: projectionToAvisIrPlafonds(
            revenusResult.projectionAvisSuivant.declarant1,
            years.currentIncomeYear,
          ),
          avisIr2: revenusResult.projectionAvisSuivant.declarant2
            ? projectionToAvisIrPlafonds(
              revenusResult.projectionAvisSuivant.declarant2,
              years.currentIncomeYear,
            )
            : undefined,
        };
      }

      const input = buildInput(shouldUseProjection, avisOverride);
      if (!input) {
        return null;
      }

      return calculatePerPotentiel(input);
    } catch {
      return null;
    }
  }, [state.step, state.mode, state.historicalBasis, state.needsCurrentYearEstimate, buildInput, years.currentIncomeYear]);

  return {
    state,
    result,
    visibleSteps,
    setMode,
    setHistoricalBasis,
    setNeedsCurrentYearEstimate,
    updateAvisIr,
    updateSituation,
    updateProjectionSituation,
    updateDeclarant,
    updateDeclarants,
    addChild,
    addProjectionChild,
    updateChildMode,
    updateProjectionChildMode,
    removeChild,
    removeProjectionChild,
    setVersementEnvisage,
    nextStep,
    prevStep,
    goToStep,
    reset,
    canGoNext,
    isCouple,
  };
}
