/**
 * Transitional patrimonial target types introduced in PR-11.
 *
 * The current runtime still relies on the legacy `SuccessionAssetOwner`
 * model from `successionDraft.types.ts`. These types prepare the next
 * migration steps without changing the persisted draft or engine behavior yet.
 */

export type SuccessionPersonParty = 'epoux1' | 'epoux2';

export type SuccessionAssetPocket =
  | SuccessionPersonParty
  | 'communaute'
  | 'societe_acquets'
  | 'indivision_pacse'
  | 'indivision_concubinage';
