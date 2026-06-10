import { MEMENTO_FOYER_ENTRIES } from './entriesFoyer';
import type { MementoEntry } from './types';

export const MEMENTO_ENTRIES = [
  ...MEMENTO_FOYER_ENTRIES,
] as const satisfies readonly MementoEntry[];
