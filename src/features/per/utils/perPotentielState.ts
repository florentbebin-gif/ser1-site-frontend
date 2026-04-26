import type {
  AvisIrPlafonds,
  DeclarantRevenus,
  PerHistoricalBasis,
  PerPotentielInput,
} from '@/engine/per';
import type { PerChildDraft } from './perParts';
import { getNextPerChildId, normalizePerChildren, normalizePerFoyer } from './perFoyerState';
import { applyPerSimplifiedPreset } from './perSimplifiedMode';
import { buildVisibleSteps } from './perVisibleSteps';

export const PER_POTENTIEL_SESSION_KEY = 'ser1:sim:per:potentiel:v4';

export type PerMode = 'versement-n' | 'declaration-n1';
export type WizardStep = 1 | 2 | 3 | 4;
export type PerDeclarantScope = 'revenus-n1' | 'projection-n';
export type PerDeclarantPatch = { decl: 1 | 2; patch: Partial<DeclarantRevenus> };
export type PerSituationPatch = Partial<{
  situationFamiliale: 'celibataire' | 'marie';
  isole: boolean;
  mutualisationConjoints: boolean;
}>;

export interface PerPotentielStateOptions {
  simplifiedMode?: boolean;
}

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

export const EMPTY_DECLARANT: DeclarantRevenus = {
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

export function normalizePerPotentielState(
  state: PerPotentielState,
  options: PerPotentielStateOptions = {},
): PerPotentielState {
  const baseState = options.simplifiedMode ? applyPerSimplifiedPreset(state) : state;
  const visibleSteps = buildVisibleSteps(
    baseState.mode,
    baseState.historicalBasis,
    baseState.needsCurrentYearEstimate,
  );
  const fallbackStep = visibleSteps[visibleSteps.length - 1] ?? 1;
  const step = visibleSteps.includes(baseState.step) ? baseState.step : fallbackStep;
  const foyer = normalizePerFoyer({
    situationFamiliale: baseState.situationFamiliale,
    isole: baseState.isole,
    children: baseState.children,
    mutualisationConjoints: baseState.mutualisationConjoints,
  });
  const projectionFoyer = baseState.projectionFoyerEdited
    ? normalizePerFoyer({
      situationFamiliale: baseState.projectionSituationFamiliale,
      isole: baseState.projectionIsole,
      children: baseState.projectionChildren,
      mutualisationConjoints: baseState.projectionMutualisationConjoints,
    })
    : foyer;

  return {
    ...baseState,
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

export function makeDefaultPerPotentielState(
  options: PerPotentielStateOptions = {},
): PerPotentielState {
  return normalizePerPotentielState({
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
  }, options);
}

export function loadPerPotentielSession(
  options: PerPotentielStateOptions = {},
): PerPotentielState | null {
  try {
    const raw = sessionStorage.getItem(PER_POTENTIEL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PerPotentielState>;
    if (!parsed || typeof parsed !== 'object' || !('historicalBasis' in parsed)) {
      return null;
    }

    return normalizePerPotentielState({
      ...makeDefaultPerPotentielState(options),
      ...parsed,
      revenusN1Declarant1: { ...EMPTY_DECLARANT, ...parsed.revenusN1Declarant1 },
      revenusN1Declarant2: { ...EMPTY_DECLARANT, ...parsed.revenusN1Declarant2 },
      projectionNDeclarant1: { ...EMPTY_DECLARANT, ...parsed.projectionNDeclarant1 },
      projectionNDeclarant2: { ...EMPTY_DECLARANT, ...parsed.projectionNDeclarant2 },
      children: normalizePerChildren(parsed.children),
      projectionChildren: normalizePerChildren(parsed.projectionChildren),
    }, options);
  } catch {
    return null;
  }
}

export function savePerPotentielSession(state: PerPotentielState): void {
  try {
    sessionStorage.setItem(PER_POTENTIEL_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function clearPerPotentielSession(): void {
  try {
    sessionStorage.removeItem(PER_POTENTIEL_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function buildPerSituationInput(
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

export function nextPerChildId(children: PerChildDraft[]): number {
  return getNextPerChildId(children);
}
