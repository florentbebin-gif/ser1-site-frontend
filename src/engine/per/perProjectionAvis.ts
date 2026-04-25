import type { AvisIrPlafonds, PerDeductionFlow, PerProjectionAvisDetail } from './types';

interface ProjectionDeclarantContext {
  avisIr?: AvisIrPlafonds;
  projectedPlafondCalcule: number;
  plafondDisponibleRestant: number;
  plafondDisponibleInitial: number;
}

interface ProjectionContext {
  avisIr?: AvisIrPlafonds;
  avisIr2?: AvisIrPlafonds;
  deductionFlow: PerDeductionFlow;
  projectedPlafondD1: number;
  projectedPlafondD2?: number;
}

function allocateNextAvis({
  avisIr,
  projectedPlafondCalcule,
  plafondDisponibleRestant,
  plafondDisponibleInitial,
}: ProjectionDeclarantContext): PerProjectionAvisDetail {
  const ancienN2 = avisIr?.nonUtiliseAnnee2 ?? 0;
  const ancienN1 = avisIr?.nonUtiliseAnnee3 ?? 0;
  const ancienN = avisIr?.plafondCalcule ?? 0;
  const ancienN3 = avisIr?.nonUtiliseAnnee1 ?? 0;
  const consommation = Math.max(0, Math.round(plafondDisponibleInitial - plafondDisponibleRestant));

  let resteAImputer = consommation;
  const consommationSurPlafondAnnee = Math.min(resteAImputer, Math.max(0, ancienN));
  resteAImputer -= consommationSurPlafondAnnee;
  const nonUtiliseN = Math.max(0, Math.round(ancienN - consommationSurPlafondAnnee));

  const consommationSurAncienN3 = Math.min(resteAImputer, Math.max(0, ancienN3));
  resteAImputer -= consommationSurAncienN3;

  const nonUtiliseN2 = Math.max(0, Math.round(ancienN2 - resteAImputer));
  resteAImputer = Math.max(0, resteAImputer - ancienN2);

  const nonUtiliseN1 = Math.max(0, Math.round(ancienN1 - resteAImputer));
  const plafondCalculeN = Math.max(0, Math.round(projectedPlafondCalcule));

  return {
    nonUtiliseN2,
    nonUtiliseN1,
    nonUtiliseN,
    plafondCalculeN,
    plafondTotal: Math.round(nonUtiliseN2 + nonUtiliseN1 + nonUtiliseN + plafondCalculeN),
  };
}

export function computeProjectionAvis({
  avisIr,
  avisIr2,
  deductionFlow,
  projectedPlafondD1,
  projectedPlafondD2,
}: ProjectionContext): {
  declarant1: PerProjectionAvisDetail;
  declarant2?: PerProjectionAvisDetail;
} {
  const declarant1 = allocateNextAvis({
    avisIr,
    projectedPlafondCalcule: projectedPlafondD1,
    plafondDisponibleInitial: deductionFlow.declarant1.plafondDisponible,
    plafondDisponibleRestant: deductionFlow.declarant1.disponibleRestant,
  });

  const declarant2 = deductionFlow.declarant2
    ? allocateNextAvis({
      avisIr: avisIr2,
      projectedPlafondCalcule: projectedPlafondD2 ?? 0,
      plafondDisponibleInitial: deductionFlow.declarant2.plafondDisponible,
      plafondDisponibleRestant: deductionFlow.declarant2.disponibleRestant,
    })
    : undefined;

  return { declarant1, declarant2 };
}
