/**
 * usePerPotentiel — State management for the "Contrôle du potentiel ER" wizard.
 *
 * Manages wizard steps, form state, and delegates to the PER potentiel engine.
 * Persistence via sessionStorage.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { calculatePerPotentiel } from '@/engine/per';
import type {
  PerPotentielInput,
  PerPotentielResult,
  DeclarantRevenus,
  AvisIrPlafonds,
  PerHistoricalBasis,
} from '@/engine/per';
import type { FiscalContext } from '@/hooks/useFiscalContext';
import { getAvisReferenceYears, getPerWorkflowYears } from '../utils/perWorkflowYears';
import { hasAvisIrDeclarant } from '../utils/perAvisIrPlafonds';
import type { PerChildDraft } from '../utils/perParts';
import { shouldUseProjectionForCalculation } from '../utils/perProjectionScope';
import { resolvePerCalculationYear } from '../utils/perCalculationYear';
import { projectionToAvisIrPlafonds } from '../utils/perSyntheticAvis';
import { buildVisibleSteps } from '../utils/perVisibleSteps';
import { isPerSimplifiedPresetState } from '../utils/perSimplifiedMode';
import {
  buildPerSituationInput,
  clearPerPotentielSession,
  loadPerPotentielSession,
  makeDefaultPerPotentielState,
  nextPerChildId,
  normalizePerPotentielState,
  savePerPotentielSession,
} from '../utils/perPotentielState';
import type {
  PerDeclarantPatch,
  PerDeclarantScope,
  PerMode,
  PerPotentielState,
  PerSituationPatch,
  WizardStep,
} from '../utils/perPotentielState';

export type {
  PerDeclarantPatch,
  PerDeclarantScope,
  PerMode,
  PerPotentielState,
  PerSituationPatch,
  WizardStep,
} from '../utils/perPotentielState';

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
  goToStep: (_s: WizardStep) => void;
  reset: () => void;
}

export interface UsePerPotentielOptions {
  simplifiedMode?: boolean;
}

export function usePerPotentiel(
  fiscalContext: FiscalContext,
  options: UsePerPotentielOptions = {},
): UsePerPotentielReturn {
  const simplifiedMode = options.simplifiedMode === true;
  const [state, setState] = useState<PerPotentielState>(
    () => loadPerPotentielSession({ simplifiedMode }) ?? makeDefaultPerPotentielState({ simplifiedMode }),
  );
  const years = useMemo(() => getPerWorkflowYears(fiscalContext), [fiscalContext]);
  const visibleSteps = useMemo(
    () => buildVisibleSteps(state.mode, state.historicalBasis, state.needsCurrentYearEstimate),
    [state.mode, state.historicalBasis, state.needsCurrentYearEstimate],
  );

  const persist = useCallback((next: PerPotentielState) => {
    const normalized = normalizePerPotentielState(next, { simplifiedMode });
    setState(normalized);
    savePerPotentielSession(normalized);
  }, [simplifiedMode]);

  useEffect(() => {
    if (!simplifiedMode) {
      return;
    }

    setState((previous) => {
      const normalized = normalizePerPotentielState(previous, { simplifiedMode: true });
      if (isPerSimplifiedPresetState(previous) && previous.step === normalized.step) {
        return previous;
      }
      savePerPotentielSession(normalized);
      return normalized;
    });
  }, [simplifiedMode]);

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
    const couplePatch = decl === 2
      ? {
        situationFamiliale: 'marie' as const,
        projectionSituationFamiliale: 'marie' as const,
        projectionFoyerEdited: true,
      }
      : {};

    persist({
      ...state,
      ...couplePatch,
      [key]: { ...current, ...patch, anneeRef: current.anneeRef || avisContext.incomeYear },
    });
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
      id: nextPerChildId(state.children),
      mode: 'charge',
    };
    persist({ ...state, children: [...state.children, nextChild] });
  }, [state, persist]);

  const addProjectionChild = useCallback(() => {
    const nextChild: PerChildDraft = {
      id: nextPerChildId(state.projectionChildren),
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

  const goToStep = useCallback((step: WizardStep) => {
    if (!visibleSteps.includes(step)) {
      return;
    }
    persist({ ...state, step });
  }, [state, persist, visibleSteps]);

  const reset = useCallback(() => {
    const fresh = makeDefaultPerPotentielState({ simplifiedMode });
    setState(fresh);
    clearPerPotentielSession();
  }, [simplifiedMode]);

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
      && hasAvisIrDeclarant(avisOverride?.avisIr2 ?? state.avisIr2);

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
      situationFiscale: buildPerSituationInput(state, 'revenus-n1'),
      projectionFiscale: useProjection
        ? buildPerSituationInput(state, 'projection-n', forceProjectionCouple)
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
    goToStep,
    reset,
  };
}
