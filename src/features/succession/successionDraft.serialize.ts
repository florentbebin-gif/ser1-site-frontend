import type {
  FamilyMember,
  PersistedSuccessionForm,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionDraftPayloadV17,
  SuccessionEnfant,
  SuccessionLiquidationContext,
  SuccessionPerEntry,
  SuccessionPatrimonialContext,
} from './successionDraft.types';

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
): SuccessionDraftPayloadV17 {
  return {
    version: 17,
    form,
    civil,
    liquidation,
    devolution,
    patrimonial,
    enfants,
    familyMembers,
    donations,
    assetEntries,
    assuranceVieEntries,
    perEntries,
  };
}
