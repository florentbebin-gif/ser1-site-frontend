import type { DeclarantRevenus, PerDeductionDetail, PerDeductionFlow, PlafondDetail } from './types';

interface DeductionContext {
  declarant1: DeclarantRevenus;
  declarant2?: DeclarantRevenus;
  plafond1: PlafondDetail;
  plafond2?: PlafondDetail;
  mutualisationConjoints: boolean;
}

function computePersonalContribution(declarant: DeclarantRevenus): number {
  return Math.max(0, (declarant.cotisationsPer163Q || 0) + (declarant.cotisationsPerp || 0));
}

function buildDetail(
  plafondDisponible: number,
  cotisationsVersees: number,
  mutualisationRecue: number,
  mutualisationCedee: number,
): PerDeductionDetail {
  const plafondApresMutualisation = Math.max(0, plafondDisponible + mutualisationRecue - mutualisationCedee);
  const cotisationsRetenuesIr = Math.min(cotisationsVersees, plafondApresMutualisation);
  const cotisationsNonDeductibles = Math.max(0, cotisationsVersees - cotisationsRetenuesIr);
  const disponibleRestant = Math.max(
    0,
    plafondDisponible - Math.min(plafondDisponible, cotisationsRetenuesIr) - mutualisationCedee,
  );

  return {
    plafondDisponible,
    plafondApresMutualisation,
    cotisationsVersees,
    cotisationsRetenuesIr,
    cotisationsNonDeductibles,
    mutualisationRecue,
    mutualisationCedee,
    disponibleRestant,
  };
}

export function computePerDeductionFlow({
  declarant1,
  declarant2,
  plafond1,
  plafond2,
  mutualisationConjoints,
}: DeductionContext): PerDeductionFlow {
  const cotisationsD1 = computePersonalContribution(declarant1);
  const cotisationsD2 = declarant2 ? computePersonalContribution(declarant2) : 0;
  const plafondDisponibleD1 = Math.max(0, plafond1.totalDisponible);
  const plafondDisponibleD2 = Math.max(0, plafond2?.totalDisponible ?? 0);

  const surplusD1 = Math.max(0, cotisationsD1 - plafondDisponibleD1);
  const surplusD2 = Math.max(0, cotisationsD2 - plafondDisponibleD2);
  const spareD1 = Math.max(0, plafondDisponibleD1 - cotisationsD1);
  const spareD2 = Math.max(0, plafondDisponibleD2 - cotisationsD2);

  const mutualisationRecueD1 = mutualisationConjoints ? Math.min(surplusD1, spareD2) : 0;
  const mutualisationRecueD2 = mutualisationConjoints ? Math.min(surplusD2, spareD1) : 0;

  const declarant1Detail = buildDetail(
    plafondDisponibleD1,
    cotisationsD1,
    mutualisationRecueD1,
    mutualisationRecueD2,
  );

  const declarant2Detail = declarant2
    ? buildDetail(
      plafondDisponibleD2,
      cotisationsD2,
      mutualisationRecueD2,
      mutualisationRecueD1,
    )
    : undefined;

  return {
    declarant1: declarant1Detail,
    declarant2: declarant2Detail,
    totalDeductionsIr:
      declarant1Detail.cotisationsRetenuesIr +
      (declarant2Detail?.cotisationsRetenuesIr ?? 0),
  };
}
