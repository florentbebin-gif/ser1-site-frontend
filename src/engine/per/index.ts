/**
 * PER Engine — barrel exports
 */

export { calculatePerPotentiel } from './perPotentiel';
export { estimerSituationFiscale } from './perIrEstimation';
export {
  computePlafond163Q,
  computePlafond163QBrut,
  computeProjectedPlafond163Q,
  computeProfessionalDeduction,
  computeRevenuImposable,
} from './plafond163Q';
export { computePlafondMadelin, isTNS } from './plafondMadelin';
export { computeDeclaration2042 } from './perDeclarationFlow';
export { computePerDeductionFlow } from './perDeductionFlow';
export { computeProjectionAvis } from './perProjectionAvis';
export {
  computeAnnuityConversion,
  computeAnnuityFactor,
  computePerTransfert,
  computePrefonRente,
  resolveMortalityTableFromContractLabel,
  resolvePerCompartiment,
} from './transfert';

export type {
  PerPotentielInput,
  PerPotentielResult,
  PerWarning,
  DeclarantRevenus,
  AvisIrPlafonds,
  PerHistoricalBasis,
  PerYearKey,
  SituationFiscaleInput,
  SituationFiscaleResult,
  PlafondDetail,
  PlafondMadelinDetail,
  SimulationVersement,
  PerDeductionDetail,
  PerDeductionFlow,
  PerProjectionAvisDetail,
} from './types';

export type {
  PerTransfertAnnuityOptions,
  PerTransfertFiscalAssumptions,
  PerTransfertInput,
  PerTransfertProductType,
  PerTransfertResult,
  PerTransfertSex,
} from './transfert';
