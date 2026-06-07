export { buildDossierRailViewModel, getPreferredJourneyIdForSimulator } from './railViewModel';
export { DOSSIER_CHAIN_LABELS } from './chainLabels';
export {
  createEmptyDossierPatrimonial,
  DOSSIER_PATRIMONIAL_COMPLETION_LABELS,
  evaluateDossierPatrimonialCompletion,
} from './patrimonial';
export {
  buildDossierPatrimonialFromAudit,
  mergeDossierPatrimonialIntoAuditDraft,
} from './auditAdapter';
export {
  DOSSIERS_PATRIMONIAUX_TABLE,
  fromDossierPatrimonialRow,
  toDossierPatrimonialUpsertRow,
} from './persistence';
export type { DossierChainDirection } from './chainLabels';
export type {
  DossierCompletion,
  DossierCompletionStatus,
  DossierContrainte,
  DossierContraintePriority,
  DossierDonationSynthetique,
  DossierDonationType,
  DossierFoyer,
  DossierMembre,
  DossierMembreRole,
  DossierObjectif,
  DossierOperationPrevue,
  DossierOperationStatus,
  DossierPatrimonial,
  DossierPatrimonialStatus,
  DossierRegimeMatrimonial,
  DossierRegimeMatrimonialCode,
  DossierRequiredField,
  DossierSituationFamiliale,
  DossierSituationFamilialeStatut,
} from './patrimonial';
export type {
  DossierPatrimonialListRow,
  DossierPatrimonialPayload,
  DossierPatrimonialRow,
  DossierPatrimonialUpsertRow,
} from './persistence';
export type {
  DossierRailBranchView,
  DossierRailDensity,
  DossierRailJourneyView,
  DossierRailRouteContext,
  DossierRailRouteKind,
  DossierRailStepAvailability,
  DossierRailStepKind,
  DossierRailStepView,
  DossierRailViewModel,
  DossierVersion,
  DossierVersionStatus,
  SourceRef,
  SourceRefKind,
  SourceRefReviewStatus,
  SourceRefScope,
  StrategyActivation,
} from './types';
export { WORKING_DOSSIER_VERSION } from './types';
