import { computeAnnuityFactor } from './mortalityFactor';
import type { PerTransfertAnnuityOptions, PerTransfertAnnuityResult, PerTransfertInsuredInput } from './types';

interface ComputeAnnuityConversionInput {
  capitalGross: number;
  insured: PerTransfertInsuredInput;
  options: PerTransfertAnnuityOptions;
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function computeCurrentConversionRate(capital: number, annualRent: number): number {
  const safeCapital = positive(capital);
  if (safeCapital === 0) return 0;
  return positive(annualRent) / safeCapital;
}

export function computeAnnuityConversion(input: ComputeAnnuityConversionInput): PerTransfertAnnuityResult {
  const capitalNet = Math.max(
    0,
    positive(input.capitalGross) * (1 - Math.max(0, input.options.conversionFeeRate))
    - Math.max(0, input.options.conversionFeeFixed),
  );
  const annuityFactor = computeAnnuityFactor({
    insured: input.insured,
    mortalityTable: input.options.mortalityTable,
    technicalRate: input.options.technicalRate,
    frequency: input.options.frequency,
    paymentTiming: input.options.paymentTiming,
    reversion: input.options.reversion,
    guaranteedAnnuities: input.options.guaranteedAnnuities,
    temporaryIncrease: input.options.temporaryIncrease,
  });
  const grossAnnualRent = annuityFactor > 0 ? capitalNet / annuityFactor : 0;
  const netAnnualRent = Math.max(
    0,
    grossAnnualRent * (1 - Math.max(0, input.options.arrearsFeeRate))
    - Math.max(0, input.options.arrearsFeeFixedPerPayment) * input.options.frequency,
  );

  return {
    capitalNet,
    annuityFactor,
    grossAnnualRent,
    netAnnualRent,
    monthlyRent: netAnnualRent / 12,
    apparentRate: capitalNet > 0 ? netAnnualRent / capitalNet : 0,
  };
}
