import type {
  GroupementFoncierType,
  SuccessionGroupementFoncierEntry,
  SuccessionPatrimonialContext,
} from './successionDraft.types';
import { computeGroupementFoncierExoneration } from './successionGroupementFoncier';
import type { SuccessionAssetPocket } from './successionPatrimonialModel';

export interface SuccessionAssetTransmissionBasis {
  ordinaryTaxableAssetsParPocket: Record<SuccessionAssetPocket, number>;
  passifsParPocket: Record<SuccessionAssetPocket, number>;
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  hasBeneficiaryLevelGfAdjustment: boolean;
  residencePrincipaleEntry: {
    pocket: SuccessionAssetPocket;
    valeurTotale: number;
  } | null;
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
    sourceId: string;
    type: GroupementFoncierType;
    valeurTotale: number;
  }>;
  residencePrincipaleValeur: number;
}

export interface BeneficiaryTaxableAllocationInput {
  partSuccession: number;
}

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

export function createEmptyPocketScales(): SuccessionEstatePocketScales {
  return { ...EMPTY_POCKET_SCALES };
}

function getEntryScale(
  entry: Pick<SuccessionGroupementFoncierEntry, 'pocket'>,
  pocketScales: SuccessionEstatePocketScales,
): number {
  return pocketScales[entry.pocket];
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

  const ordinaryAssets = (Object.keys(EMPTY_POCKET_SCALES) as SuccessionAssetPocket[]).reduce(
    (sum, pocket) => sum + (asAmount(transmissionBasis.ordinaryTaxableAssetsParPocket[pocket]) * pocketScales[pocket]),
    0,
  );
  const passifs = (Object.keys(EMPTY_POCKET_SCALES) as SuccessionAssetPocket[]).reduce(
    (sum, pocket) => sum + (asAmount(transmissionBasis.passifsParPocket[pocket]) * pocketScales[pocket]),
    0,
  );

  return {
    ordinaryNetBeforeForfait: Math.max(0, ordinaryAssets - passifs),
    groupementEntries: transmissionBasis.groupementFoncierEntries
      .map((entry) => {
        const valeurTotale = asAmount(entry.valeurTotale) * getEntryScale(entry, pocketScales);
        if (valeurTotale <= 0) return null;
        return {
          sourceId: entry.id,
          type: entry.type,
          valeurTotale,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    residencePrincipaleValeur: transmissionBasis.residencePrincipaleEntry
      ? asAmount(transmissionBasis.residencePrincipaleEntry.valeurTotale)
        * pocketScales[transmissionBasis.residencePrincipaleEntry.pocket]
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

export function subtractSuccessionEstateTaxableBases(
  base: SuccessionEstateTaxableBasis,
  deduction: SuccessionEstateTaxableBasis,
): SuccessionEstateTaxableBasis {
  const deductionBySourceId = deduction.groupementEntries.reduce((map, entry) => {
    map.set(entry.sourceId, (map.get(entry.sourceId) ?? 0) + asAmount(entry.valeurTotale));
    return map;
  }, new Map<string, number>());

  return {
    ordinaryNetBeforeForfait: Math.max(
      0,
      base.ordinaryNetBeforeForfait - asAmount(deduction.ordinaryNetBeforeForfait),
    ),
    groupementEntries: base.groupementEntries
      .map((entry) => ({
        ...entry,
        valeurTotale: Math.max(
          0,
          entry.valeurTotale - (deductionBySourceId.get(entry.sourceId) ?? 0),
        ),
      }))
      .filter((entry) => entry.valeurTotale > 0),
    residencePrincipaleValeur: Math.max(
      0,
      base.residencePrincipaleValeur - asAmount(deduction.residencePrincipaleValeur),
    ),
  };
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
