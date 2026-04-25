import type { AvisIrPlafonds, PerProjectionAvisDetail } from '../../../engine/per';

export function projectionToAvisIrPlafonds(
  projection: PerProjectionAvisDetail,
  incomeYear: number,
): AvisIrPlafonds {
  return {
    nonUtiliseAnnee1: projection.nonUtiliseN2,
    nonUtiliseAnnee2: projection.nonUtiliseN1,
    nonUtiliseAnnee3: projection.nonUtiliseN,
    plafondCalcule: projection.plafondCalculeN,
    anneeRef: incomeYear,
  };
}
