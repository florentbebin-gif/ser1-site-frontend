import { describe, expect, it } from 'vitest';

import { MEMENTO_ENTRIES } from '@/domain/settings-memento/entries';
import { MEMENTO_LEXICON_TERMS } from '@/domain/settings-memento/lexicon';

import {
  buildMementoDisplayPlan,
  groupMementoLexiconTerms,
  MEMENTO_DISPLAY_PARTS,
  MEMENTO_LEXICON_PRUDENCE_LABELS,
  MEMENTO_PRUDENCE_LABELS,
  resolveMementoEntryPartId,
} from '../memento/mementoDisplayPlan';

const FORBIDDEN_META_WORDS =
  /\b(?:simulateurs?|settings|couverture|param[eè]tres?|révisable|calculateurs?|moteur|registry)\b/i;

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

  it('présente le droit civil comme un aide-mémoire, sans méta-discours', () => {
    const partie = buildMementoDisplayPlan().find(
      (candidate) => candidate.definition.id === 'droit-civil',
    );
    if (!partie) throw new Error('Partie Droit civil introuvable');

    expect(partie.chapters.map((chapter) => chapter.chapter.id)).toEqual(['foyer', 'civil']);

    const sectionTitles = partie.chapters.flatMap(
      (chapter) => chapter.editorial?.sections?.map((section) => section.title) ?? [],
    );

    expect(sectionTitles).toEqual([
      'Composition familiale',
      'Capacité patrimoniale',
      'Personnes à protéger',
    ]);

    const visibleTexts = partie.chapters.flatMap((chapter) => [
      chapter.chapter.description,
      chapter.editorial?.summary ?? '',
      ...(chapter.editorial?.keyPoints ?? []),
      ...(chapter.editorial?.sections ?? []).flatMap((section) => [section.title, section.body]),
      ...chapter.entries.flatMap((entry) => [entry.label, entry.description]),
    ]);

    for (const text of visibleTexts) {
      expect(text, text).not.toMatch(FORBIDDEN_META_WORDS);
    }
  });

  it('présente la fiscalité comme un aide-mémoire de dispositifs, sans méta-discours', () => {
    const fiscalite = buildMementoDisplayPlan().find((part) => part.definition.id === 'fiscalite');
    if (!fiscalite) throw new Error('Partie Fiscalité introuvable');

    expect(fiscalite.chapters.map((chapter) => chapter.chapter.id)).toEqual([
      'fiscalite-foyer',
      'immobilier',
      'arbitrage',
    ]);

    const sectionTitles = fiscalite.chapters.flatMap(
      (chapter) => chapter.editorial?.sections?.map((section) => section.title) ?? [],
    );

    expect(sectionTitles).toEqual(
      expect.arrayContaining([
        'Revenus et détention',
        'Cession immobilière',
        'Cession ou conservation',
      ]),
    );
    expect(sectionTitles).not.toContain('Impôt sur le revenu');
    expect(sectionTitles).not.toContain('Patrimoine immobilier taxable');

    const visibleTexts = fiscalite.chapters.flatMap((chapter) => [
      chapter.chapter.description,
      chapter.editorial?.summary ?? '',
      ...(chapter.editorial?.keyPoints ?? []),
      ...(chapter.editorial?.sections ?? []).flatMap((section) => [section.title, section.body]),
      ...chapter.entries.flatMap((entry) => [entry.label, entry.description]),
    ]);

    for (const text of visibleTexts) {
      expect(text, text).not.toMatch(FORBIDDEN_META_WORDS);
    }
  });

  it('présente les sociétés et placements comme un aide-mémoire, sans méta-discours', () => {
    const partie = buildMementoDisplayPlan().find(
      (candidate) => candidate.definition.id === 'societes-placements',
    );
    if (!partie) throw new Error('Partie Sociétés et placements introuvable');

    expect(partie.chapters.map((chapter) => chapter.chapter.id)).toEqual(['societe', 'placements']);

    const sectionTitles = partie.chapters.flatMap(
      (chapter) => chapter.editorial?.sections?.map((section) => section.title) ?? [],
    );

    expect(sectionTitles).toEqual(
      expect.arrayContaining([
        'Enveloppes de placement',
        'Revenus du capital',
        'Sortie et transmission',
      ]),
    );
    expect(sectionTitles).not.toContain('Impôt sur les sociétés');
    expect(sectionTitles).not.toContain('Distribution et réserves');

    const visibleTexts = partie.chapters.flatMap((chapter) => [
      chapter.chapter.description,
      chapter.editorial?.summary ?? '',
      ...(chapter.editorial?.keyPoints ?? []),
      ...(chapter.editorial?.sections ?? []).flatMap((section) => [section.title, section.body]),
      ...chapter.entries.flatMap((entry) => [entry.label, entry.description]),
    ]);

    for (const text of visibleTexts) {
      expect(text, text).not.toMatch(FORBIDDEN_META_WORDS);
    }
  });

  it('présente successions et libéralités comme un aide-mémoire, sans méta-discours', () => {
    const partie = buildMementoDisplayPlan().find(
      (candidate) => candidate.definition.id === 'successions-liberalites',
    );
    if (!partie) throw new Error('Partie Successions et libéralités introuvable');

    expect(partie.chapters.map((chapter) => chapter.chapter.id)).toEqual([
      'transmission',
      'transmission-entreprise',
    ]);

    const sectionTitles = partie.chapters.flatMap(
      (chapter) => chapter.editorial?.sections?.map((section) => section.title) ?? [],
    );

    expect(sectionTitles).toEqual(
      expect.arrayContaining(['Pacte Dutreil', 'Donation de titres', 'Paiement des droits']),
    );
    expect(sectionTitles).not.toContain('Dévolution et réserve');
    expect(sectionTitles).not.toContain('Droits de mutation');

    const visibleTexts = partie.chapters.flatMap((chapter) => [
      chapter.chapter.description,
      chapter.editorial?.summary ?? '',
      ...(chapter.editorial?.keyPoints ?? []),
      ...(chapter.editorial?.sections ?? []).flatMap((section) => [section.title, section.body]),
      ...chapter.entries.flatMap((entry) => [entry.label, entry.description]),
    ]);

    for (const text of visibleTexts) {
      expect(text, text).not.toMatch(FORBIDDEN_META_WORDS);
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

  it('regroupe le lexique par familles de lecture', () => {
    const groups = groupMementoLexiconTerms(MEMENTO_LEXICON_TERMS);
    const termsByGroup = new Map(
      groups.map((group) => [group.title, group.terms.map((term) => term.term)]),
    );

    expect(groups.map((group) => group.title)).toEqual([
      'Civil et transmission',
      'Fiscalité et placements',
      'Social et retraite',
    ]);
    expect(termsByGroup.get('Civil et transmission')).toEqual(
      expect.arrayContaining(['Acquêts', 'Quotité disponible', 'Soulte']),
    );
    expect(termsByGroup.get('Fiscalité et placements')).toEqual(
      expect.arrayContaining(['Plus-value', 'Retenue à la source']),
    );
    expect(termsByGroup.get('Social et retraite')).toEqual(
      expect.arrayContaining(['PER', 'PER individuel']),
    );
  });
});
