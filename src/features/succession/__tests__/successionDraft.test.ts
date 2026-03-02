import { describe, expect, it } from 'vitest';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  parseSuccessionDraftPayload,
} from '../successionDraft';

describe('successionDraft', () => {
  it('serialise et parse un draft valide', () => {
    const payload = buildSuccessionDraftPayload(
      {
        actifNetSuccession: 420000,
        heritiers: [
          { lien: 'enfant', partSuccession: 210000 },
          { lien: 'enfant', partSuccession: 210000 },
        ],
      },
      {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
        pacsConvention: 'separation',
      },
    );

    const parsed = parseSuccessionDraftPayload(JSON.stringify(payload));
    expect(parsed).not.toBeNull();
    expect(parsed?.form.actifNetSuccession).toBe(420000);
    expect(parsed?.form.heritiers).toHaveLength(2);
    expect(parsed?.civil.situationMatrimoniale).toBe('marie');
    expect(parsed?.civil.regimeMatrimonial).toBe('communaute_legale');
  });

  it('retourne null sur JSON invalide', () => {
    expect(parseSuccessionDraftPayload('not-json')).toBeNull();
  });

  it('fallback sur un héritier par défaut et contexte civil par défaut', () => {
    const raw = JSON.stringify({
      version: 1,
      form: {
        actifNetSuccession: 100000,
        heritiers: [],
      },
      civil: {},
    });

    const parsed = parseSuccessionDraftPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.form.heritiers).toEqual([{ lien: 'enfant', partSuccession: 0 }]);
    expect(parsed?.civil).toEqual(DEFAULT_SUCCESSION_CIVIL_CONTEXT);
  });
});
