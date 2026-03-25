import type {
  GroupementFoncierType,
  SuccessionAssetOwner,
  SuccessionGroupementFoncierEntry,
  SuccessionPatrimonialContext,
} from './successionDraft.types';
import { computeGroupementFoncierExoneration } from './successionGroupementFoncier';
import type { SuccessionAssetPocket } from './successionPatrimonialModel';

export interface SuccessionAssetTransmissionBasis {
  ordinaryTaxableAssetsParOwner: Record<SuccessionAssetOwner, number>;
  passifsParOwner: Record<SuccessionAssetOwner, number>;
  ordinaryTaxableAssetsParPocket?: Record<SuccessionAssetPocket, number>;
  passifsParPocket?: Record<SuccessionAssetPocket, number>;
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  hasBeneficiaryLevelGfAdjustment: boolean;
  residencePrincipaleEntry: {
    owner: SuccessionAssetOwner;
    pocket?: SuccessionAssetPocket;
    valeurTotale: number;
  } | null;
}

export interface SuccessionEstateOwnerScales {
  epoux1: number;
  epoux2: number;
  commun: number;
}

export interface SuccessionEstatePocketScales {
  epoux1: number;
  epoux2: number;
  communaute: number;
  societe_acquets: number;
  indivision_pacse: number;
  indivision_concubinage: number;
}

export interface SuccessionEstateTaxableBasis {
  ordinaryNetBeforeForfait: number;
  groupementEntries: Array<{
    type: GroupementFoncierType;
    valeurTotale: number;
  }>;
  residencePrincipaleValeur: number;
}

export interface BeneficiaryTaxableAllocationInput {
  partSuccession: number;
}

const EMPTY_OWNER_SCALES: SuccessionEstateOwnerScales = {
  epoux1: 0,
  epoux2: 0,
  commun: 0,
};

const EMPTY_POCKET_SCALES: SuccessionEstatePocketScales = {
  epoux1: 0,
  epoux2: 0,
  communaute: 0,
  societe_acquets: 0,
  indivision_pacse: 0,
  indivision_concubinage: 0,
};

function asAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

export function createEmptyOwnerScales(): SuccessionEstateOwnerScales {
  return { ...EMPTY_OWNER_SCALES };
}

export function createEmptyPocketScales(): SuccessionEstatePocketScales {
  return { ...EMPTY_POCKET_SCALES };
}

function getSharedPocketScale(pocketScales: SuccessionEstatePocketScales): number {
  return pocketScales.communaute
    + pocketScales.societe_acquets
    + pocketScales.indivision_pacse
    + pocketScales.indivision_concubinage;
}

function getLegacyOwnerScale(
  owner: SuccessionAssetOwner,
  pocketScales: SuccessionEstatePocketScales,
): number {
  if (owner === 'epoux1') return pocketScales.epoux1;
  if (owner === 'epoux2') return pocketScales.epoux2;
  return getSharedPocketScale(pocketScales);
}

function getEntryScale(
  entry: Pick<SuccessionGroupementFoncierEntry, 'owner' | 'pocket'>,
  pocketScales: SuccessionEstatePocketScales,
): number {
  return entry.pocket ? pocketScales[entry.pocket] : getLegacyOwnerScale(entry.owner, pocketScales);
}

export function buildSuccessionEstateTaxableBasis(
  transmissionBasis: SuccessionAssetTransmissionBasis | null | undefined,
  pocketScales: SuccessionEstatePocketScales,
): SuccessionEstateTaxableBasis {
  if (!transmissionBasis) {
    return {
      ordinaryNetBeforeForfait: 0,
      groupementEntries: [],
      residencePrincipaleValeur: 0,
    };
  }

  const ordinaryAssets = transmissionBasis.ordinaryTaxableAssetsParPocket
    ? (Object.keys(EMPTY_POCKET_SCALES) as SuccessionAssetPocket[]).reduce(
      (sum, pocket) => sum + (asAmount(transmissionBasis.ordinaryTaxableAssetsParPocket?.[pocket]) * pocketScales[pocket]),
      0,
    )
    : (
      (transmissionBasis.ordinaryTaxableAssetsParOwner.epoux1 * pocketScales.epoux1)
      + (transmissionBasis.ordinaryTaxableAssetsParOwner.epoux2 * pocketScales.epoux2)
      + (transmissionBasis.ordinaryTaxableAssetsParOwner.commun * getSharedPocketScale(pocketScales))
    );
  const passifs = transmissionBasis.passifsParPocket
    ? (Object.keys(EMPTY_POCKET_SCALES) as SuccessionAssetPocket[]).reduce(
      (sum, pocket) => sum + (asAmount(transmissionBasis.passifsParPocket?.[pocket]) * pocketScales[pocket]),
      0,
    )
    : (
      (transmissionBasis.passifsParOwner.epoux1 * pocketScales.epoux1)
      + (transmissionBasis.passifsParOwner.epoux2 * pocketScales.epoux2)
      + (transmissionBasis.passifsParOwner.commun * getSharedPocketScale(pocketScales))
    );

  return {
    ordinaryNetBeforeForfait: Math.max(0, ordinaryAssets - passifs),
    groupementEntries: transmissionBasis.groupementFoncierEntries
      .map((entry) => {
        const valeurTotale = asAmount(entry.valeurTotale) * getEntryScale(entry, pocketScales);
        if (valeurTotale <= 0) return null;
        return {
          type: entry.type,
          valeurTotale,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    residencePrincipaleValeur: transmissionBasis.residencePrincipaleEntry
      ? asAmount(transmissionBasis.residencePrincipaleEntry.valeurTotale)
        * (
          transmissionBasis.residencePrincipaleEntry.pocket
            ? pocketScales[transmissionBasis.residencePrincipaleEntry.pocket]
            : getLegacyOwnerScale(transmissionBasis.residencePrincipaleEntry.owner, pocketScales)
        )
      : 0,
  };
}

export function scaleSuccessionEstateTaxableBasis(
  basis: SuccessionEstateTaxableBasis,
  ratio: number,
): SuccessionEstateTaxableBasis {
  const normalizedRatio = Math.max(0, ratio);
  if (normalizedRatio === 0) {
    return {
      ordinaryNetBeforeForfait: 0,
      groupementEntries: [],
      residencePrincipaleValeur: 0,
    };
  }

  return {
    ordinaryNetBeforeForfait: basis.ordinaryNetBeforeForfait * normalizedRatio,
    groupementEntries: basis.groupementEntries.map((entry) => ({
      ...entry,
      valeurTotale: entry.valeurTotale * normalizedRatio,
    })),
    residencePrincipaleValeur: basis.residencePrincipaleValeur * normalizedRatio,
  };
}

export function addSuccessionEstateTaxableBases(
  ...bases: SuccessionEstateTaxableBasis[]
): SuccessionEstateTaxableBasis {
  return bases.reduce<SuccessionEstateTaxableBasis>((acc, basis) => ({
    ordinaryNetBeforeForfait: acc.ordinaryNetBeforeForfait + basis.ordinaryNetBeforeForfait,
    groupementEntries: [...acc.groupementEntries, ...basis.groupementEntries],
    residencePrincipaleValeur: acc.residencePrincipaleValeur + basis.residencePrincipaleValeur,
  }), {
    ordinaryNetBeforeForfait: 0,
    groupementEntries: [],
    residencePrincipaleValeur: 0,
  });
}

export function applyResidencePrincipaleAbatementToEstateBasis(
  basis: SuccessionEstateTaxableBasis,
  shouldApply: boolean,
): SuccessionEstateTaxableBasis {
  if (!shouldApply || basis.residencePrincipaleValeur <= 0) return basis;

  return {
    ...basis,
    ordinaryNetBeforeForfait: Math.max(0, basis.ordinaryNetBeforeForfait - (basis.residencePrincipaleValeur * 0.2)),
  };
}

function computeForfaitMobilier(
  mobilier: Pick<
    SuccessionPatrimonialContext,
    'forfaitMobilierMode' | 'forfaitMobilierPct' | 'forfaitMobilierMontant'
  >,
  totalBase: number,
): number {
  if (totalBase <= 0 || mobilier.forfaitMobilierMode === 'off') return 0;
  if (mobilier.forfaitMobilierMode === 'montant') {
    return asAmount(mobilier.forfaitMobilierMontant);
  }

  const rate = mobilier.forfaitMobilierMode === 'pct'
    ? Math.max(0, Number(mobilier.forfaitMobilierPct) || 0) / 100
    : 0.05;
  return totalBase * rate;
}

export function assignBeneficiaryTaxableBasis<TBeneficiary extends BeneficiaryTaxableAllocationInput>(
  beneficiaries: TBeneficiary[],
  estateBasis: SuccessionEstateTaxableBasis,
  mobilier: Pick<
    SuccessionPatrimonialContext,
    'forfaitMobilierMode' | 'forfaitMobilierPct' | 'forfaitMobilierMontant'
  >,
): Array<TBeneficiary & { taxablePartSuccession: number }> {
  const totalBrut = beneficiaries.reduce((sum, beneficiary) => sum + asAmount(beneficiary.partSuccession), 0);
  if (totalBrut <= 0) {
    return beneficiaries.map((beneficiary) => ({
      ...beneficiary,
      taxablePartSuccession: 0,
    }));
  }

  const beforeForfaitByBeneficiary = beneficiaries.map((beneficiary) => {
    const ratio = asAmount(beneficiary.partSuccession) / totalBrut;
    const ordinaryBase = estateBasis.ordinaryNetBeforeForfait * ratio;
    const groupementBase = estateBasis.groupementEntries.reduce((sum, entry) => (
      sum + computeGroupementFoncierExoneration(entry.type, entry.valeurTotale * ratio).taxable
    ), 0);
    return ordinaryBase + groupementBase;
  });

  const totalBeforeForfait = beforeForfaitByBeneficiary.reduce((sum, value) => sum + value, 0);
  const forfaitMobilier = computeForfaitMobilier(mobilier, totalBeforeForfait);

  return beneficiaries.map((beneficiary, index) => {
    const baseBeforeForfait = beforeForfaitByBeneficiary[index];
    const forfaitShare = totalBeforeForfait > 0
      ? forfaitMobilier * (baseBeforeForfait / totalBeforeForfait)
      : 0;
    return {
      ...beneficiary,
      taxablePartSuccession: baseBeforeForfait + forfaitShare,
    };
  });
}
