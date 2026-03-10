import type {
  FamilyMember,
  PersistedSuccessionForm,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionDraftPayloadV16,
  SuccessionEnfant,
  SuccessionLiquidationContext,
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
): SuccessionDraftPayloadV16 {
  return {
    version: 16,
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
  };
}
