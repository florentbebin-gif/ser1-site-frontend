import type {
  PrevoyanceContractAggregationMode,
  PrevoyanceContractDraft,
  PrevoyanceDeathTargetDraft,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';
import { storageKeyFor } from '@/utils/reset';

export const PREVOYANCE_STORAGE_KEY = storageKeyFor('prevoyance');

export interface PersistedPrevoyanceState {
  situation?: Partial<PrevoyanceSituationDraft>;
  contracts?: PrevoyanceContractDraft[];
  contractAggregationMode?: PrevoyanceContractAggregationMode;
  deathTarget?: PrevoyanceDeathTargetDraft;
}

type LegacyIndividualContract = Extract<PrevoyanceContractDraft, { kind: 'individuel' }> & {
  cotisation: {
    montantAnnuel: number;
    dontMadelin?: number;
    madelin?: boolean;
  };
};

function clampDontMadelin(dontMadelin: number, montantAnnuel: number): number {
  return Math.min(Math.max(0, Number(dontMadelin) || 0), Math.max(0, Number(montantAnnuel) || 0));
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
    };
  } catch {
    return null;
  }
}
