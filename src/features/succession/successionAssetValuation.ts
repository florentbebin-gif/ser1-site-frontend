import type {
  SuccessionAssetDetailEntry,
  SuccessionCivilContext,
  SuccessionGroupementFoncierEntry,
  SuccessionPatrimonialContext,
} from './successionDraft.types';
import { computeGroupementFoncierExoneration } from './successionGroupementFoncier';
import type { SuccessionAssetTransmissionBasis } from './successionTransmissionBasis';
import {
  getSuccessionLegacyOwnerFromPocket,
  resolveSuccessionAssetLocation,
  type SuccessionAssetPocket,
  type SuccessionLegacyAssetOwner,
} from './successionPatrimonialModel';
import {
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
  RESIDENCE_SECONDAIRE_SUBCATEGORY,
} from './successionSimulator.constants';

export interface SuccessionAssetValuationResult {
  assetBreakdown: {
    actifs: Record<SuccessionLegacyAssetOwner, number>;
    passifs: Record<SuccessionLegacyAssetOwner, number>;
  };
  actifsTaxablesParOwner: Record<SuccessionLegacyAssetOwner, number>;
  passifsParOwner: Record<SuccessionLegacyAssetOwner, number>;
  forfaitMobilierComputed: number;
  forfaitMobilierParOwner: Record<SuccessionLegacyAssetOwner, number>;
  assetNetTotals: Record<SuccessionLegacyAssetOwner, number>;
  assetNetTotalsByPocket: Record<SuccessionAssetPocket, number>;
  taxableNetTotals: Record<SuccessionLegacyAssetOwner, number>;
  hasResidencePrincipale: boolean;
  residencePrincipaleEntryId: string | null;
  transmissionBasis: SuccessionAssetTransmissionBasis;
}

interface SuccessionAssetValuationInput {
  civilContext: Pick<SuccessionCivilContext, 'situationMatrimoniale' | 'regimeMatrimonial' | 'pacsConvention'>;
  assetEntries: SuccessionAssetDetailEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  forfaitMobilierMode: SuccessionPatrimonialContext['forfaitMobilierMode'];
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  abattementResidencePrincipale: boolean;
}

const EMPTY_LEGACY_OWNER_TOTALS: Record<SuccessionLegacyAssetOwner, number> = {
  epoux1: 0,
  epoux2: 0,
  commun: 0,
};

const EMPTY_POCKET_TOTALS: Record<SuccessionAssetPocket, number> = {
  epoux1: 0,
  epoux2: 0,
  communaute: 0,
  societe_acquets: 0,
  indivision_pacse: 0,
  indivision_concubinage: 0,
};

const MAIN_RESIDENCE_LABELS = new Set([
  'RÃ©sidence principale',
  'RÃƒÂ©sidence principale',
  'RÃƒÆ’Ã‚Â©sidence principale',
]);

const SECONDARY_RESIDENCE_LABELS = new Set([
  'RÃ©sidence secondaire',
  'RÃƒÂ©sidence secondaire',
  'RÃƒÆ’Ã‚Â©sidence secondaire',
]);

function cloneLegacyOwnerTotals(): Record<SuccessionLegacyAssetOwner, number> {
  return { ...EMPTY_LEGACY_OWNER_TOTALS };
}

function clonePocketTotals(): Record<SuccessionAssetPocket, number> {
  return { ...EMPTY_POCKET_TOTALS };
}

function asAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

function normalizeResidenceSubCategoryLabel(subCategory: string): string {
  if (MAIN_RESIDENCE_LABELS.has(subCategory)) {
    return RESIDENCE_PRINCIPALE_SUBCATEGORY;
  }
  if (SECONDARY_RESIDENCE_LABELS.has(subCategory)) {
    return RESIDENCE_SECONDAIRE_SUBCATEGORY;
  }
  return subCategory;
}

export function normalizeResidencePrincipaleAssetEntries(
  assetEntries: SuccessionAssetDetailEntry[],
): SuccessionAssetDetailEntry[] {
  let hasResidencePrincipale = false;
  let changed = false;

  const normalized = assetEntries.map((entry) => {
    const normalizedSubCategory = entry.category === 'immobilier'
      ? normalizeResidenceSubCategoryLabel(entry.subCategory)
      : entry.subCategory;

    if (normalizedSubCategory !== entry.subCategory) {
      changed = true;
    }

    if (
      entry.category !== 'immobilier'
      || normalizedSubCategory !== RESIDENCE_PRINCIPALE_SUBCATEGORY
    ) {
      return normalizedSubCategory === entry.subCategory
        ? entry
        : { ...entry, subCategory: normalizedSubCategory };
    }

    if (!hasResidencePrincipale) {
      hasResidencePrincipale = true;
      return normalizedSubCategory === entry.subCategory
        ? entry
        : { ...entry, subCategory: normalizedSubCategory };
    }

    changed = true;
    return {
      ...entry,
      subCategory: RESIDENCE_SECONDAIRE_SUBCATEGORY,
    };
  });

  return changed ? normalized : assetEntries;
}

function normalizeAssetPocket(
  pocket: SuccessionAssetPocket,
  civilContext: SuccessionAssetValuationInput['civilContext'],
): SuccessionAssetPocket {
  return resolveSuccessionAssetLocation({
    pocket,
    situationMatrimoniale: civilContext.situationMatrimoniale,
    regimeMatrimonial: civilContext.regimeMatrimonial,
    pacsConvention: civilContext.pacsConvention,
  })?.pocket ?? 'epoux1';
}

function toLegacyOwner(pocket: SuccessionAssetPocket): SuccessionLegacyAssetOwner {
  return getSuccessionLegacyOwnerFromPocket(pocket);
}

export function computeSuccessionAssetValuation({
  civilContext,
  assetEntries,
  groupementFoncierEntries,
  forfaitMobilierMode,
  forfaitMobilierPct,
  forfaitMobilierMontant,
  abattementResidencePrincipale: _abattementResidencePrincipale,
}: SuccessionAssetValuationInput): SuccessionAssetValuationResult {
  const normalizedAssetEntries = normalizeResidencePrincipaleAssetEntries(assetEntries.map((entry) => ({
    ...entry,
    pocket: normalizeAssetPocket(entry.pocket, civilContext),
  })));
  const normalizedGroupementFoncierEntries = groupementFoncierEntries.map((entry) => ({
    ...entry,
    pocket: normalizeAssetPocket(entry.pocket, civilContext),
  }));
  const residencePrincipaleEntryId = normalizedAssetEntries.find((entry) =>
    entry.category === 'immobilier' && entry.subCategory === RESIDENCE_PRINCIPALE_SUBCATEGORY,
  )?.id ?? null;

  const assetBreakdown = normalizedAssetEntries.reduce((totals, entry) => {
    const owner = toLegacyOwner(entry.pocket);
    if (entry.category === 'passif') {
      totals.passifs[owner] += asAmount(entry.amount);
    } else {
      totals.actifs[owner] += asAmount(entry.amount);
    }
    return totals;
  }, {
    actifs: cloneLegacyOwnerTotals(),
    passifs: cloneLegacyOwnerTotals(),
  });
  normalizedGroupementFoncierEntries.forEach((entry) => {
    assetBreakdown.actifs[toLegacyOwner(entry.pocket)] += asAmount(entry.valeurTotale);
  });

  const grossAssetsParPocket = normalizedAssetEntries.reduce((totals, entry) => {
    if (entry.category === 'passif') return totals;
    totals[entry.pocket] += asAmount(entry.amount);
    return totals;
  }, clonePocketTotals());
  normalizedGroupementFoncierEntries.forEach((entry) => {
    grossAssetsParPocket[entry.pocket] += asAmount(entry.valeurTotale);
  });

  const ordinaryTaxableAssetsParPocket = normalizedAssetEntries.reduce((totals, entry) => {
    if (entry.category === 'passif') return totals;
    totals[entry.pocket] += asAmount(entry.amount);
    return totals;
  }, clonePocketTotals());
  const passifsParPocket = normalizedAssetEntries.reduce((totals, entry) => {
    if (entry.category !== 'passif') return totals;
    totals[entry.pocket] += asAmount(entry.amount);
    return totals;
  }, clonePocketTotals());

  const actifsTaxablesParOwner = (Object.keys(EMPTY_POCKET_TOTALS) as SuccessionAssetPocket[]).reduce(
    (totals, pocket) => {
      totals[toLegacyOwner(pocket)] += ordinaryTaxableAssetsParPocket[pocket];
      return totals;
    },
    cloneLegacyOwnerTotals(),
  );
  normalizedGroupementFoncierEntries.forEach((entry) => {
    const { taxable } = computeGroupementFoncierExoneration(entry.type, asAmount(entry.valeurTotale));
    actifsTaxablesParOwner[toLegacyOwner(entry.pocket)] += taxable;
  });

  const passifsParOwner = (Object.keys(EMPTY_POCKET_TOTALS) as SuccessionAssetPocket[]).reduce(
    (totals, pocket) => {
      totals[toLegacyOwner(pocket)] += passifsParPocket[pocket];
      return totals;
    },
    cloneLegacyOwnerTotals(),
  );

  const totalActifsTaxables =
    actifsTaxablesParOwner.epoux1
    + actifsTaxablesParOwner.epoux2
    + actifsTaxablesParOwner.commun;

  const forfaitMobilierComputed = (() => {
    if (totalActifsTaxables <= 0) return 0;
    if (forfaitMobilierMode === 'off') return 0;
    if (forfaitMobilierMode === 'montant') {
      return asAmount(forfaitMobilierMontant);
    }
    const rate = forfaitMobilierMode === 'pct'
      ? Math.max(0, Number(forfaitMobilierPct) || 0) / 100
      : 0.05;
    return totalActifsTaxables * rate;
  })();

  const forfaitMobilierParOwner = (Object.keys(EMPTY_LEGACY_OWNER_TOTALS) as SuccessionLegacyAssetOwner[]).reduce(
    (totals, owner) => {
      totals[owner] = totalActifsTaxables > 0
        ? forfaitMobilierComputed * (actifsTaxablesParOwner[owner] / totalActifsTaxables)
        : 0;
      return totals;
    },
    cloneLegacyOwnerTotals(),
  );

  const taxableNetTotals = (Object.keys(EMPTY_LEGACY_OWNER_TOTALS) as SuccessionLegacyAssetOwner[]).reduce(
    (totals, owner) => {
      totals[owner] = Math.max(
        0,
        actifsTaxablesParOwner[owner] + forfaitMobilierParOwner[owner] - passifsParOwner[owner],
      );
      return totals;
    },
    cloneLegacyOwnerTotals(),
  );
  const assetNetTotals = (Object.keys(EMPTY_LEGACY_OWNER_TOTALS) as SuccessionLegacyAssetOwner[]).reduce(
    (totals, owner) => {
      totals[owner] = Math.max(0, assetBreakdown.actifs[owner] - passifsParOwner[owner]);
      return totals;
    },
    cloneLegacyOwnerTotals(),
  );
  const assetNetTotalsByPocket = (Object.keys(EMPTY_POCKET_TOTALS) as SuccessionAssetPocket[]).reduce(
    (totals, pocket) => {
      totals[pocket] = Math.max(0, grossAssetsParPocket[pocket] - passifsParPocket[pocket]);
      return totals;
    },
    clonePocketTotals(),
  );

  return {
    assetBreakdown,
    actifsTaxablesParOwner,
    passifsParOwner,
    forfaitMobilierComputed,
    forfaitMobilierParOwner,
    assetNetTotals,
    assetNetTotalsByPocket,
    taxableNetTotals,
    hasResidencePrincipale: residencePrincipaleEntryId !== null,
    residencePrincipaleEntryId,
    transmissionBasis: {
      ordinaryTaxableAssetsParPocket,
      passifsParPocket,
      groupementFoncierEntries: normalizedGroupementFoncierEntries.map((entry) => ({ ...entry })),
      hasBeneficiaryLevelGfAdjustment: normalizedGroupementFoncierEntries.some(
        (entry) => entry.type === 'GFA' || entry.type === 'GFV',
      ),
      residencePrincipaleEntry: residencePrincipaleEntryId
        ? (() => {
          const residencePrincipaleEntry = normalizedAssetEntries.find((entry) => entry.id === residencePrincipaleEntryId);
          return residencePrincipaleEntry
            ? {
              pocket: residencePrincipaleEntry.pocket,
              valeurTotale: asAmount(residencePrincipaleEntry.amount),
            }
            : null;
        })()
        : null,
    },
  };
}
