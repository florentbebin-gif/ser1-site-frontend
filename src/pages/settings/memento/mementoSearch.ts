import { MEMENTO_EDITORIAL_BY_CHAPTER } from '@/domain/settings-memento/editorial';
import type { MementoLexiconTerm } from '@/domain/settings-memento/lexicon';
import type { MementoReferenceValue } from '@/domain/settings-memento/referenceValues';
import type { MementoChapter, MementoEntry } from '@/domain/settings-memento/types';

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
