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
    incomeTax: 0,
    socialContributions: 0,
    netPS: 0,
    netIRPS: 0,
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
    const netPS = Math.max(0, capital - socialContributions);
    return {
      available: true,
      capital,
      gains,
      incomeTax,
      socialContributions,
      netPS,
      netIRPS: Math.max(0, capital - socialContributions - incomeTax),
    };
  }

  if (input.compartment === 'C1_BIS' || input.compartment === 'C2') {
    const socialContributions = gains * input.assumptions.psRatePatrimony;
    const incomeTax = gains * input.assumptions.pfuIrRate;
    return {
      available: true,
      capital,
      gains,
      incomeTax,
      socialContributions,
      netPS: Math.max(0, capital - socialContributions),
      netIRPS: Math.max(0, capital - socialContributions - incomeTax),
    };
  }

  const forfaitBase = capital * (1 - input.assumptions.smallAnnuityCapitalExitFlatTaxAbatementRate);
  const incomeTax = forfaitBase * input.assumptions.smallAnnuityCapitalExitFlatTaxRate;
  const socialContributions = capital * input.assumptions.psRateRetirementDefault;
  return {
    available: true,
    capital,
    gains,
    incomeTax,
    socialContributions,
    netPS: Math.max(0, capital - socialContributions),
    netIRPS: Math.max(0, capital - socialContributions - incomeTax),
  };
}
