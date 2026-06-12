import { describe, expect, it } from 'vitest';

import {
  MEMENTO_LEXICON_TERMS,
  MEMENTO_LEXICON_SENSITIVITY_VALUES,
  MEMENTO_LEXICON_STATUS_VALUES,
  type MementoLexiconTerm,
  validateMementoLexicon,
} from '../index';

describe('settings-memento — lexique sourcé', () => {
  it('déclare les statuts et sensibilités du lexique', () => {
    expect(MEMENTO_LEXICON_STATUS_VALUES).toEqual(['sourced', 'a_verifier']);
    expect(MEMENTO_LEXICON_SENSITIVITY_VALUES).toEqual([
      'pedagogique',
      'juridique',
      'fiscal',
      'social',
      'calculatoire',
    ]);
  });

  it('valide le lexique réel', () => {
    const result = validateMementoLexicon();

    expect(MEMENTO_LEXICON_TERMS.length).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('s’assure que chaque terme sensible est sourcé ou à vérifier', () => {
    const sensitiveTerms = MEMENTO_LEXICON_TERMS.filter((term) =>
      term.sensitivities.some((sensitivity) =>
        ['juridique', 'fiscal', 'social', 'calculatoire'].includes(sensitivity),
      ),
    );

    expect(sensitiveTerms.length).toBe(MEMENTO_LEXICON_TERMS.length);
    for (const term of sensitiveTerms) {
      expect(['sourced', 'a_verifier']).toContain(term.status);
      if (term.status === 'sourced') {
        expect(term.refIds.length).toBeGreaterThan(0);
      }
    }
  });

  it('refuse les références ou entrées inconnues', () => {
    const invalidTerm = {
      key: 'terme-invalide',
      term: 'Terme invalide',
      shortDefinition: 'Définition interne de test.',
      chapterIds: ['epargne-retraite'],
      sensitivities: ['fiscal'],
      status: 'sourced',
      refIds: ['ref-inconnue'],
      entryKeys: ['epargne-retraite.inconnue'],
    } as unknown as MementoLexiconTerm;
    const result = validateMementoLexicon([invalidTerm]);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        'terme-invalide: refId juridique inconnu (ref-inconnue).',
        'terme-invalide: entrée mémento inconnue (epargne-retraite.inconnue).',
      ]),
    );
    expect(result.ok).toBe(false);
  });
});
