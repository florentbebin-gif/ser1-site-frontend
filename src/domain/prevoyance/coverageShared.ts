import type {
  PrevoyanceAmountRule,
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
  regime: PrevoyanceRegimeSettings | null;
  contracts: PrevoyanceContractDraft[];
  kind: PrevoyanceContractKind;
  maintienPalier: PrevoyanceMaintienPalier;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}

export interface InvaliditeCoverageInput {
  regime: PrevoyanceRegimeSettings | null;
  contracts: PrevoyanceContractDraft[];
  kind: PrevoyanceContractKind;
  referenceAnnual: number;
  salaireBrutAnnuel: number;
}

export type PrevoyanceMaintienPalier =
  | PrevoyanceMaintienEmployeurSettings['data']['maintienEmployeur']['paliers'][number]
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

export function buildMaintienSegment(
  fromDay: number,
  maintienPalier: PrevoyanceMaintienPalier,
): PrevoyanceCoverageSegment | null {
  if (!maintienPalier) return null;
  const firstEnd = maintienPalier.firstPeriodDays;
  const secondEnd = maintienPalier.firstPeriodDays + maintienPalier.secondPeriodDays;
  if (fromDay <= firstEnd) {
    return {
      kind: 'maintien',
      label: 'Maintien employeur',
      valuePct: clampPct(maintienPalier.firstPeriodRate),
    };
  }
  if (fromDay <= secondEnd) {
    return {
      kind: 'maintien',
      label: 'Maintien employeur',
      valuePct: clampPct(maintienPalier.secondPeriodRate),
    };
  }
  return null;
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
