import { describe, expect, it } from 'vitest';
import {
  countEffectiveDescendantBranches,
  countLivingEnfants,
  countLivingNonCommuns,
  getEnfantNodeLabel,
} from '../successionEnfants';

describe('successionEnfants', () => {
  it('compte uniquement les enfants vivants', () => {
    const enfants = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'epoux1' as const, deceased: true },
      { id: 'E3', rattachement: 'epoux2' as const },
    ];

    expect(countLivingEnfants(enfants)).toBe(2);
    expect(countLivingNonCommuns(enfants)).toBe(1);
  });

  it('préfixe les enfants décédés avec un signe distinctif', () => {
    expect(getEnfantNodeLabel(0, false)).toBe('E1');
    expect(getEnfantNodeLabel(1, true)).toBe('†E2');
  });

  it('compte les branches représentées par les petits-enfants', () => {
    expect(countEffectiveDescendantBranches(
      [
        { id: 'E1', rattachement: 'commun' as const },
        { id: 'E2', rattachement: 'commun' as const, deceased: true },
      ],
      [{ id: 'PG1', type: 'petit_enfant', parentEnfantId: 'E2' }],
    )).toBe(2);
  });
});
