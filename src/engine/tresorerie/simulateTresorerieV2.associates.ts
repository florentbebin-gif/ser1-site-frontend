import {
  computeNetRevenue,
  getAssociateRevenuePhaseForYear,
  isRevenuePhaseV6,
} from './revenuePhases';
import { isCivilYearBeforeOrEqual } from './simulateTresorerieV2.helpers';
import type { CcaScheduleInput, RuntimeAssociateInput, RuntimeCompanyInput } from './types';

function getLegacyCcaSchedule(cca: RuntimeAssociateInput['cca']): CcaScheduleInput | undefined {
  return cca && 'annualContribution' in cca ? cca : undefined;
}

export function getIncomeStatement(company: RuntimeCompanyInput): {
  annualRevenue: number;
  annualStructureCosts: number;
  workingCapitalRequirement: number;
} {
  return (
    company.incomeStatement ?? {
      annualRevenue: 0,
      annualStructureCosts: company.annualStructureCosts,
      workingCapitalRequirement: 0,
    }
  );
}

export function getInitialCcaBalance(associate: RuntimeAssociateInput): number {
  return Math.max(0, associate.cca?.currentBalance ?? 0);
}

export function getAnnualCcaContribution(
  associate: RuntimeAssociateInput,
  anneeCivile: number,
): number {
  const phase = getAssociateRevenuePhaseForYear(associate, anneeCivile);
  if (isRevenuePhaseV6(phase)) {
    const annual = phase.ccaContribution.annual;
    if (!phase.ccaContribution.enabled || !annual) return 0;
    return Math.max(0, annual.amount);
  }

  const contribution = getLegacyCcaSchedule(associate.cca)?.annualContribution;
  if (!contribution) return 0;
  const isActive =
    anneeCivile >= contribution.startYear &&
    (contribution.endYear == null || anneeCivile <= contribution.endYear);
  return isActive ? Math.max(0, contribution.amount) : 0;
}

export function getExceptionalCcaContribution(
  associate: RuntimeAssociateInput,
  anneeCivile: number,
): number {
  const phase = getAssociateRevenuePhaseForYear(associate, anneeCivile);
  if (isRevenuePhaseV6(phase)) {
    const exceptional = phase.ccaContribution.exceptional;
    return phase.ccaContribution.enabled && exceptional?.year === anneeCivile
      ? Math.max(0, exceptional.amount)
      : 0;
  }

  return (
    getLegacyCcaSchedule(associate.cca)
      ?.exceptionalContributions.filter((contribution) => contribution.year === anneeCivile)
      .reduce((sum, contribution) => sum + Math.max(0, contribution.amount), 0) ?? 0
  );
}

export function getAssociateRemunerationForYear(
  associate: RuntimeAssociateInput,
  anneeCivile: number,
): { holdingCost: number; netRevenue: number } {
  const phase = getAssociateRevenuePhaseForYear(associate, anneeCivile);
  if (phase) {
    if (isRevenuePhaseV6(phase)) {
      const remuneration = phase.remuneration;
      const loadedAnnualCost = Math.max(0, remuneration.loadedAnnualCost);
      return {
        holdingCost:
          remuneration.enabled && remuneration.source === 'holding' ? loadedAnnualCost : 0,
        netRevenue: computeNetRevenue(phase),
      };
    }

    const loadedAnnualCost = Math.max(0, phase.loadedAnnualCost);
    return {
      holdingCost: phase.source === 'holding' ? loadedAnnualCost : 0,
      netRevenue: computeNetRevenue(phase),
    };
  }

  const remuneration = associate.remuneration;
  if (!remuneration) return { holdingCost: 0, netRevenue: 0 };
  const startsBeforeOrDuringYear =
    remuneration.startYear == null || anneeCivile >= remuneration.startYear;
  if (!startsBeforeOrDuringYear || !isCivilYearBeforeOrEqual(remuneration.endYear, anneeCivile)) {
    return { holdingCost: 0, netRevenue: 0 };
  }

  const loadedAnnualCost = Math.max(0, remuneration.loadedAnnualCost);
  const socialChargeRate = Math.max(0, Math.min(remuneration.socialChargeRate, 1));
  return {
    holdingCost: remuneration.source === 'holding' ? loadedAnnualCost : 0,
    netRevenue: loadedAnnualCost * (1 - socialChargeRate),
  };
}
