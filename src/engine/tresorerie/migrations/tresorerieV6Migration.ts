import type {
  AssociateRevenuePhaseInput,
  AssociateRevenuePhaseInputV6,
  AssociateInputV6,
  CompanyInputV6,
  TresoInputsV5,
  TresoInputsV6,
} from '@/engine/tresorerie/types';
import { sortPhases } from '../revenuePhases';

function currentYear(): number {
  return new Date().getFullYear();
}

function getV5PhaseEndYear(
  phases: AssociateRevenuePhaseInput[],
  index: number,
  projectionStartYear: number,
  horizonYears: number,
): number {
  const next = phases[index + 1];
  return next ? next.startYear - 1 : projectionStartYear + horizonYears - 1;
}

function phaseV5ToV6(
  phase: AssociateRevenuePhaseInput,
  endYear: number,
): AssociateRevenuePhaseInputV6 {
  return {
    id: phase.id,
    startYear: phase.startYear,
    endYear,
    label: phase.label,
    remuneration: {
      enabled: phase.source !== 'none',
      source: phase.source,
      subsidiaryId: phase.subsidiaryId,
      loadedAnnualCost: Math.max(0, phase.loadedAnnualCost),
      socialChargeRate: Math.max(0, Math.min(phase.socialChargeRate, 1)),
    },
    distribution: {
      enabled: Math.max(0, phase.annualNetIncomeNeed) > 0,
      annualNetIncomeNeed: Math.max(0, phase.annualNetIncomeNeed),
      dividendsStrategy: 'max_treso',
    },
    ccaContribution: {
      enabled: false,
    },
    ccaRepayment: {
      enabled: phase.useCcaForCompletion === true,
      strategy: 'max_treso',
    },
  };
}

function attachAnnualCcaContribution(
  phase: AssociateRevenuePhaseInputV6,
  amount: number,
  startYear: number,
  endYear: number,
): AssociateRevenuePhaseInputV6 {
  const intersectionStart = Math.max(startYear, phase.startYear);
  const intersectionEnd = Math.min(endYear, phase.endYear);
  if (intersectionStart > intersectionEnd) return phase;
  return {
    ...phase,
    ccaContribution: {
      ...phase.ccaContribution,
      enabled: true,
      annual: {
        amount,
        startYear: intersectionStart,
        endYear: intersectionEnd,
      },
    },
  };
}

function attachExceptionalCcaContribution(
  phase: AssociateRevenuePhaseInputV6,
  contribution: { year: number; amount: number },
): AssociateRevenuePhaseInputV6 {
  if (contribution.year < phase.startYear || contribution.year > phase.endYear) return phase;
  return {
    ...phase,
    ccaContribution: {
      ...phase.ccaContribution,
      enabled: true,
      exceptional: {
        year: contribution.year,
        amount: Math.max(0, contribution.amount),
      },
    },
  };
}

function buildAssociateV6FromV5(
  associate: TresoInputsV5['company']['associates'][number],
  projectionStartYear: number,
  horizonYears: number,
): AssociateInputV6 {
  const sortedPhases = sortPhases(associate.revenuePhases);
  const basePhases = sortedPhases.map((phase, index) =>
    phaseV5ToV6(phase, getV5PhaseEndYear(sortedPhases, index, projectionStartYear, horizonYears)),
  );
  const annualContribution = associate.cca?.annualContribution;
  const annualEndYear = annualContribution
    ? (annualContribution.endYear ?? projectionStartYear + horizonYears - 1)
    : projectionStartYear + horizonYears - 1;
  const withAnnual =
    annualContribution && annualContribution.amount > 0
      ? basePhases.map((phase) =>
          attachAnnualCcaContribution(
            phase,
            Math.max(0, annualContribution.amount),
            annualContribution.startYear,
            annualEndYear,
          ),
        )
      : basePhases;

  const exceptionalContributions = associate.cca?.exceptionalContributions ?? [];
  const withExceptional = exceptionalContributions.reduce((phases, contribution) => {
    let matched = false;
    const nextPhases = phases.map((phase) => {
      const nextPhase = attachExceptionalCcaContribution(phase, contribution);
      if (nextPhase !== phase) matched = true;
      return nextPhase;
    });
    if (!matched && contribution.amount > 0) {
      console.warn(
        `[Trésorerie société] Apport CCA exceptionnel ignoré hors fenêtre de paliers : ${contribution.year}.`,
      );
    }
    return nextPhases;
  }, withAnnual);

  return {
    ...associate,
    cca: associate.cca
      ? {
          currentBalance: associate.cca.currentBalance,
          remunerationRate: associate.cca.remunerationRate,
        }
      : undefined,
    revenuePhases: withExceptional,
  };
}

export function buildTresoInputsV6FromV5(input: TresoInputsV5 | TresoInputsV6): TresoInputsV6 {
  if (input.version === 6) return input;
  const projectionStartYear = input.company.projectionStartYear ?? currentYear();
  const horizonYears = 15;
  const company: CompanyInputV6 = {
    ...input.company,
    legalReserveInitial: input.company.legalReserveInitial ?? 0,
    associates: input.company.associates.map((associate) =>
      buildAssociateV6FromV5(associate, projectionStartYear, horizonYears),
    ),
  };
  return {
    ...input,
    version: 6,
    company,
  };
}
