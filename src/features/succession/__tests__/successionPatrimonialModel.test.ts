import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  getSuccessionAssetPocketFromOwner,
  getSuccessionLegacyOwnerFromPocket,
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
});
