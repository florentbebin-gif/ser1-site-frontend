import { describe, expect, it } from 'vitest';

import { MEMENTO_CHAPTERS, MEMENTO_EDITORIAL } from '../index';

const FORBIDDEN_VALUE_FRAGMENTS = ['17.2', '12.8', '30', '100000', '15932'] as const;
const FORBIDDEN_META_WORDS =
  /\b(?:simulateurs?|settings|couverture|param[eè]tres?|révisable|calculateurs?)\b/i;

function editorialTexts(): string[] {
  return MEMENTO_EDITORIAL.flatMap((entry) => [
    entry.summary,
    ...entry.keyPoints,
    ...(entry.sections ?? []).flatMap((section) => [section.title, section.body]),
  ]);
}

describe('settings-memento — éditorial utilisateur', () => {
  it('couvre chaque chapitre du mémento', () => {
    expect(MEMENTO_EDITORIAL.map((entry) => entry.chapterId)).toEqual(
      MEMENTO_CHAPTERS.map((chapter) => chapter.id),
    );
  });

  it('reste court et structuré pour une lecture utilisateur', () => {
    for (const entry of MEMENTO_EDITORIAL) {
      expect(entry.summary.length, `${entry.chapterId}: résumé trop long`).toBeLessThanOrEqual(150);
      expect(entry.keyPoints, `${entry.chapterId}: repères`).toHaveLength(3);

      for (const point of entry.keyPoints) {
        expect(point.length, `${entry.chapterId}: repère trop long`).toBeLessThanOrEqual(120);
      }

      for (const section of entry.sections ?? []) {
        expect(
          section.title.length,
          `${entry.chapterId}: titre de section trop long`,
        ).toBeLessThanOrEqual(60);
        expect(section.body.length, `${entry.chapterId}: section trop longue`).toBeLessThanOrEqual(
          320,
        );
      }
    }
  });

  it('ne porte aucune valeur fiscale ou sociale chiffrée', () => {
    for (const text of editorialTexts()) {
      expect(text, `Chiffre interdit dans "${text}"`).not.toMatch(/\d/);

      for (const forbidden of FORBIDDEN_VALUE_FRAGMENTS) {
        expect(text, `Fragment interdit ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it('ne parle pas de mécanique interne dans la lecture utilisateur', () => {
    for (const text of editorialTexts()) {
      expect(text, `Vocabulaire méta interdit dans "${text}"`).not.toMatch(FORBIDDEN_META_WORDS);
    }
  });
});
