import type {
  AssociateRevenuePhaseInput,
  AssociateRevenuePhaseInputV6,
  RuntimeAssociateInput,
} from './types';

export type PhaseIdFactory = () => string;
export type RevenuePhaseInput = AssociateRevenuePhaseInput | AssociateRevenuePhaseInputV6;

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function positiveAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function isRevenuePhaseV6(
  phase: RevenuePhaseInput | undefined,
): phase is AssociateRevenuePhaseInputV6 {
  return Boolean(phase && 'remuneration' in phase);
}

function getDistributionAnnualNeed(phase: AssociateRevenuePhaseInputV6): number {
  if (!phase.distribution.enabled) return 0;
  if (phase.distribution.dividendsStrategy === 'montant_cible') {
    return positiveAmount(phase.distribution.dividendsTargetAmountNet ?? 0);
  }
  return positiveAmount(phase.distribution.annualNetIncomeNeed);
}

export function sortPhases<T extends { startYear: number }>(phases: T[]): T[] {
  return [...phases].sort((a, b) => a.startYear - b.startYear);
}

export function getActivePhase(
  phases: RevenuePhaseInput[],
  anneeCivile: number,
): RevenuePhaseInput | undefined {
  let active: RevenuePhaseInput | undefined;
  for (const phase of sortPhases(phases)) {
    if (isRevenuePhaseV6(phase)) {
      if (phase.startYear <= anneeCivile && anneeCivile <= phase.endYear) active = phase;
      if (phase.startYear > anneeCivile) break;
      continue;
    }
    if (phase.startYear <= anneeCivile) active = phase;
    else break;
  }
  return active;
}

function getAssociateRevenuePhases(associate: RuntimeAssociateInput): RevenuePhaseInput[] {
  const phases = (
    associate as RuntimeAssociateInput & {
      revenuePhases?: RevenuePhaseInput[];
    }
  ).revenuePhases;
  return Array.isArray(phases) ? phases : [];
}

export function getAssociateRevenuePhaseForYear(
  associate: RuntimeAssociateInput,
  anneeCivile: number,
): RevenuePhaseInput | undefined {
  const phases = getAssociateRevenuePhases(associate);
  return phases.length > 0 ? getActivePhase(phases, anneeCivile) : undefined;
}

export function getAssociateAnnualIncomeNeedForYear(
  associate: RuntimeAssociateInput,
  defaultAnnualNeed: number,
  anneeCivile: number,
): number {
  const phase = getAssociateRevenuePhaseForYear(associate, anneeCivile);
  if (phase) {
    return isRevenuePhaseV6(phase)
      ? getDistributionAnnualNeed(phase)
      : positiveAmount(phase.annualNetIncomeNeed);
  }

  const remuneration = associate.remuneration;
  if (
    remuneration?.endYear != null &&
    anneeCivile > remuneration.endYear &&
    positiveAmount(remuneration.annualNeedAfterStop ?? 0) > 0
  ) {
    return positiveAmount(remuneration.annualNeedAfterStop ?? 0);
  }
  return positiveAmount(defaultAnnualNeed);
}

export function hasAssociateAnnualIncomeNeedForYear(
  associate: RuntimeAssociateInput,
  fallbackNeedActive: boolean,
  anneeCivile: number,
): boolean {
  const phase = getAssociateRevenuePhaseForYear(associate, anneeCivile);
  if (phase) {
    return isRevenuePhaseV6(phase)
      ? getDistributionAnnualNeed(phase) > 0
      : positiveAmount(phase.annualNetIncomeNeed) > 0;
  }

  const remuneration = associate.remuneration;
  return (
    fallbackNeedActive ||
    (remuneration?.endYear != null &&
      anneeCivile > remuneration.endYear &&
      positiveAmount(remuneration.annualNeedAfterStop ?? 0) > 0)
  );
}

export function getPhaseEndYear(
  phase: RevenuePhaseInput,
  allPhases: RevenuePhaseInput[],
  horizonYear: number,
): number {
  if (isRevenuePhaseV6(phase)) return phase.endYear;
  const sorted = sortPhases(allPhases);
  const index = sorted.findIndex((item) => item.id === phase.id);
  const next = index >= 0 ? sorted[index + 1] : undefined;
  return next ? next.startYear - 1 : horizonYear;
}

function defaultPhaseId(): string {
  return `phase-${Date.now()}`;
}

export function buildNextPhase(
  phases: RevenuePhaseInput[],
  fallbackYear: number,
  createId: PhaseIdFactory = defaultPhaseId,
): RevenuePhaseInput {
  const sorted = sortPhases(phases);
  const last = sorted[sorted.length - 1];
  if (isRevenuePhaseV6(last)) {
    return {
      id: createId(),
      startYear: last.endYear + 1,
      endYear: last.endYear + 1,
      remuneration: { ...last.remuneration },
      distribution: { ...last.distribution },
      ccaContribution: { enabled: false },
      ccaRepayment: { ...last.ccaRepayment },
    };
  }
  return {
    id: createId(),
    startYear: last ? last.startYear + 1 : fallbackYear,
    source: last?.source ?? 'none',
    subsidiaryId: last?.subsidiaryId,
    loadedAnnualCost: positiveAmount(last?.loadedAnnualCost ?? 0),
    socialChargeRate: clampRate(last?.socialChargeRate ?? 0),
    annualNetIncomeNeed: positiveAmount(last?.annualNetIncomeNeed ?? 0),
    useCcaForCompletion: last?.useCcaForCompletion ?? true,
  };
}

export function addPhase(
  phases: RevenuePhaseInput[],
  nextPhase: RevenuePhaseInput,
): RevenuePhaseInput[] {
  return sortPhases([...phases, nextPhase]);
}

export function removePhase(phases: RevenuePhaseInput[], phaseId: string): RevenuePhaseInput[] {
  if (phases.length <= 1) return phases;
  return sortPhases(phases.filter((phase) => phase.id !== phaseId));
}

export function updatePhase(
  phases: RevenuePhaseInput[],
  phaseId: string,
  patch: Partial<RevenuePhaseInput>,
): RevenuePhaseInput[] {
  return sortPhases(phases.map((phase) => (phase.id === phaseId ? { ...phase, ...patch } : phase)));
}

export function computeNetRevenue(phase: RevenuePhaseInput): number {
  if (isRevenuePhaseV6(phase)) {
    if (!phase.remuneration.enabled || phase.remuneration.source === 'none') return 0;
    return (
      positiveAmount(phase.remuneration.loadedAnnualCost) *
      (1 - clampRate(phase.remuneration.socialChargeRate))
    );
  }
  return phase.source === 'none'
    ? 0
    : positiveAmount(phase.loadedAnnualCost) * (1 - clampRate(phase.socialChargeRate));
}

export function computeComplement(phase: RevenuePhaseInput): number {
  const annualNeed = isRevenuePhaseV6(phase)
    ? getDistributionAnnualNeed(phase)
    : phase.annualNetIncomeNeed;
  return Math.max(0, positiveAmount(annualNeed) - computeNetRevenue(phase));
}
