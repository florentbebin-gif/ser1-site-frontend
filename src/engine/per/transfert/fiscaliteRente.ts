import type {
  PerTransfertCompartment,
  PerTransfertFiscalAssumptions,
  PerTransfertFiscalFamily,
  PerTransfertFiscalResult,
} from './types';

interface ComputeRentFiscalInput {
  annualRent: number;
  liquidationAge: number;
  tmiRetraite: number;
  compartment: PerTransfertCompartment;
  assumptions: PerTransfertFiscalAssumptions;
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function resolveFiscalFamily(compartment: PerTransfertCompartment): PerTransfertFiscalFamily {
  return compartment === 'C2' || compartment === 'C1_BIS' ? 'RVTO' : 'RVTG';
}

export function resolveRvtoTaxableFraction(
  age: number,
  assumptions: PerTransfertFiscalAssumptions,
): number {
  const bracket = assumptions.rvtoTaxableFractionByAge.find((candidate) => (
    candidate.ageMaxInclusive === null || age <= candidate.ageMaxInclusive
  ));
  return bracket?.fraction ?? 1;
}

export function computeRentFiscal(input: ComputeRentFiscalInput): PerTransfertFiscalResult {
  const annualRent = positive(input.annualRent);
  const family = resolveFiscalFamily(input.compartment);
  const taxableFraction = family === 'RVTO'
    ? resolveRvtoTaxableFraction(input.liquidationAge, input.assumptions)
    : Math.max(0, 1 - input.assumptions.abat10Rate);
  const taxableIncome = annualRent * taxableFraction;
  const incomeTax = taxableIncome * Math.max(0, input.tmiRetraite);
  const socialRate = family === 'RVTO'
    ? input.assumptions.psRateRenteInterests
    : input.assumptions.psRateRetirementDefault;
  const socialContributions = annualRent * (family === 'RVTO' ? taxableFraction : 1) * socialRate;

  return {
    family,
    taxableFraction,
    taxableIncome,
    incomeTax,
    socialContributions,
    netAnnualRent: Math.max(0, annualRent - incomeTax - socialContributions),
  };
}

export function computeSmallAnnuityEligibility(
  annualRent: number,
  assumptions: PerTransfertFiscalAssumptions,
): boolean {
  return positive(annualRent) <= assumptions.smallAnnuityAnnualCapitalExitThreshold;
}
