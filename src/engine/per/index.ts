/**
 * PER Engine — barrel exports
 */

export { calculatePerPotentiel } from './perPotentiel';
export { estimerSituationFiscale } from './perIrEstimation';
export { computePlafond163Q, computePlafond163QBrut, computeRevenuImposable } from './plafond163Q';
export { computePlafondMadelin, isTNS } from './plafondMadelin';

export type {
  PerPotentielInput,
  PerPotentielResult,
  PerWarning,
  DeclarantRevenus,
  AvisIrPlafonds,
  PerHistoricalBasis,
  SituationFiscaleInput,
  SituationFiscaleResult,
  PlafondDetail,
  PlafondMadelinDetail,
  SimulationVersement,
} from './types';
