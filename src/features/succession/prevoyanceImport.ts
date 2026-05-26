import {
  computeDecesCapitalFromContract,
  parsePersistedPrevoyanceState,
  PREVOYANCE_STORAGE_KEY,
  type PrevoyanceContractDraft,
  type PersistedPrevoyanceState,
} from '@/domain/prevoyance';
import type { SuccessionPrevoyanceDecesEntry } from './successionDraft.types';

export const PREVOYANCE_IMPORT_ID_PREFIX = 'prevoyance-';

interface PrevoyanceSuccessionAdapterInput {
  contract: PrevoyanceContractDraft;
  souscripteur: SuccessionPrevoyanceDecesEntry['souscripteur'];
  assure: SuccessionPrevoyanceDecesEntry['assure'];
  annualBase: number;
}

interface PrevoyanceStorageLike {
  getItem: (_key: string) => string | null;
}

interface ImportPrevoyanceEntriesInput {
  existingEntries: SuccessionPrevoyanceDecesEntry[];
  souscripteur: SuccessionPrevoyanceDecesEntry['souscripteur'];
  assure: SuccessionPrevoyanceDecesEntry['assure'];
  storage?: PrevoyanceStorageLike;
}

interface ImportPrevoyanceEntriesResult {
  entries: SuccessionPrevoyanceDecesEntry[];
  importedCount: number;
  foundDraft: boolean;
}

function resolveAnnualBase(
  state: PersistedPrevoyanceState,
  contract: PrevoyanceContractDraft,
): number {
  if (contract.kind === 'collectif') return state.situation?.salaireBrutAnnuel ?? 0;
  return state.situation?.revenuImposable ?? 0;
}

export function buildPrevoyanceSuccessionEntry({
  contract,
  souscripteur,
  assure,
  annualBase,
}: PrevoyanceSuccessionAdapterInput): SuccessionPrevoyanceDecesEntry {
  return {
    id: `${PREVOYANCE_IMPORT_ID_PREFIX}${contract.id}`,
    souscripteur,
    assure,
    capitalDeces: computeDecesCapitalFromContract(contract, annualBase),
    dernierePrime: contract.kind === 'individuel' ? contract.cotisation.montantAnnuel : 0,
    clauseBeneficiaire: undefined,
  };
}

export function isPrevoyanceImportedEntry(entry: SuccessionPrevoyanceDecesEntry): boolean {
  return entry.id.startsWith(PREVOYANCE_IMPORT_ID_PREFIX);
}

export function buildPrevoyanceSuccessionEntriesFromState(
  state: PersistedPrevoyanceState,
  souscripteur: SuccessionPrevoyanceDecesEntry['souscripteur'],
  assure: SuccessionPrevoyanceDecesEntry['assure'],
): SuccessionPrevoyanceDecesEntry[] {
  return (state.contracts ?? [])
    .map((contract) =>
      buildPrevoyanceSuccessionEntry({
        contract,
        souscripteur,
        assure,
        annualBase: resolveAnnualBase(state, contract),
      }),
    )
    .filter((entry) => entry.capitalDeces > 0);
}

export function importPrevoyanceEntriesFromStorage({
  existingEntries,
  souscripteur,
  assure,
  storage = typeof sessionStorage === 'undefined' ? undefined : sessionStorage,
}: ImportPrevoyanceEntriesInput): ImportPrevoyanceEntriesResult {
  if (!storage) {
    return { entries: existingEntries, importedCount: 0, foundDraft: false };
  }

  try {
    const state = parsePersistedPrevoyanceState(storage.getItem(PREVOYANCE_STORAGE_KEY));
    if (!state) {
      return { entries: existingEntries, importedCount: 0, foundDraft: false };
    }

    const importedEntries = buildPrevoyanceSuccessionEntriesFromState(state, souscripteur, assure);
    const manualEntries = existingEntries.filter((entry) => !isPrevoyanceImportedEntry(entry));

    return {
      entries: [...manualEntries, ...importedEntries],
      importedCount: importedEntries.length,
      foundDraft: true,
    };
  } catch {
    return { entries: existingEntries, importedCount: 0, foundDraft: false };
  }
}
