import { describe, expectTypeOf, it } from 'vitest';
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
});
