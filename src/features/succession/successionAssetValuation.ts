import type {
  SuccessionAssetDetailEntry,
  SuccessionCivilContext,
  SuccessionAssetOwner,
  SuccessionGroupementFoncierEntry,
  SuccessionPatrimonialContext,
} from './successionDraft.types';
import { computeGroupementFoncierExoneration } from './successionGroupementFoncier';
import type { SuccessionAssetTransmissionBasis } from './successionTransmissionBasis';
import {
  resolveSuccessionAssetLocation,
  type SuccessionAssetPocket,
} from './successionPatrimonialModel';
import {
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
  RESIDENCE_SECONDAIRE_SUBCATEGORY,
} from './successionSimulator.constants';

export interface SuccessionAssetValuationResult {
  assetBreakdown: {
    actifs: Record<SuccessionAssetOwner, number>;
    passifs: Record<SuccessionAssetOwner, number>;
  };
  actifsTaxablesParOwner: Record<SuccessionAssetOwner, number>;
  passifsParOwner: Record<SuccessionAssetOwner, number>;
  forfaitMobilierComputed: number;
  forfaitMobilierParOwner: Record<SuccessionAssetOwner, number>;
  assetNetTotals: Record<SuccessionAssetOwner, number>;
  taxableNetTotals: Record<SuccessionAssetOwner, number>;
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

const EMPTY_OWNER_TOTALS: Record<SuccessionAssetOwner, number> = {
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
  'Résidence principale',
  'RÃ©sidence principale',
  'RÃƒÂ©sidence principale',
]);

const SECONDARY_RESIDENCE_LABELS = new Set([
  'Résidence secondaire',
  'RÃ©sidence secondaire',
  'RÃƒÂ©sidence secondaire',
]);

function cloneOwnerTotals(): Record<SuccessionAssetOwner, number> {
  return { ...EMPTY_OWNER_TOTALS };
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

export function computeSuccessionAssetValuation({
  civilContext,
  assetEntries,
  groupementFoncierEntries,
  forfaitMobilierMode,
  forfaitMobilierPct,
  forfaitMobilierMontant,
  abattementResidencePrincipale: _abattementResidencePrincipale,
}: SuccessionAssetValuationInput): SuccessionAssetValuationResult {
  const normalizedAssetEntries = normalizeResidencePrincipaleAssetEntries(assetEntries.map((entry) => {
    const location = resolveSuccessionAssetLocation({
      owner: entry.owner,
      pocket: entry.pocket,
      situationMatrimoniale: civilContext.situationMatrimoniale,
      regimeMatrimonial: civilContext.regimeMatrimonial,
      pacsConvention: civilContext.pacsConvention,
    });
    return location ? { ...entry, ...location } : entry;
  }));
  const normalizedGroupementFoncierEntries = groupementFoncierEntries.map((entry) => {
    const location = resolveSuccessionAssetLocation({
      owner: entry.owner,
      pocket: entry.pocket,
      situationMatrimoniale: civilContext.situationMatrimoniale,
      regimeMatrimonial: civilContext.regimeMatrimonial,
      pacsConvention: civilContext.pacsConvention,
    });
    return location ? { ...entry, ...location } : entry;
  });
  const residencePrincipaleEntryId = normalizedAssetEntries.find((entry) =>
    entry.category === 'immobilier' && entry.subCategory === RESIDENCE_PRINCIPALE_SUBCATEGORY,
  )?.id ?? null;

  const assetBreakdown = normalizedAssetEntries.reduce((totals, entry) => {
    if (entry.category === 'passif') {
      totals.passifs[entry.owner] += asAmount(entry.amount);
    } else {
      totals.actifs[entry.owner] += asAmount(entry.amount);
    }
    return totals;
  }, {
    actifs: cloneOwnerTotals(),
    passifs: cloneOwnerTotals(),
  });
  normalizedGroupementFoncierEntries.forEach((entry) => {
    assetBreakdown.actifs[entry.owner] += asAmount(entry.valeurTotale);
  });

  const actifsTaxablesParOwner = normalizedAssetEntries.reduce((totals, entry) => {
    if (entry.category === 'passif') return totals;
    totals[entry.owner] += asAmount(entry.amount);
    return totals;
  }, cloneOwnerTotals());
  const ordinaryTaxableAssetsParOwner = {
    ...actifsTaxablesParOwner,
  };
  const ordinaryTaxableAssetsParPocket = normalizedAssetEntries.reduce((totals, entry) => {
    if (entry.category === 'passif' || !entry.pocket) return totals;
    totals[entry.pocket] += asAmount(entry.amount);
    return totals;
  }, clonePocketTotals());
  normalizedGroupementFoncierEntries.forEach((entry) => {
    const { taxable } = computeGroupementFoncierExoneration(entry.type, asAmount(entry.valeurTotale));
    actifsTaxablesParOwner[entry.owner] += taxable;
  });

  const passifsParOwner = {
    ...assetBreakdown.passifs,
  };
  const passifsParPocket = normalizedAssetEntries.reduce((totals, entry) => {
    if (entry.category !== 'passif' || !entry.pocket) return totals;
    totals[entry.pocket] += asAmount(entry.amount);
    return totals;
  }, clonePocketTotals());

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

  const forfaitMobilierParOwner = (Object.keys(EMPTY_OWNER_TOTALS) as SuccessionAssetOwner[]).reduce(
    (totals, owner) => {
      totals[owner] = totalActifsTaxables > 0
        ? forfaitMobilierComputed * (actifsTaxablesParOwner[owner] / totalActifsTaxables)
        : 0;
      return totals;
    },
    cloneOwnerTotals(),
  );

  const taxableNetTotals = (Object.keys(EMPTY_OWNER_TOTALS) as SuccessionAssetOwner[]).reduce(
    (totals, owner) => {
      totals[owner] = Math.max(
        0,
        actifsTaxablesParOwner[owner] + forfaitMobilierParOwner[owner] - passifsParOwner[owner],
      );
      return totals;
    },
    cloneOwnerTotals(),
  );
  const assetNetTotals = (Object.keys(EMPTY_OWNER_TOTALS) as SuccessionAssetOwner[]).reduce(
    (totals, owner) => {
      totals[owner] = Math.max(0, assetBreakdown.actifs[owner] - passifsParOwner[owner]);
      return totals;
    },
    cloneOwnerTotals(),
  );

  return {
    assetBreakdown,
    actifsTaxablesParOwner,
    passifsParOwner,
    forfaitMobilierComputed,
    forfaitMobilierParOwner,
    assetNetTotals,
    taxableNetTotals,
    hasResidencePrincipale: residencePrincipaleEntryId !== null,
    residencePrincipaleEntryId,
    transmissionBasis: {
      ordinaryTaxableAssetsParOwner,
      passifsParOwner,
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
              owner: residencePrincipaleEntry.owner,
              pocket: residencePrincipaleEntry.pocket,
              valeurTotale: asAmount(residencePrincipaleEntry.amount),
            }
            : null;
        })()
        : null,
    },
  };
}
