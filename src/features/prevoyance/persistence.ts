import type { PrevoyanceContractDraft, PrevoyanceSituationDraft } from '@/domain/prevoyance/types';
import { storageKeyFor } from '@/utils/reset';

export const PREVOYANCE_STORAGE_KEY = storageKeyFor('prevoyance');

export interface PersistedPrevoyanceState {
  situation?: Partial<PrevoyanceSituationDraft>;
  contracts?: PrevoyanceContractDraft[];
}

export function parsePersistedPrevoyanceState(raw: string | null): PersistedPrevoyanceState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedPrevoyanceState;
    return {
      situation: parsed.situation && typeof parsed.situation === 'object' ? parsed.situation : {},
      contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
    };
  } catch {
    return null;
  }
}
