import type { AssociateRevenuePhaseInput } from './types';

export type PhaseIdFactory = () => string;

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function positiveAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function sortPhases(phases: AssociateRevenuePhaseInput[]): AssociateRevenuePhaseInput[] {
  return [...phases].sort((a, b) => a.startYear - b.startYear);
}

export function getActivePhase(
  phases: AssociateRevenuePhaseInput[],
  anneeCivile: number,
): AssociateRevenuePhaseInput | undefined {
  let active: AssociateRevenuePhaseInput | undefined;
  for (const phase of sortPhases(phases)) {
    if (phase.startYear <= anneeCivile) active = phase;
    else break;
  }
  return active;
}

export function getPhaseEndYear(
  phase: AssociateRevenuePhaseInput,
  allPhases: AssociateRevenuePhaseInput[],
  horizonYear: number,
): number {
  const sorted = sortPhases(allPhases);
  const index = sorted.findIndex(item => item.id === phase.id);
  const next = index >= 0 ? sorted[index + 1] : undefined;
  return next ? next.startYear - 1 : horizonYear;
}

function defaultPhaseId(): string {
  return `phase-${Date.now()}`;
}

export function buildNextPhase(
  phases: AssociateRevenuePhaseInput[],
  fallbackYear: number,
  createId: PhaseIdFactory = defaultPhaseId,
): AssociateRevenuePhaseInput {
  const sorted = sortPhases(phases);
  const last = sorted[sorted.length - 1];
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
  phases: AssociateRevenuePhaseInput[],
  nextPhase: AssociateRevenuePhaseInput,
): AssociateRevenuePhaseInput[] {
  return sortPhases([...phases, nextPhase]);
}

export function removePhase(
  phases: AssociateRevenuePhaseInput[],
  phaseId: string,
): AssociateRevenuePhaseInput[] {
  if (phases.length <= 1) return phases;
  return sortPhases(phases.filter(phase => phase.id !== phaseId));
}

export function updatePhase(
  phases: AssociateRevenuePhaseInput[],
  phaseId: string,
  patch: Partial<AssociateRevenuePhaseInput>,
): AssociateRevenuePhaseInput[] {
  return sortPhases(phases.map(phase =>
    phase.id === phaseId ? { ...phase, ...patch } : phase,
  ));
}

export function computeNetRevenue(phase: AssociateRevenuePhaseInput): number {
  if (phase.source === 'none') return 0;
  return positiveAmount(phase.loadedAnnualCost) * (1 - clampRate(phase.socialChargeRate));
}

export function computeComplement(phase: AssociateRevenuePhaseInput): number {
  return Math.max(0, positiveAmount(phase.annualNetIncomeNeed) - computeNetRevenue(phase));
}
