export {
  BASECG_CATALOG,
  BASECG_EXTRACTED_COUNT,
  BASECG_VERSION,
  findBaseCgContractById,
  listBaseCgCompagnies,
  listBaseCgTypes,
} from './catalog';
export { PREFON_2025 } from './prefon';
export {
  BASE_CG_RETRAITE_LEGAL_NOTICE,
} from './legal';

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
  PerTransfertCompartment,
  PrefonPointsParams,
} from './types';
