export { default } from './PrevoyancePage';
export {
  PREVOYANCE_STORAGE_KEY,
  parsePersistedPrevoyanceState,
  type PersistedPrevoyanceState,
} from './persistence';
export { computeDecesCapitalFromContract } from '@/domain/prevoyance/helpers';
export type { PrevoyanceContractDraft, PrevoyanceSituationDraft } from '@/domain/prevoyance/types';
