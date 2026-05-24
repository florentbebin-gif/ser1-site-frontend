import type {
  PrevoyanceAmountRule,
  PrevoyanceContractAggregationMode,
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from './types';

export type PrevoyanceCoverageSegmentKind = 'reference' | 'ro' | 'maintien' | 'contrat';

export interface PrevoyanceCoverageSegment {
  kind: PrevoyanceCoverageSegmentKind;
  label: string;
  valuePct: number;
}

export interface PrevoyanceCoverageBar {
  key: string;
  label: string;
  totalPct: number;
  segments: PrevoyanceCoverageSegment[];
}

export interface PrevoyanceRangeLike {
  from?: number;
  to?: number | null;
  fromDay?: number;
  toDay?: number | null;
}

export interface ArretCoverageInput {
  regimeStack?: PrevoyanceRegimeSettings[];
  contracts: PrevoyanceContractDraft[];
  kind: PrevoyanceContractKind;
  contractAggregationMode?: PrevoyanceContractAggregationMode;
  maintienPalier: PrevoyanceMaintienPalier;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}

export interface InvaliditeCoverageInput {
  regimeStack?: PrevoyanceRegimeSettings[];
  contracts: PrevoyanceContractDraft[];
  kind: PrevoyanceContractKind;
  contractAggregationMode?: PrevoyanceContractAggregationMode;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}

export type PrevoyanceMaintienPalier =
  | (PrevoyanceMaintienEmployeurSettings['data']['maintienEmployeur']['paliers'][number] & {
      carenceDays: number;
    })
  | null;

export function clampPct(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function annualValueFromAmountRule(
  amount: PrevoyanceAmountRule | null | undefined,
  referenceAnnual: number,
  salaireBrutAnnuel: number,
): number {
  if (!amount || amount.value === null) return 0;
  const value = Math.max(0, amount.value);
  if (amount.mode === 'fixed_eur_day') return value * 365;
  if (amount.mode === 'fixed_eur_month') return value * 12;
  if (amount.mode === 'fixed_eur_year') return value;
  if (amount.mode === 'percent_salary') return Math.max(0, salaireBrutAnnuel) * (value / 100);
  if (amount.mode === 'percent_income') return Math.max(0, referenceAnnual) * (value / 100);
  return 0;
}

export function dailyValueFromAmountRule(
  amount: PrevoyanceAmountRule | null | undefined,
  referenceAnnual: number,
  salaireBrutAnnuel: number,
): number {
  return annualValueFromAmountRule(amount, referenceAnnual, salaireBrutAnnuel) / 365;
}

export function percentOfReference(valueAnnual: number, referenceAnnual: number): number {
  if (referenceAnnual <= 0) return 0;
  return clampPct((valueAnnual / referenceAnnual) * 100);
}

export function maintienRateForDay(
  fromDay: number,
  maintienPalier: PrevoyanceMaintienPalier,
): number | null {
  if (!maintienPalier) return null;
  if (fromDay <= maintienPalier.carenceDays) return null;

  const maintainedDay = fromDay - maintienPalier.carenceDays;
  const firstEnd = maintienPalier.firstPeriodDays;
  const secondEnd = firstEnd + maintienPalier.secondPeriodDays;
  if (maintainedDay <= firstEnd) return clampPct(maintienPalier.firstPeriodRate);
  if (maintainedDay <= secondEnd) return clampPct(maintienPalier.secondPeriodRate);
  return null;
}

export function maintienRanges(maintienPalier: PrevoyanceMaintienPalier): PrevoyanceRangeLike[] {
  if (!maintienPalier) return [];
  const carenceEnd = maintienPalier.carenceDays;
  const firstStart = carenceEnd + 1;
  const firstEnd = carenceEnd + maintienPalier.firstPeriodDays;
  const secondStart = firstEnd + 1;
  const secondEnd = firstEnd + maintienPalier.secondPeriodDays;

  return [
    ...(carenceEnd > 0 ? [{ fromDay: 0, toDay: carenceEnd }] : []),
    ...(firstStart <= firstEnd ? [{ fromDay: firstStart, toDay: firstEnd }] : []),
    ...(secondStart <= secondEnd ? [{ fromDay: secondStart, toDay: secondEnd }] : []),
  ];
}

export function computeMaintienEmployeurEuro({
  fromDay,
  maintienPalier,
  roEuro,
  salaireBrutAnnuel,
}: {
  fromDay: number;
  maintienPalier: PrevoyanceMaintienPalier;
  roEuro: number;
  salaireBrutAnnuel: number;
}): number {
  const rate = maintienRateForDay(fromDay, maintienPalier);
  if (rate === null) return 0;
  const salaireBrutJournalier = Math.max(0, salaireBrutAnnuel) / 365;
  const cibleMaintien = salaireBrutJournalier * (rate / 100);
  return Math.max(0, cibleMaintien - Math.max(0, roEuro));
}

export function buildMaintienSegment({
  fromDay,
  maintienPalier,
  roEuro,
  referenceAnnual,
  salaireBrutAnnuel,
}: {
  fromDay: number;
  maintienPalier: PrevoyanceMaintienPalier;
  roEuro: number;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}): PrevoyanceCoverageSegment | null {
  const maintienEuro = computeMaintienEmployeurEuro({
    fromDay,
    maintienPalier,
    roEuro,
    salaireBrutAnnuel,
  });
  if (maintienEuro <= 0) return null;

  return {
    kind: 'maintien',
    label: 'Maintien employeur',
    valuePct: percentOfReference(maintienEuro * 365, referenceAnnual),
  };
}

export function findInvaliditePalier<T extends { fromRate: number; toRate?: number | null }>(
  paliers: T[],
  rate: number,
): T | null {
  return (
    paliers.find(
      (palier) =>
        rate >= palier.fromRate &&
        (palier.toRate === null || palier.toRate === undefined || rate <= palier.toRate),
    ) ??
    [...paliers].reverse().find((palier) => rate >= palier.fromRate) ??
    null
  );
}

export function computeInvaliditePalierAmount(
  palier: PrevoyanceContractDraft['invalidite']['paliers'][number],
  rate: number,
): number {
  if ('amount' in palier) {
    if (palier.mode === 'proportional_66') {
      return Math.round(Math.max(0, palier.referenceAmount) * (Math.max(0, rate) / 66));
    }
    return palier.amount;
  }

  if (palier.mode === 'proportional_66') {
    return Math.max(0, palier.referencePct ?? palier.salairePct) * (Math.max(0, rate) / 66);
  }
  return palier.salairePct;
}

export function normalizeRegimeStack(
  regimeStack: PrevoyanceRegimeSettings[] | null | undefined,
): PrevoyanceRegimeSettings[] {
  if (!Array.isArray(regimeStack)) return [];
  const seen = new Set<string>();
  return regimeStack.filter((regime) => {
    if (!regime || seen.has(regime.code)) return false;
    seen.add(regime.code);
    return true;
  });
}
