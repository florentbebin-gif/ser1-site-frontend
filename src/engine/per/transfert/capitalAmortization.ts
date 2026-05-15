import type { PerTransfertCapitalHorizon, PerTransfertCapitalScheduleRow } from './types';

interface ProjectCapitalInput {
  capital: number;
  annualRate: number;
  years: number;
}

interface CapitalHorizonInput {
  capital: number;
  annualRate: number;
  liquidationAge: number;
  horizonAge: number;
}

const EPSILON = 0.0000001;

function toPositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function projectCapital({ capital, annualRate, years }: ProjectCapitalInput): number {
  const safeCapital = toPositive(capital);
  const safeYears = Math.max(0, Math.floor(years));
  if (safeCapital === 0 || safeYears === 0) return safeCapital;
  return safeCapital * ((1 + annualRate) ** safeYears);
}

export function computeAnnualWithdrawal(capital: number, annualRate: number, years: number): number {
  const safeCapital = toPositive(capital);
  const safeYears = Math.max(0, Math.floor(years));
  if (safeCapital === 0 || safeYears === 0) return safeCapital;
  if (Math.abs(annualRate) < EPSILON) return safeCapital / safeYears;
  return safeCapital * annualRate / (1 - ((1 + annualRate) ** -safeYears));
}

export function buildCapitalSchedule(input: CapitalHorizonInput): PerTransfertCapitalScheduleRow[] {
  const years = Math.max(0, Math.floor(input.horizonAge - input.liquidationAge));
  const withdrawal = computeAnnualWithdrawal(input.capital, input.annualRate, years);
  const rows: PerTransfertCapitalScheduleRow[] = [];
  let opening = toPositive(input.capital);

  for (let index = 0; index < years; index += 1) {
    const interests = opening * input.annualRate;
    const closingCapital = Math.max(0, opening + interests - withdrawal);
    rows.push({
      age: input.liquidationAge + index + 1,
      openingCapital: opening,
      interests,
      withdrawal,
      closingCapital,
    });
    opening = closingCapital;
  }

  return rows;
}

export function computeCapitalHorizon(input: CapitalHorizonInput): PerTransfertCapitalHorizon {
  const years = Math.max(0, Math.floor(input.horizonAge - input.liquidationAge));
  const annualWithdrawal = computeAnnualWithdrawal(input.capital, input.annualRate, years);
  const schedule = buildCapitalSchedule(input);
  const lastRow = schedule.length > 0 ? schedule[schedule.length - 1] : null;
  const residualCapital = lastRow?.closingCapital ?? Math.max(0, input.capital - annualWithdrawal);

  return {
    horizonAge: input.horizonAge,
    years,
    annualWithdrawal,
    cumulativeWithdrawals: annualWithdrawal * years,
    residualCapital,
  };
}
