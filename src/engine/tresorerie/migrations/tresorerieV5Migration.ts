import type { AssociateInput, AssociateRevenuePhaseInput } from '@/engine/tresorerie/types';
import type { TresoInputsV4, TresoInputsV5 } from '@/engine/tresorerie/legacy/types';
import { sortPhases } from '../revenuePhases';

type LegacyAssociateFields = {
  remunerationAnnualCost?: number;
  remunerationEndYear?: number;
  socialChargesManualRate?: number;
};

type AssociateWithMaybeV5 = AssociateInput & {
  revenuePhases?: AssociateRevenuePhaseInput[];
};

function currentYear(): number {
  return new Date().getFullYear();
}

function buildDefaultRevenuePhase(projectionStartYear: number): AssociateRevenuePhaseInput {
  return {
    id: 'phase-default',
    startYear: projectionStartYear,
    source: 'none',
    loadedAnnualCost: 0,
    socialChargeRate: 0,
    annualNetIncomeNeed: 0,
    useCcaForCompletion: true,
  };
}

function profileIncomeNeedStartYear(
  associate: AssociateWithMaybeV5,
  projectionStartYear: number,
): number {
  const currentAge = associate.profile?.currentAge;
  const retirementAge = associate.profile?.retirementAge;
  if (
    typeof currentAge !== 'number' ||
    typeof retirementAge !== 'number' ||
    !Number.isFinite(currentAge) ||
    !Number.isFinite(retirementAge)
  ) {
    return projectionStartYear;
  }
  return projectionStartYear + Math.max(0, retirementAge - currentAge);
}

function deriveRevenuePhasesFromLegacy(
  associate: AssociateWithMaybeV5,
  projectionStartYear: number,
): AssociateRevenuePhaseInput[] {
  if (associate.revenuePhases && associate.revenuePhases.length > 0) {
    return sortPhases(associate.revenuePhases);
  }

  const remuneration = associate.remuneration;
  const profileNeed = associate.profile?.annualIncomeNeed ?? 0;
  const phases: AssociateRevenuePhaseInput[] = [];
  const startYear = remuneration?.startYear ?? projectionStartYear;

  if (remuneration && remuneration.loadedAnnualCost > 0) {
    phases.push({
      id: 'phase-legacy-1',
      startYear,
      source: remuneration.source,
      subsidiaryId: remuneration.subsidiaryId,
      loadedAnnualCost: Math.max(0, remuneration.loadedAnnualCost),
      socialChargeRate: Math.max(0, Math.min(remuneration.socialChargeRate, 1)),
      annualNetIncomeNeed: 0,
      useCcaForCompletion: true,
    });
  }

  const annualNeedAfterStop = remuneration?.annualNeedAfterStop ?? 0;
  const annualNeed = Math.max(annualNeedAfterStop, profileNeed);
  if (annualNeed > 0) {
    const needStartYear =
      remuneration?.endYear != null
        ? remuneration.endYear + 1
        : annualNeedAfterStop > 0
          ? startYear
          : profileIncomeNeedStartYear(associate, projectionStartYear);
    if (needStartYear > projectionStartYear && phases.length === 0) {
      phases.push(buildDefaultRevenuePhase(projectionStartYear));
    }
    const existingSameStart = phases.find((phase) => phase.startYear === needStartYear);
    if (existingSameStart) {
      existingSameStart.annualNetIncomeNeed = annualNeed;
    } else {
      phases.push({
        id: 'phase-legacy-2',
        startYear: needStartYear,
        source: 'none',
        loadedAnnualCost: 0,
        socialChargeRate: Math.max(0, Math.min(remuneration?.socialChargeRate ?? 0, 1)),
        annualNetIncomeNeed: annualNeed,
        useCcaForCompletion: true,
      });
    }
  }

  return phases.length > 0 ? sortPhases(phases) : [buildDefaultRevenuePhase(projectionStartYear)];
}

export function buildTresoInputsV5FromV4(input: TresoInputsV4 | TresoInputsV5): TresoInputsV5 {
  if (input.version === 5) return input;
  const projectionStartYear = input.company.projectionStartYear ?? currentYear();
  return {
    ...input,
    version: 5,
    company: {
      ...input.company,
      projectionStartYear,
      associates: input.company.associates.map((associate) => {
        const legacyAssociate = associate as AssociateInput & LegacyAssociateFields;
        const associateWithRemuneration = {
          ...associate,
          remuneration: associate.remuneration ?? {
            source: 'holding' as const,
            loadedAnnualCost: Math.max(0, legacyAssociate.remunerationAnnualCost ?? 0),
            socialChargeRate: Math.max(0, legacyAssociate.socialChargesManualRate ?? 0),
            endYear: legacyAssociate.remunerationEndYear,
          },
        };
        const { remuneration: _remuneration, ...associateWithoutRemuneration } =
          associateWithRemuneration;
        return {
          ...associateWithoutRemuneration,
          profile: associate.profile
            ? { ...associate.profile, projectionStartYear }
            : associate.profile,
          revenuePhases: deriveRevenuePhasesFromLegacy(
            associateWithRemuneration,
            projectionStartYear,
          ),
        };
      }),
    },
  };
}
