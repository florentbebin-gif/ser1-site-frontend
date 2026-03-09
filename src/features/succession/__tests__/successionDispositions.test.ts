import { describe, expect, it } from 'vitest';
import { canOpenDispositions } from '../successionDispositions';
import type { FamilyMember, SuccessionEnfant } from '../successionDraft';

describe('canOpenDispositions', () => {
  it('returns false for a solo situation without family context', () => {
    expect(canOpenDispositions('celibataire', [], [])).toBe(false);
    expect(canOpenDispositions('veuf', [], [])).toBe(false);
    expect(canOpenDispositions('divorce', [], [])).toBe(false);
  });

  it('returns true for a solo situation with at least one child', () => {
    const enfants: SuccessionEnfant[] = [{ id: 'E1', rattachement: 'commun' }];

    expect(canOpenDispositions('celibataire', enfants, [])).toBe(true);
  });

  it('returns true for a solo situation with at least one family member', () => {
    const familyMembers: FamilyMember[] = [{ id: 'P1', type: 'parent', branch: 'epoux1' }];

    expect(canOpenDispositions('veuf', [], familyMembers)).toBe(true);
  });

  it('returns true for couple situations even before descendants are declared', () => {
    expect(canOpenDispositions('marie', [], [])).toBe(true);
    expect(canOpenDispositions('pacse', [], [])).toBe(true);
    expect(canOpenDispositions('concubinage', [], [])).toBe(true);
  });
});
