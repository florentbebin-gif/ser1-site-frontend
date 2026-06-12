import { MEMENTO_FISCALITE_FOYER_ENTRIES } from './entriesFiscaliteFoyer';
import { MEMENTO_FOYER_ENTRIES } from './entriesFoyer';
import { MEMENTO_IMMOBILIER_ENTRIES } from './entriesImmobilier';
import { MEMENTO_PLACEMENTS_ENTRIES } from './entriesPlacements';
import { MEMENTO_DIRIGEANT_ENTRIES } from './entriesDirigeant';
import { MEMENTO_SOCIETE_ENTRIES } from './entriesSociete';
import { MEMENTO_TRANSMISSION_ENTRIES } from './entriesTransmission';
import type { MementoEntry } from './types';

export const MEMENTO_ENTRIES = [
  ...MEMENTO_FOYER_ENTRIES,
  ...MEMENTO_FISCALITE_FOYER_ENTRIES,
  ...MEMENTO_TRANSMISSION_ENTRIES,
  ...MEMENTO_PLACEMENTS_ENTRIES,
  ...MEMENTO_IMMOBILIER_ENTRIES,
  ...MEMENTO_SOCIETE_ENTRIES,
  ...MEMENTO_DIRIGEANT_ENTRIES,
] as const satisfies readonly MementoEntry[];
