import { getOptionalLegalReference, type LegalReferenceId } from '@/domain/legal-references';
import { MEMENTO_EDITORIAL_BY_CHAPTER } from '@/domain/settings-memento/editorial';
import type { MementoLexiconTerm } from '@/domain/settings-memento/lexicon';
import type { MementoReferenceValue } from '@/domain/settings-memento/referenceValues';
import type { MementoChapter, MementoEntry } from '@/domain/settings-memento/types';

import { MEMENTO_LEXICON_SOURCE_LABELS, MEMENTO_STATUS_LABELS } from './mementoStatusLabels';

// Plage des diacritiques combinants (accents) à retirer après normalisation NFD.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

/**
 * Normalisation commune des recherches mémento : suppression des accents, minuscules et trim.
 * Source unique réutilisée par la vue lecture, la vue audit et le catalogue contrats.
 */
export function normalizeMementoSearch(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS, '').toLowerCase().trim();
}

/** Vrai si `haystack` contient la requête déjà normalisée. */
export function textMatches(haystack: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return normalizeMementoSearch(haystack).includes(normalizedQuery);
}

/** Texte recherchable d'une entrée mémento (titre + description). */
export function buildMementoEntrySearchText(entry: MementoEntry): string {
  return [entry.label, entry.description].join(' ');
}

interface SourceSearchOptions {
  includeAdminMetadata: boolean;
}

interface EntrySourcesSearchOptions extends SourceSearchOptions {
  visibleSourceRefIds: readonly LegalReferenceId[];
  renderedSectionRefIds?: readonly LegalReferenceId[];
}

function uniqueReferenceIds(refIds: readonly LegalReferenceId[]): LegalReferenceId[] {
  return Array.from(new Set(refIds));
}

function referenceDomain(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}

export function buildLegalReferenceSearchText(
  refIds: readonly LegalReferenceId[],
  options: SourceSearchOptions,
): string {
  return uniqueReferenceIds(refIds)
    .map((refId) => {
      const reference = getOptionalLegalReference(refId);
      if (!reference) return '';

      return [
        options.includeAdminMetadata ? reference.id : '',
        reference.articleOrSection ?? '',
        reference.label,
        reference.sourceType,
        reference.scope,
        referenceDomain(reference.officialUrl),
      ].join(' ');
    })
    .join(' ');
}

/** Texte recherchable de la zone Sources & couverture pour une entrée. */
export function buildMementoEntrySourcesSearchText(
  entry: MementoEntry,
  options: EntrySourcesSearchOptions,
): string {
  const renderedSectionRefIds = options.renderedSectionRefIds ?? [];
  const referenceText = buildLegalReferenceSearchText(
    [...options.visibleSourceRefIds, ...renderedSectionRefIds],
    options,
  );
  const hasVisibleSourceReference = options.visibleSourceRefIds.length > 0;
  const hasRenderedSectionReference = renderedSectionRefIds.length > 0;
  const fallbackText =
    !hasVisibleSourceReference && !hasRenderedSectionReference
      ? entry.claimKeys.length > 0
        ? 'Source rattachée par preuve qualifiée'
        : 'Références à qualifier'
      : '';

  return [
    referenceText,
    fallbackText,
    options.includeAdminMetadata ? MEMENTO_STATUS_LABELS[entry.status] : '',
  ].join(' ');
}

/** Texte recherchable de la zone Sources & couverture pour un terme de lexique. */
export function buildMementoLexiconSourcesSearchText(
  term: MementoLexiconTerm,
  options: SourceSearchOptions,
): string {
  return [
    buildLegalReferenceSearchText(term.refIds, options),
    options.includeAdminMetadata ? MEMENTO_LEXICON_SOURCE_LABELS[term.status] : '',
  ].join(' ');
}

/** Texte recherchable d'un chapitre : libellé, description et tout l'éditorial affiché. */
export function buildMementoChapterSearchText(chapter: MementoChapter): string {
  const editorial = MEMENTO_EDITORIAL_BY_CHAPTER.get(chapter.id);
  const editorialText = editorial
    ? [
        editorial.summary,
        ...editorial.keyPoints,
        ...(editorial.sections ?? []).flatMap((section) => [section.title, section.body]),
      ]
    : [];
  return [chapter.label, chapter.description, ...editorialText].join(' ');
}

/** Texte recherchable d'un terme de lexique (terme + définition courte). */
export function buildMementoLexiconSearchText(term: MementoLexiconTerm): string {
  return [term.term, term.shortDefinition].join(' ');
}

/** Texte recherchable d'une valeur de référence (libellé, note, valeur texte, année). */
export function buildMementoReferenceValueSearchText(value: MementoReferenceValue): string {
  return [
    value.label,
    value.note ?? '',
    value.value_text ?? '',
    value.value_numeric === null ? '' : String(value.value_numeric),
    String(value.year),
  ].join(' ');
}
