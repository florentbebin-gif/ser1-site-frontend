export {
  findBaseCgContractById,
  isPointsContract,
  isRemovedBaseCgRetraiteContract,
  listBaseCgCompagnies,
  listBaseCgTypes,
  normalizeBaseCgRetraiteCompanyName,
  normalizeBaseCgRetraiteContractCompany,
  resolveBaseCgRetraiteCompartment,
} from './catalog';
export {
  PREFON_2025,
  PREFON_USER_2026_SERVICE_VALUE,
  PREFON_USER_2026_SOURCE_LABEL,
} from './prefon';
export { BASE_CG_RETRAITE_LEGAL_NOTICE } from './legal';
export {
  formatBaseCgRetraiteDocumentNotice,
  formatBaseCgRetraiteDocumentsNotice,
  getBaseCgRetraiteDocumentAccessLabel,
  getBaseCgRetraiteDocumentTypeLabel,
  getBaseCgRetraiteDocumentVersionLabel,
} from './documentLabels';
export { TYPE_LABELS, COMPARTMENT_LABELS } from './labels';

export {
  formatBaseCgRetraiteRateField,
  formatBaseCgRetraiteValue,
  hasBaseCgRetraiteValue,
  normalizeBaseCgRetraiteGestionFees,
} from './retirementNormalization';
export type {
  BaseCgPhaseEpargne,
  BaseCgPhaseLiquidation,
  BaseCgRetraiteContract,
  BaseCgRetraiteContractType,
  BaseCgRetraiteDocument,
  BaseCgRetraitePrefonPocket,
  PerTransfertCompartment,
  PrefonPointsParams,
  PrefonReversionCoefficient,
} from './types';
