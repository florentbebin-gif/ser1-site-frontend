import type {
  GroupementFoncierType,
  SuccessionAssetOwner,
  SuccessionGroupementFoncierEntry,
  SuccessionPatrimonialContext,
} from './successionDraft.types';
import { computeGroupementFoncierExoneration } from './successionGroupementFoncier';

export interface SuccessionAssetTransmissionBasis {
  ordinaryTaxableAssetsParOwner: Record<SuccessionAssetOwner, number>;
  passifsParOwner: Record<SuccessionAssetOwner, number>;
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  hasBeneficiaryLevelGfAdjustment: boolean;
}

export interface SuccessionEstateOwnerScales {
  epoux1: number;
  epoux2: number;
  commun: number;
}

export interface SuccessionEstateTaxableBasis {
  ordinaryNetBeforeForfait: number;
  groupementEntries: Array<{
    type: GroupementFoncierType;
    valeurTotale: number;
  }>;
}

export interface BeneficiaryTaxableAllocationInput {
  partSuccession: number;
}

const EMPTY_OWNER_SCALES: SuccessionEstateOwnerScales = {
  epoux1: 0,
  epoux2: 0,
  commun: 0,
};

function asAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
}

export function createEmptyOwnerScales(): SuccessionEstateOwnerScales {
  return { ...EMPTY_OWNER_SCALES };
}

export function buildSuccessionEstateTaxableBasis(
  transmissionBasis: SuccessionAssetTransmissionBasis | null | undefined,
  ownerScales: SuccessionEstateOwnerScales,
): SuccessionEstateTaxableBasis {
  if (!transmissionBasis) {
    return {
      ordinaryNetBeforeForfait: 0,
      groupementEntries: [],
    };
  }

  const ordinaryAssets =
    (transmissionBasis.ordinaryTaxableAssetsParOwner.epoux1 * ownerScales.epoux1)
    + (transmissionBasis.ordinaryTaxableAssetsParOwner.epoux2 * ownerScales.epoux2)
    + (transmissionBasis.ordinaryTaxableAssetsParOwner.commun * ownerScales.commun);
  const passifs =
    (transmissionBasis.passifsParOwner.epoux1 * ownerScales.epoux1)
    + (transmissionBasis.passifsParOwner.epoux2 * ownerScales.epoux2)
    + (transmissionBasis.passifsParOwner.commun * ownerScales.commun);

  return {
    ordinaryNetBeforeForfait: Math.max(0, ordinaryAssets - passifs),
    groupementEntries: transmissionBasis.groupementFoncierEntries
      .map((entry) => {
        const ownerScale = ownerScales[entry.owner];
        const valeurTotale = asAmount(entry.valeurTotale) * ownerScale;
        if (valeurTotale <= 0) return null;
        return {
          type: entry.type,
          valeurTotale,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
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
    };
  }

  return {
    ordinaryNetBeforeForfait: basis.ordinaryNetBeforeForfait * normalizedRatio,
    groupementEntries: basis.groupementEntries.map((entry) => ({
      ...entry,
      valeurTotale: entry.valeurTotale * normalizedRatio,
    })),
  };
}

export function addSuccessionEstateTaxableBases(
  ...bases: SuccessionEstateTaxableBasis[]
): SuccessionEstateTaxableBasis {
  return bases.reduce<SuccessionEstateTaxableBasis>((acc, basis) => ({
    ordinaryNetBeforeForfait: acc.ordinaryNetBeforeForfait + basis.ordinaryNetBeforeForfait,
    groupementEntries: [...acc.groupementEntries, ...basis.groupementEntries],
  }), {
    ordinaryNetBeforeForfait: 0,
    groupementEntries: [],
  });
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
