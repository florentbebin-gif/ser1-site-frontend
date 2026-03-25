import type {
  FamilyMember,
  PersistedSuccessionForm,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionDraftPayloadV20,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionLiquidationContext,
  SuccessionPerEntry,
  SuccessionPatrimonialContext,
  SuccessionPrimarySide,
  SuccessionPrevoyanceDecesEntry,
} from './successionDraft.types';
import { resolveSuccessionAssetLocation } from './successionPatrimonialModel';

export function buildSuccessionDraftPayload(
  form: PersistedSuccessionForm,
  civil: SuccessionCivilContext,
  liquidation: SuccessionLiquidationContext,
  devolution: SuccessionDevolutionContext,
  patrimonial: SuccessionPatrimonialContext,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  donations: SuccessionDonationEntry[],
  assetEntries: SuccessionAssetDetailEntry[],
  assuranceVieEntries: SuccessionAssuranceVieEntry[],
  perEntries: SuccessionPerEntry[],
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[] = [],
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[] = [],
  chainOrder: SuccessionPrimarySide = 'epoux1',
): SuccessionDraftPayloadV20 {
  const normalizedAssetEntries = assetEntries.map((entry) => {
    const location = resolveSuccessionAssetLocation({
      owner: entry.owner,
      pocket: entry.pocket,
      situationMatrimoniale: civil.situationMatrimoniale,
    }) ?? {
      owner: 'epoux1' as const,
      pocket: 'epoux1' as const,
    };

    return {
      ...entry,
      ...location,
    };
  });

  const normalizedGroupementFoncierEntries = groupementFoncierEntries.map((entry) => {
    const location = resolveSuccessionAssetLocation({
      owner: entry.owner,
      pocket: entry.pocket,
      situationMatrimoniale: civil.situationMatrimoniale,
    }) ?? {
      owner: 'epoux1' as const,
      pocket: 'epoux1' as const,
    };

    return {
      ...entry,
      ...location,
    };
  });

  return {
    version: 20,
    form,
    civil,
    liquidation,
    devolution,
    patrimonial,
    enfants,
    familyMembers,
    donations,
    assetEntries: normalizedAssetEntries,
    assuranceVieEntries,
    perEntries,
    groupementFoncierEntries: normalizedGroupementFoncierEntries,
    prevoyanceDecesEntries,
    ui: {
      chainOrder,
    },
  };
}
