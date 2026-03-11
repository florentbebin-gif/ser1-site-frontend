import { computeAutoPartsWithChildren } from './parts';
import type { IrChild, EffectivePartsFullResult } from './types';

interface Abat10Cfg {
  plafond?: number | string | null;
  plancher?: number | string | null;
}

export function computeAbattement10(base: number, cfg: Abat10Cfg | null | undefined): number {
  if (!cfg || base <= 0) return 0;
  const plafond = Number(cfg.plafond) || 0;
  const plancher = Number(cfg.plancher) || 0;

  let val = base * 0.1;
  if (plafond > 0) val = Math.min(val, plafond);
  if (plancher > 0) val = Math.max(val, plancher);
  return val;
}

interface FullEffectivePartsInput {
  status: string;
  isIsolated?: boolean;
  children?: IrChild[];
  manualParts?: number;
}

export function computeEffectiveParts(input: FullEffectivePartsInput): EffectivePartsFullResult {
  const { status, isIsolated, children, manualParts } = input;
  const baseParts = status === 'couple' ? 2 : 1;
  const computedParts = computeAutoPartsWithChildren({
    status,
    isIsolated,
    children: Array.isArray(children) ? children : [],
  });

  const effectiveParts = Math.max(
    baseParts,
    Math.round((computedParts + (Number(manualParts) || 0)) * 4) / 4,
  );

  return { baseParts, computedParts, effectiveParts };
}

interface RealMode {
  d1?: string;
  d2?: string;
}

interface RealExpenses {
  d1?: number;
  d2?: number;
}

interface ExtraDeductionsInput {
  status: string;
  realMode?: RealMode | null;
  realExpenses?: RealExpenses | null;
  abat10SalD1: number;
  abat10SalD2: number;
}

export function computeExtraDeductions({
  status,
  realMode,
  realExpenses,
  abat10SalD1,
  abat10SalD2,
}: ExtraDeductionsInput): number {
  return (
    (realMode?.d1 === 'reels'
      ? realExpenses?.d1 || 0
      : realMode?.d1 === 'abat10'
        ? abat10SalD1
        : 0) +
    (status === 'couple'
      ? realMode?.d2 === 'reels'
        ? realExpenses?.d2 || 0
        : realMode?.d2 === 'abat10'
          ? abat10SalD2
          : 0
      : 0)
  );
}

export function countPersonsACharge(
  children: Array<{ mode?: string } | null | undefined> | null | undefined,
): number {
  return Array.isArray(children)
    ? children.filter((c) => c && (c.mode === 'charge' || c.mode === 'shared')).length
    : 0;
}
