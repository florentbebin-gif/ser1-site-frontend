import type {
  SuccessionAssuranceVieEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft.types';

interface HasSuccessionPatrimoineSignificatifInput {
  displayActifNetSuccession: number;
  assuranceVieEntries: Array<Pick<SuccessionAssuranceVieEntry, 'capitauxDeces'>>;
  perEntries: Array<Pick<SuccessionPerEntry, 'capitauxDeces'>>;
  prevoyanceDecesEntries: Array<Pick<SuccessionPrevoyanceDecesEntry, 'capitalDeces'>>;
}

export function hasSuccessionPatrimoineSignificatif({
  displayActifNetSuccession,
  assuranceVieEntries,
  perEntries,
  prevoyanceDecesEntries,
}: HasSuccessionPatrimoineSignificatifInput): boolean {
  return (
    displayActifNetSuccession > 0 ||
    assuranceVieEntries.some((entry) => entry.capitauxDeces > 0) ||
    perEntries.some((entry) => entry.capitauxDeces > 0) ||
    prevoyanceDecesEntries.some((entry) => entry.capitalDeces > 0)
  );
}
