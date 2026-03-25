/**
 * Transitional patrimonial target types introduced in PR-11.
 *
 * PR-13/14 move the persisted draft to `pocket` while keeping the legacy
 * `owner` alias synchronized so the current runtime can remain stable until
 * the later engine migrations.
 */

export type SuccessionPersonParty = 'epoux1' | 'epoux2';
export type SuccessionLegacyAssetOwner = SuccessionPersonParty | 'commun';

export type SuccessionAssetPocket =
  | SuccessionPersonParty
  | 'communaute'
  | 'societe_acquets'
  | 'indivision_pacse'
  | 'indivision_concubinage';

export function isSuccessionLegacyAssetOwner(value: unknown): value is SuccessionLegacyAssetOwner {
  return value === 'epoux1' || value === 'epoux2' || value === 'commun';
}

export function isSuccessionAssetPocket(value: unknown): value is SuccessionAssetPocket {
  return value === 'epoux1'
    || value === 'epoux2'
    || value === 'communaute'
    || value === 'societe_acquets'
    || value === 'indivision_pacse'
    || value === 'indivision_concubinage';
}

export function getSuccessionLegacyOwnerFromPocket(
  pocket: SuccessionAssetPocket,
): SuccessionLegacyAssetOwner {
  return pocket === 'epoux1' || pocket === 'epoux2' ? pocket : 'commun';
}

export function getSuccessionAssetPocketFromOwner(
  owner: SuccessionLegacyAssetOwner,
  situationMatrimoniale?: string | null,
): SuccessionAssetPocket {
  if (owner === 'epoux1' || owner === 'epoux2') return owner;
  if (situationMatrimoniale === 'pacse') return 'indivision_pacse';
  if (situationMatrimoniale === 'concubinage') return 'indivision_concubinage';
  return 'communaute';
}

export function resolveSuccessionAssetLocation({
  owner,
  pocket,
  situationMatrimoniale,
}: {
  owner?: unknown;
  pocket?: unknown;
  situationMatrimoniale?: string | null;
}): { owner: SuccessionLegacyAssetOwner; pocket: SuccessionAssetPocket } | null {
  if (isSuccessionAssetPocket(pocket)) {
    return {
      pocket,
      owner: getSuccessionLegacyOwnerFromPocket(pocket),
    };
  }

  if (isSuccessionLegacyAssetOwner(owner)) {
    return {
      owner,
      pocket: getSuccessionAssetPocketFromOwner(owner, situationMatrimoniale),
    };
  }

  return null;
}
