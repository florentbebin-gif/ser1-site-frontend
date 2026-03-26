import type {
  FamilyMember,
  PersistedSuccessionForm,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionDraftPayloadV26,
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
): SuccessionDraftPayloadV26 {
  const normalizedAssetEntries = assetEntries.map((entry) => {
    const location = resolveSuccessionAssetLocation({
      pocket: entry.pocket,
      situationMatrimoniale: civil.situationMatrimoniale,
      regimeMatrimonial: civil.regimeMatrimonial,
      pacsConvention: civil.pacsConvention,
    }) ?? {
      pocket: 'epoux1' as const,
    };

    return {
      ...entry,
      pocket: location.pocket,
    };
  });

  const normalizedGroupementFoncierEntries = groupementFoncierEntries.map((entry) => {
    const location = resolveSuccessionAssetLocation({
      pocket: entry.pocket,
      situationMatrimoniale: civil.situationMatrimoniale,
      regimeMatrimonial: civil.regimeMatrimonial,
      pacsConvention: civil.pacsConvention,
    }) ?? {
      pocket: 'epoux1' as const,
    };

    return {
      ...entry,
      pocket: location.pocket,
    };
  });

  return {
    version: 26,
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
