import type { PerTransfertCapitalHorizon, PerTransfertCapitalScheduleRow } from './types';
import type { PerTransfertCompartment, PerTransfertFiscalAssumptions } from './types';
import { computeCapitalFiscal } from './fiscaliteCapital';

interface ProjectCapitalInput {
  capital: number;
  annualRate: number;
  years: number;
}

interface CapitalHorizonInput {
  capital: number;
  gains?: number;
  annualRate: number;
  liquidationAge: number;
  horizonAge: number;
  compartment?: PerTransfertCompartment;
  tmiRetraite?: number;
  smallAnnuityEligible?: boolean;
  assumptions?: PerTransfertFiscalAssumptions;
}

const EPSILON = 0.0000001;

function toPositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function projectCapital({ capital, annualRate, years }: ProjectCapitalInput): number {
  const safeCapital = toPositive(capital);
  const safeYears = Math.max(0, Math.floor(years));
  if (safeCapital === 0 || safeYears === 0) return safeCapital;
  return safeCapital * (1 + annualRate) ** safeYears;
}

export function computeAnnualWithdrawal(
  capital: number,
  annualRate: number,
  years: number,
): number {
  const safeCapital = toPositive(capital);
  const safeYears = Math.max(0, Math.floor(years));
  if (safeCapital === 0 || safeYears === 0) return safeCapital;
  if (Math.abs(annualRate) < EPSILON) return safeCapital / safeYears;
  return (safeCapital * annualRate) / (1 - (1 + annualRate) ** -safeYears);
}

export function buildCapitalSchedule(input: CapitalHorizonInput): PerTransfertCapitalScheduleRow[] {
  const years = Math.max(0, Math.floor(input.horizonAge - input.liquidationAge));
  const rows: PerTransfertCapitalScheduleRow[] = [];
  let opening = toPositive(input.capital);
  let openingGains = Math.min(opening, toPositive(input.gains ?? 0));

  for (let index = 0; index < years; index += 1) {
    const remainingYears = years - index;
    const withdrawal = computeAnnualWithdrawal(opening, input.annualRate, remainingYears);
    const interests = opening * input.annualRate;
    const capitalBeforeWithdrawal = Math.max(0, opening + interests);
    const gainsBeforeWithdrawal = Math.min(
      capitalBeforeWithdrawal,
      openingGains + Math.max(0, interests),
    );
    const cappedWithdrawal = Math.min(withdrawal, capitalBeforeWithdrawal);
    const withdrawalGains =
      capitalBeforeWithdrawal > 0
        ? cappedWithdrawal * (gainsBeforeWithdrawal / capitalBeforeWithdrawal)
        : 0;
    const fiscal =
      input.compartment && input.assumptions
        ? computeCapitalFiscal({
            capital: cappedWithdrawal,
            gains: withdrawalGains,
            compartment: input.compartment,
            tmiRetraite: input.tmiRetraite ?? 0,
            smallAnnuityEligible: input.smallAnnuityEligible ?? false,
            assumptions: input.assumptions,
          })
        : {
            incomeTax: 0,
            socialContributions: 0,
            netOfSocialContributions: cappedWithdrawal,
            netOfAllTaxes: cappedWithdrawal,
            netIRPS: cappedWithdrawal,
          };
    const closingCapital = Math.max(0, capitalBeforeWithdrawal - cappedWithdrawal);
    rows.push({
      age: input.liquidationAge + index + 1,
      openingCapital: opening,
      interests,
      withdrawal: cappedWithdrawal,
      incomeTax: fiscal.incomeTax,
      socialContributions: fiscal.socialContributions,
      netWithdrawal: fiscal.netIRPS,
      closingCapital,
    });
    opening = closingCapital;
    openingGains = Math.max(0, gainsBeforeWithdrawal - withdrawalGains);
  }

  return rows;
}

export function computeCapitalHorizon(input: CapitalHorizonInput): PerTransfertCapitalHorizon {
  const years = Math.max(0, Math.floor(input.horizonAge - input.liquidationAge));
  const annualWithdrawal = computeAnnualWithdrawal(input.capital, input.annualRate, years);
  const schedule = buildCapitalSchedule(input);
  const lastRow = schedule.length > 0 ? schedule[schedule.length - 1] : null;
  const residualCapital = lastRow?.closingCapital ?? Math.max(0, input.capital - annualWithdrawal);
  const cumulativeWithdrawals = schedule.reduce((sum, row) => sum + row.withdrawal, 0);
  const cumulativeNetWithdrawals = schedule.reduce((sum, row) => sum + row.netWithdrawal, 0);

  return {
    horizonAge: input.horizonAge,
    years,
    annualWithdrawal,
    annualNetWithdrawal: schedule[0]?.netWithdrawal ?? annualWithdrawal,
    cumulativeWithdrawals,
    cumulativeNetWithdrawals,
    residualCapital,
  };
}
