import { describe, expect, it } from 'vitest';

import { inferAvatarKind } from '../auditLandingMemberUtils';

describe('inferAvatarKind', () => {
  it('déduit l’avatar depuis la civilité sans deviner le genre du prénom', () => {
    expect(inferAvatarKind('enfant', 'monsieur')).toBe('garcon');
    expect(inferAvatarKind('enfant', 'madame')).toBe('fille');
    expect(inferAvatarKind('principal', 'madame')).toBe('femme');
    expect(inferAvatarKind('conjoint', 'monsieur')).toBe('homme');
  });

  it('utilise un fallback stable quand aucune civilité explicite n’existe', () => {
    expect(inferAvatarKind('enfant')).toBe('garcon');
    expect(inferAvatarKind('proche', undefined, 'petit_enfant')).toBe('garcon');
    expect(inferAvatarKind('proche', undefined, 'parent')).toBe('homme');
  });
});
