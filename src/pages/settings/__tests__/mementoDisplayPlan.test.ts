import { describe, expect, it } from 'vitest';

import { MEMENTO_ENTRIES } from '@/domain/settings-memento/entries';
import { MEMENTO_LEXICON_TERMS } from '@/domain/settings-memento/lexicon';

import {
  buildMementoDisplayPlan,
  MEMENTO_DISPLAY_PARTS,
  MEMENTO_LEXICON_PRUDENCE_LABELS,
  MEMENTO_PRUDENCE_LABELS,
  resolveMementoEntryPartId,
} from '../memento/mementoDisplayPlan';

const FORBIDDEN_META_WORDS =
  /\b(?:simulateurs?|settings|couverture|param[eè]tres?|révisable|calculateurs?)\b/i;

function getEntry(key: string) {
  const entry = MEMENTO_ENTRIES.find((candidate) => candidate.key === key);
  if (!entry) throw new Error(`Entrée mémento introuvable : ${key}`);
  return entry;
}

describe('mementoDisplayPlan', () => {
  it('expose le sommaire V8 sans remplacer les chapitres techniques', () => {
    expect(MEMENTO_DISPLAY_PARTS.map((part) => part.title)).toEqual([
      'Chiffres clés et produits réglementés',
      'Droit civil',
      'Fiscalité',
      'Démembrement',
      'Impôt sur les sociétés et placements',
      'Successions et libéralités',
      'Fiscalité internationale',
      'Lexique',
      'Social et protection sociale',
    ]);
  });

  it('classe chaque entrée mémento exactement une fois dans la lecture', () => {
    const plan = buildMementoDisplayPlan();
    const entryKeys = plan.flatMap((part) => [
      ...part.entries.map((entry) => entry.key),
      ...part.chapters.flatMap((chapter) => chapter.entries.map((entry) => entry.key)),
    ]);

    expect(entryKeys).toHaveLength(MEMENTO_ENTRIES.length);
    expect(new Set(entryKeys).size).toBe(MEMENTO_ENTRIES.length);
    expect(new Set(entryKeys)).toEqual(new Set(MEMENTO_ENTRIES.map((entry) => entry.key)));
  });

  it('garde les titres, descriptions et libellés prudence sans chiffre', () => {
    const displayTexts = MEMENTO_DISPLAY_PARTS.flatMap((part) => [part.title, part.description]);
    const prudenceTexts = [
      ...Object.values(MEMENTO_PRUDENCE_LABELS),
      ...Object.values(MEMENTO_LEXICON_PRUDENCE_LABELS),
    ].filter((value): value is string => value !== null);

    expect([...displayTexts, ...prudenceTexts].filter((text) => /\d/.test(text))).toEqual([]);
  });

  it('garde les descriptions du sommaire sans vocabulaire technique interne', () => {
    for (const part of MEMENTO_DISPLAY_PARTS) {
      expect(part.description, part.title).not.toMatch(FORBIDDEN_META_WORDS);
    }
  });

  it('déplace seulement la présentation des entrées transverses', () => {
    expect(resolveMementoEntryPartId(getEntry('patrimoine.demembrement'))).toBe('demembrement');
    expect(resolveMementoEntryPartId(getEntry('fiscalite-foyer.non-residents'))).toBe(
      'fiscalite-internationale',
    );
    expect(resolveMementoEntryPartId(getEntry('transmission.transmission-internationale'))).toBe(
      'fiscalite-internationale',
    );
  });

  it('réserve la partie Lexique aux définitions éditoriales', () => {
    const lexique = buildMementoDisplayPlan().find((part) => part.definition.id === 'lexique');

    expect(lexique?.entries).toHaveLength(0);
    expect(lexique?.chapters).toHaveLength(0);
    expect(lexique?.lexiconTerms).toHaveLength(MEMENTO_LEXICON_TERMS.length);
  });
});
