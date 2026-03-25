/**
 * Transitional patrimonial target types introduced in PR-11.
 *
 * PR-13/14 move the persisted draft to `pocket` while keeping the legacy
 * `owner` alias synchronized so the current runtime can remain stable until
 * the later engine migrations.
 */

import type { RegimeMatrimonial } from '../../engine/civil';

export type SuccessionPersonParty = 'epoux1' | 'epoux2';
export type SuccessionLegacyAssetOwner = SuccessionPersonParty | 'commun';

export type SuccessionAssetPocket =
  | SuccessionPersonParty
  | 'communaute'
  | 'societe_acquets'
  | 'indivision_pacse'
  | 'indivision_concubinage';

export type SuccessionSharedAssetPocket = Exclude<SuccessionAssetPocket, SuccessionPersonParty>;

interface SuccessionAssetLocationContext {
  situationMatrimoniale?: string | null;
  regimeMatrimonial?: RegimeMatrimonial | null;
  pacsConvention?: string | null;
}

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

export function getSuccessionSharedPocketForContext({
  situationMatrimoniale,
  regimeMatrimonial,
  pacsConvention,
}: SuccessionAssetLocationContext): SuccessionSharedAssetPocket | null {
  if (situationMatrimoniale === 'pacse') {
    return pacsConvention === 'indivision' ? 'indivision_pacse' : null;
  }
  if (situationMatrimoniale === 'concubinage') {
    return 'indivision_concubinage';
  }
  if (situationMatrimoniale !== 'marie') {
    return null;
  }
  if (
    regimeMatrimonial === 'separation_biens'
    || regimeMatrimonial === 'participation_acquets'
    || regimeMatrimonial === 'separation_biens_societe_acquets'
  ) {
    return null;
  }
  return 'communaute';
}

export function getSuccessionAssetPocketFromOwner(
  owner: SuccessionLegacyAssetOwner,
  context: SuccessionAssetLocationContext | string | null = {},
): SuccessionAssetPocket {
  if (owner === 'epoux1' || owner === 'epoux2') return owner;
  const normalizedContext = typeof context === 'string'
    ? { situationMatrimoniale: context }
    : (context ?? {});
  const sharedPocket = getSuccessionSharedPocketForContext(normalizedContext);
  if (sharedPocket) return sharedPocket;
  if (normalizedContext.situationMatrimoniale === 'pacse') return 'indivision_pacse';
  if (normalizedContext.situationMatrimoniale === 'concubinage') return 'indivision_concubinage';
  return 'communaute';
}

export function resolveSuccessionAssetLocation({
  owner,
  pocket,
  situationMatrimoniale,
  regimeMatrimonial,
  pacsConvention,
}: {
  owner?: unknown;
  pocket?: unknown;
  situationMatrimoniale?: string | null;
  regimeMatrimonial?: RegimeMatrimonial | null;
  pacsConvention?: string | null;
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
      pocket: getSuccessionAssetPocketFromOwner(owner, {
        situationMatrimoniale,
        regimeMatrimonial,
        pacsConvention,
      }),
    };
  }

  return null;
}

function getSuccessionPartyOptionLabels({
  situationMatrimoniale,
}: SuccessionAssetLocationContext): Record<SuccessionPersonParty, string> {
  if (situationMatrimoniale === 'marie') {
    return {
      epoux1: 'Époux 1',
      epoux2: 'Époux 2',
    };
  }
  if (situationMatrimoniale === 'pacse') {
    return {
      epoux1: 'Partenaire 1',
      epoux2: 'Partenaire 2',
    };
  }
  if (situationMatrimoniale === 'concubinage') {
    return {
      epoux1: 'Personne 1',
      epoux2: 'Personne 2',
    };
  }
  return {
    epoux1: 'Vous',
    epoux2: 'Partie 2',
  };
}

export function buildSuccessionAssetOwnerOptions(
  context: SuccessionAssetLocationContext,
): Array<{ value: SuccessionLegacyAssetOwner; label: string }> {
  const partyLabels = getSuccessionPartyOptionLabels(context);
  const options: Array<{ value: SuccessionLegacyAssetOwner; label: string }> = [
    { value: 'epoux1', label: partyLabels.epoux1 },
  ];

  const isCoupleSituation = context.situationMatrimoniale === 'marie'
    || context.situationMatrimoniale === 'pacse'
    || context.situationMatrimoniale === 'concubinage';
  if (isCoupleSituation) {
    options.push({ value: 'epoux2', label: partyLabels.epoux2 });
  }

  const sharedPocket = getSuccessionSharedPocketForContext(context);
  if (sharedPocket) {
    options.push({
      value: 'commun',
      label: sharedPocket === 'communaute' ? 'Communauté' : 'Indivision',
    });
  }

  return options;
}

export function buildSuccessionAssetPocketOptions(
  context: SuccessionAssetLocationContext,
): Array<{ value: SuccessionAssetPocket; label: string }> {
  const partyLabels = getSuccessionPartyOptionLabels(context);
  const options: Array<{ value: SuccessionAssetPocket; label: string }> = [
    { value: 'epoux1', label: partyLabels.epoux1 },
  ];

  const isCoupleSituation = context.situationMatrimoniale === 'marie'
    || context.situationMatrimoniale === 'pacse'
    || context.situationMatrimoniale === 'concubinage';
  if (isCoupleSituation) {
    options.push({ value: 'epoux2', label: partyLabels.epoux2 });
  }

  const sharedPocket = getSuccessionSharedPocketForContext(context);
  if (sharedPocket) {
    options.push({
      value: sharedPocket,
      label: sharedPocket === 'communaute' ? 'Communauté' : 'Indivision',
    });
  }

  return options;
}
