import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  buildSuccessionAssetOwnerOptions,
  buildSuccessionAssetPocketOptions,
  getSuccessionAssetPocketFromOwner,
  getSuccessionLegacyOwnerFromPocket,
  getSuccessionSharedPocketForContext,
  resolveSuccessionAssetLocation,
} from '../successionDraft';
import type {
  SuccessionAssetPocket,
  SuccessionPersonParty,
} from '../successionDraft';

describe('successionPatrimonialModel', () => {
  it('exposes the transitional party and pocket target types via the succession barrel', () => {
    expectTypeOf<SuccessionPersonParty>().toEqualTypeOf<'epoux1' | 'epoux2'>();
    expectTypeOf<SuccessionAssetPocket>().toEqualTypeOf<
      | 'epoux1'
      | 'epoux2'
      | 'communaute'
      | 'societe_acquets'
      | 'indivision_pacse'
      | 'indivision_concubinage'
    >();
  });

  it('maps the legacy shared owner to the current shared pocket by civil situation', () => {
    expect(getSuccessionAssetPocketFromOwner('commun', 'marie')).toBe('communaute');
    expect(getSuccessionAssetPocketFromOwner('commun', 'pacse')).toBe('indivision_pacse');
    expect(getSuccessionAssetPocketFromOwner('commun', 'concubinage')).toBe('indivision_concubinage');
    expect(getSuccessionLegacyOwnerFromPocket('societe_acquets')).toBe('commun');
    expect(getSuccessionAssetPocketFromOwner('commun', {
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'separation_biens_societe_acquets',
      pacsConvention: 'separation',
    })).toBe('societe_acquets');
  });

  it('resolves a compatible owner and pocket pair from either side of the bridge', () => {
    expect(resolveSuccessionAssetLocation({
      owner: 'commun',
      situationMatrimoniale: 'pacse',
    })).toEqual({
      owner: 'commun',
      pocket: 'indivision_pacse',
    });
    expect(resolveSuccessionAssetLocation({
      pocket: 'communaute',
      situationMatrimoniale: 'marie',
    })).toEqual({
      owner: 'commun',
      pocket: 'communaute',
    });
  });

  it('builds regime-aware owner and pocket options for the UI', () => {
    expect(buildSuccessionAssetOwnerOptions({
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'separation_biens',
      pacsConvention: 'separation',
    }).map((option) => option.value)).toEqual(['epoux1', 'epoux2']);

    expect(buildSuccessionAssetPocketOptions({
      situationMatrimoniale: 'pacse',
      regimeMatrimonial: null,
      pacsConvention: 'indivision',
    })).toEqual([
      { value: 'epoux1', label: 'Partenaire 1' },
      { value: 'epoux2', label: 'Partenaire 2' },
      { value: 'indivision_pacse', label: 'Indivision' },
    ]);

    expect(buildSuccessionAssetPocketOptions({
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'separation_biens_societe_acquets',
      pacsConvention: 'separation',
    })).toEqual([
      { value: 'epoux1', label: 'Epoux 1' },
      { value: 'epoux2', label: 'Epoux 2' },
      { value: 'societe_acquets', label: "Societe d'acquets" },
    ]);
  });

  it('detects the current shared pocket from the civil context', () => {
    expect(getSuccessionSharedPocketForContext({
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'communaute_legale',
      pacsConvention: 'separation',
    })).toBe('communaute');
    expect(getSuccessionSharedPocketForContext({
      situationMatrimoniale: 'pacse',
      regimeMatrimonial: null,
      pacsConvention: 'indivision',
    })).toBe('indivision_pacse');
    expect(getSuccessionSharedPocketForContext({
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'separation_biens',
      pacsConvention: 'separation',
    })).toBeNull();
    expect(getSuccessionSharedPocketForContext({
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'separation_biens_societe_acquets',
      pacsConvention: 'separation',
    })).toBe('societe_acquets');
  });
});
