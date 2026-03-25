export type {
  FamilyBranch,
  FamilyMember,
  FamilyMemberType,
  PacsConvention,
  PersistedHeritierRow,
  PersistedSuccessionForm,
  SituationMatrimoniale,
  SuccessionAssetCategory,
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionAssuranceVieContractType,
  SuccessionAssuranceVieEntry,
  SuccessionBeneficiaryRef,
  SuccessionChoixLegalConjointSansDDV,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDevolutionContextInput,
  SuccessionDispositionTestamentaire,
  SuccessionDonationEntreEpouxOption,
  SuccessionDonationEntry,
  SuccessionDonationEntryType,
  SuccessionDraftPayloadV18,
  SuccessionDraftPayloadV19,
  SuccessionDraftPayloadV20,
  SuccessionEnfant,
  SuccessionEnfantRattachement,
  SuccessionGroupementFoncierEntry,
  SuccessionLiquidationContext,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
  GroupementFoncierType,
  SuccessionParticularLegacyEntry,
  SuccessionPatrimonialContext,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from './successionDraft.types';

export type {
  SuccessionAssetPocket,
  SuccessionLegacyAssetOwner,
  SuccessionPersonParty,
} from './successionPatrimonialModel';

export {
  buildSuccessionAssetOwnerOptions,
  buildSuccessionAssetPocketOptions,
  getSuccessionAssetPocketFromOwner,
  getSuccessionLegacyOwnerFromPocket,
  getSuccessionSharedPocketForContext,
  isSuccessionAssetPocket,
  isSuccessionLegacyAssetOwner,
  resolveSuccessionAssetLocation,
} from './successionPatrimonialModel';

export {
  DEFAULT_SUCCESSION_ASSET_DETAILS,
  DEFAULT_SUCCESSION_ASSURANCE_VIE,
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_DONATIONS,
  DEFAULT_SUCCESSION_ENFANTS_CONTEXT,
  DEFAULT_SUCCESSION_FAMILY_MEMBERS,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PER,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
} from './successionDraft.defaults';

export { buildSuccessionDraftPayload } from './successionDraft.serialize';
export { parseSuccessionDraftPayload } from './successionDraft.parse';
