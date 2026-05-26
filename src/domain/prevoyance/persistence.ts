import { storageKeyFor } from '@/utils/reset';
import type {
  PrevoyanceContractAggregationMode,
  PrevoyanceContractDraft,
  PrevoyanceDeathTargetDraft,
  PrevoyanceFraisProDraft,
  PrevoyanceIndemnisation,
  PrevoyanceInvaliditePalierDraft,
  PrevoyanceSituationDraft,
} from './types';

export interface FraisGenerauxEstimateState {
  chargesExternes: number;
  loyers: number;
  assurances: number;
  salaires: number;
  amortissements: number;
  fraisBancaires: number;
}

export type FraisGenerauxNumericKey = keyof FraisGenerauxEstimateState;

export const DEFAULT_FRAIS_GENERAUX_ESTIMATE: FraisGenerauxEstimateState = {
  chargesExternes: 0,
  loyers: 0,
  assurances: 0,
  salaires: 0,
  amortissements: 0,
  fraisBancaires: 0,
};

export const PREVOYANCE_STORAGE_KEY = storageKeyFor('prevoyance');

export interface PersistedPrevoyanceState {
  situation?: Partial<PrevoyanceSituationDraft>;
  contracts?: PrevoyanceContractDraft[];
  contractAggregationMode?: PrevoyanceContractAggregationMode;
  deathTarget?: PrevoyanceDeathTargetDraft;
  fraisGenerauxEstimate?: FraisGenerauxEstimateState;
}

type LegacyIndividualContract = Omit<
  Extract<PrevoyanceContractDraft, { kind: 'individuel' }>,
  'invalidite' | 'cotisation' | 'fraisPro'
> & {
  invalidite: {
    indemnisation?: PrevoyanceIndemnisation;
    paliers: PrevoyanceInvaliditePalierDraft[];
  };
  fraisPro?: Partial<PrevoyanceFraisProDraft>;
  cotisation: {
    montantAnnuel: number;
    dontMadelin?: number;
    madelin?: boolean;
  };
};

function clampDontMadelin(dontMadelin: number, montantAnnuel: number): number {
  return Math.min(Math.max(0, Number(dontMadelin) || 0), Math.max(0, Number(montantAnnuel) || 0));
}

function normalizeFraisPro(value: LegacyIndividualContract['fraisPro']): PrevoyanceFraisProDraft {
  const maxDurationYears = Number(value?.maxDurationYears);
  return {
    franchiseDays: Math.max(0, Number(value?.franchiseDays) || 0),
    amount: Math.max(0, Number(value?.amount) || 0),
    maxDurationYears: maxDurationYears === 2 || maxDurationYears === 3 ? maxDurationYears : 1,
  };
}

function normalizeContract(contract: unknown): PrevoyanceContractDraft | null {
  if (!contract || typeof contract !== 'object') return null;
  const draft = contract as PrevoyanceContractDraft | LegacyIndividualContract;
  if (draft.kind === 'collectif') return draft as PrevoyanceContractDraft;
  if (draft.kind !== 'individuel') return null;

  const legacy = draft as LegacyIndividualContract;
  const montantAnnuel = Math.max(0, Number(legacy.cotisation?.montantAnnuel) || 0);
  const rawDontMadelin =
    typeof legacy.cotisation?.dontMadelin === 'number'
      ? legacy.cotisation.dontMadelin
      : legacy.cotisation?.madelin
        ? montantAnnuel
        : 0;

  return {
    ...legacy,
    invalidite: {
      ...legacy.invalidite,
      indemnisation: legacy.invalidite?.indemnisation ?? legacy.indemnisation,
      paliers: legacy.invalidite?.paliers ?? [],
    },
    fraisPro: normalizeFraisPro(legacy.fraisPro),
    cotisation: {
      montantAnnuel,
      dontMadelin: clampDontMadelin(rawDontMadelin, montantAnnuel),
    },
  };
}

function normalizeAggregationMode(value: unknown): PrevoyanceContractAggregationMode {
  return value === 'cumulate' ? 'cumulate' : 'compare';
}

function normalizeDeathTarget(value: unknown): PrevoyanceDeathTargetDraft | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const draft = value as Partial<PrevoyanceDeathTargetDraft>;
  const multiple = draft.multiple === 1 || draft.multiple === 5 ? draft.multiple : 3;
  return {
    mode: draft.mode === 'manual' ? 'manual' : 'multiple',
    multiple,
    manualAmount: Math.max(0, Number(draft.manualAmount) || 0),
  };
}

function normalizeFraisGenerauxEstimate(value: unknown): FraisGenerauxEstimateState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const draft = value as Partial<Record<FraisGenerauxNumericKey, unknown>>;
  return (Object.keys(DEFAULT_FRAIS_GENERAUX_ESTIMATE) as FraisGenerauxNumericKey[]).reduce(
    (acc, key) => ({ ...acc, [key]: Math.max(0, Number(draft[key]) || 0) }),
    { ...DEFAULT_FRAIS_GENERAUX_ESTIMATE },
  );
}

export function parsePersistedPrevoyanceState(raw: string | null): PersistedPrevoyanceState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedPrevoyanceState;
    return {
      situation: parsed.situation && typeof parsed.situation === 'object' ? parsed.situation : {},
      contracts: Array.isArray(parsed.contracts)
        ? parsed.contracts
            .map(normalizeContract)
            .filter((contract): contract is PrevoyanceContractDraft => contract !== null)
        : [],
      contractAggregationMode: normalizeAggregationMode(parsed.contractAggregationMode),
      deathTarget: normalizeDeathTarget(parsed.deathTarget),
      fraisGenerauxEstimate: normalizeFraisGenerauxEstimate(parsed.fraisGenerauxEstimate),
    };
  } catch {
    return null;
  }
}
