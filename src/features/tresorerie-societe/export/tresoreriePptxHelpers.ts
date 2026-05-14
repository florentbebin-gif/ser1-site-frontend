import type { TresoInputsRuntime, TresoProjectionRow } from '@/engine/tresorerie/types';

export function fmtPct(n: number): string {
  return `${Math.round(n * 100) / 100} %`;
}

export function formatEuro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

export function positiveAmount(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

export function getMinimumBankBalance(inputs: TresoInputsRuntime): number {
  return positiveAmount(inputs.allocationMatrix.minimumBankBalance ?? inputs.allocationMatrix.sweepThreshold);
}

export function getWorkingCapitalRequirement(inputs: TresoInputsRuntime): number {
  return positiveAmount(inputs.company.incomeStatement?.workingCapitalRequirement);
}

export function getProtectedCash(inputs: TresoInputsRuntime): number {
  return getMinimumBankBalance(inputs) + getWorkingCapitalRequirement(inputs);
}

export function getBankEnd(row: TresoProjectionRow): number {
  return row.tresorerieBanqueFin ?? row.tresorerieFin;
}
