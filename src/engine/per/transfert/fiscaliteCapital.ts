import type {
  PerTransfertCapitalFiscalResult,
  PerTransfertCompartment,
  PerTransfertFiscalAssumptions,
} from './types';

interface ComputeCapitalFiscalInput {
  capital: number;
  gains: number;
  compartment: PerTransfertCompartment;
  tmiRetraite: number;
  smallAnnuityEligible: boolean;
  assumptions: PerTransfertFiscalAssumptions;
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function clampGains(capital: number, gains: number): number {
  return Math.min(positive(capital), positive(gains));
}

function unavailable(): PerTransfertCapitalFiscalResult {
  return {
    available: false,
    capital: 0,
    gains: 0,
    netOfSocialContributions: 0,
    netOfAllTaxes: 0,
    netOfAllTaxesWithQuotient: 0,
    incomeTax: 0,
    incomeTaxAtBareme: 0,
    incomeTaxWithQuotient: 0,
    socialContributions: 0,
    netPS: 0,
    netIRPS: 0,
  };
}

function buildAvailableResult(input: {
  capital: number;
  gains: number;
  incomeTax: number;
  incomeTaxAtBareme?: number;
  incomeTaxWithQuotient?: number;
  socialContributions: number;
}): PerTransfertCapitalFiscalResult {
  const netOfSocialContributions = Math.max(0, input.capital - input.socialContributions);
  const netOfAllTaxes = Math.max(0, input.capital - input.socialContributions - input.incomeTax);
  const quotientTax = input.incomeTaxWithQuotient ?? input.incomeTax;
  const netOfAllTaxesWithQuotient = Math.max(0, input.capital - input.socialContributions - quotientTax);
  return {
    available: true,
    capital: input.capital,
    gains: input.gains,
    netOfSocialContributions,
    netOfAllTaxes,
    netOfAllTaxesWithQuotient,
    incomeTax: input.incomeTax,
    incomeTaxAtBareme: input.incomeTaxAtBareme ?? input.incomeTax,
    incomeTaxWithQuotient: quotientTax,
    socialContributions: input.socialContributions,
    netPS: netOfSocialContributions,
    netIRPS: netOfAllTaxes,
  };
}

export function computeCapitalFiscal(input: ComputeCapitalFiscalInput): PerTransfertCapitalFiscalResult {
  const capital = positive(input.capital);
  if (capital === 0) return unavailable();

  const gains = clampGains(capital, input.gains);
  const principal = Math.max(0, capital - gains);
  const tmi = Math.max(0, input.tmiRetraite);

  if (input.compartment === 'C3' && !input.smallAnnuityEligible) {
    return unavailable();
  }

  if (input.compartment === 'C1') {
    const socialContributions = gains * input.assumptions.psRatePatrimony;
    const incomeTax = principal * tmi + gains * input.assumptions.pfuIrRate;
    return buildAvailableResult({
      capital,
      gains,
      incomeTax,
      socialContributions,
    });
  }

  if (input.compartment === 'C1_BIS' || input.compartment === 'C2') {
    const socialContributions = gains * input.assumptions.psRatePatrimony;
    const incomeTax = gains * input.assumptions.pfuIrRate;
    return buildAvailableResult({
      capital,
      gains,
      incomeTax,
      socialContributions,
    });
  }

  const socialContributions = gains * input.assumptions.psRatePatrimony;
  const incomeTax = principal * tmi + gains * input.assumptions.pfuIrRate;
  return buildAvailableResult({
    capital,
    gains,
    incomeTax,
    socialContributions,
  });
}
