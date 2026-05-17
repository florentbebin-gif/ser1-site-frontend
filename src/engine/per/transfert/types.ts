import type { BaseCgRetraiteContractType, PerTransfertCompartment, PrefonPointsParams } from '@/data/basecg';
import type { MortalityTableCode } from '@/data/mortality';

export type { PerTransfertCompartment } from '@/data/basecg';

export type PerTransfertProductType = 'PER' | 'PERP' | 'MADELIN' | 'ARTICLE83' | 'PEROB' | 'PERCO' | 'PERECO' | 'PER_POINTS';
export type PerTransfertSex = 'M' | 'F';
export type PerTransfertPaymentTiming = 'arrears' | 'advance';
export type PerTransfertFiscalFamily = 'RVTG' | 'RVTO';

export interface PerTransfertInsuredInput {
  sex: PerTransfertSex;
  birthYear: number;
  currentAge: number;
  liquidationAge: number;
}

export interface PerTransfertReversionInput {
  enabled: boolean;
  rate: number;
  spouseSex: PerTransfertSex;
  spouseBirthYear: number;
  spouseAgeAtLiquidation: number;
  spouseMortalityTable: MortalityTableCode;
}

export interface PerTransfertGuaranteedInput {
  enabled: boolean;
  years: number;
}

export interface PerTransfertTemporaryIncreaseInput {
  enabled: boolean;
  increaseRate: number;
  years: number;
}

export interface PerTransfertFiscalAssumptions {
  rvtoTaxableFractionByAge: Array<{ label: string; ageMaxInclusive: number | null; fraction: number }>;
  pfuIrRate: number;
  psRatePatrimony: number;
  psRateRenteInterests: number;
  psRateRenteCapitalCASA: number;
  abat10Rate: number;
  psRateRetirementDefault: number;
  smallAnnuityMonthlyCapitalExitThreshold: number;
  smallAnnuityAnnualCapitalExitThreshold: number;
  smallAnnuityCapitalExitFlatTaxRate: number;
  smallAnnuityCapitalExitFlatTaxAbatementRate: number;
}

export interface PerTransfertAnnuityOptions {
  mortalityTable: MortalityTableCode;
  technicalRate: number;
  frequency: number;
  paymentTiming: PerTransfertPaymentTiming;
  conversionFeeRate: number;
  conversionFeeFixed: number;
  arrearsFeeRate: number;
  arrearsFeeFixedPerPayment: number;
  reversion: PerTransfertReversionInput;
  guaranteedAnnuities: PerTransfertGuaranteedInput;
  temporaryIncrease: PerTransfertTemporaryIncreaseInput;
}

export interface PerTransfertProjectionInput {
  transferFeeRate: number;
  newPerEntryFeeRate?: number;
  performanceUntilRetirementRate: number;
  currentContractPerformanceUntilRetirementRate?: number;
  newPerAnnualPayment?: number;
  currentRentRevaluationRate: number;
  newRentRevaluationRate: number;
  capitalExitRevaluationRate: number;
  capitalShareRate: number;
  horizonAgeShort: number;
  horizonAgeLong: number;
}

export interface PerTransfertPrefonInput {
  enabled: boolean;
  points: number;
  pockets?: PerTransfertPrefonPocketInput[];
  acquisitionAge: number;
  params: PrefonPointsParams | null;
}

export interface PerTransfertPrefonPocketInput {
  compartment: PerTransfertCompartment;
  points: number;
  capitalAmount: number;
  transferValuePerPoint: number;
  serviceValue?: number | null;
  serviceRevaluationRate?: number | null;
  reversionEnabled?: boolean | null;
  reversionRate?: number | null;
  spouseAgeAtLiquidation?: number | null;
  c0CapitalOptionEnabled?: boolean | null;
  capitalOptionEnabled?: boolean | null;
}

export interface PerTransfertCurrentRentOptions {
  mode: 'statement' | 'manual_table';
  mortalityTable: MortalityTableCode;
  technicalRate: number;
  conversionFeeRate: number;
  arrearsFeeRate: number;
  guaranteedYears: number;
  reversionEnabled: boolean;
  reversionRate: number;
  spouseBirthYear?: number;
  spouseAgeAtLiquidation?: number;
}

export interface PerTransfertInput {
  productType: PerTransfertProductType;
  originalContractType: BaseCgRetraiteContractType;
  targetCompartment?: PerTransfertCompartment | null;
  capitalAcquis: number;
  interetsAcquis: number;
  renteActuelleAnnuelleBrute: number;
  subscriptionDate?: string | null;
  annualCurrentPayment?: number | null;
  insured: PerTransfertInsuredInput;
  tmiRetraite: number;
  fiscalAssumptions: PerTransfertFiscalAssumptions;
  annuityOptions: PerTransfertAnnuityOptions;
  currentRentOptions?: PerTransfertCurrentRentOptions;
  projection: PerTransfertProjectionInput;
  prefon: PerTransfertPrefonInput;
}

export interface PerTransfertFiscalResult {
  family: PerTransfertFiscalFamily;
  taxableFraction: number;
  taxableIncome: number;
  grossAnnualRent: number;
  netOfSocialContributions: number;
  netOfAllTaxes: number;
  incomeTax: number;
  socialContributions: number;
  netAnnualRent: number;
}

export interface PerTransfertCapitalHorizon {
  horizonAge: number;
  years: number;
  annualWithdrawal: number;
  annualNetWithdrawal: number;
  cumulativeWithdrawals: number;
  cumulativeNetWithdrawals: number;
  residualCapital: number;
}

export interface PerTransfertCapitalScheduleRow {
  age: number;
  openingCapital: number;
  interests: number;
  withdrawal: number;
  incomeTax: number;
  socialContributions: number;
  netWithdrawal: number;
  closingCapital: number;
}

export interface PerTransfertCapitalFiscalResult {
  available: boolean;
  capital: number;
  gains: number;
  netOfSocialContributions: number;
  netOfAllTaxes: number;
  netOfAllTaxesWithQuotient: number;
  incomeTax: number;
  incomeTaxAtBareme: number;
  incomeTaxWithQuotient: number;
  socialContributions: number;
  netPS: number;
  netIRPS: number;
}

export interface PerTransfertAnnuityResult {
  capitalNet: number;
  annuityFactor: number;
  grossAnnualRent: number;
  netAnnualRent: number;
  monthlyRent: number;
  apparentRate: number;
}

export interface PerTransfertKeepScenario {
  capitalAtLiquidation: number;
  currentRent: {
    grossAnnualRent: number;
    netAnnualRent: number;
    netMonthly: number;
    fiscal: PerTransfertFiscalResult;
    cumulativeToShortHorizon: number;
    cumulativeToLongHorizon: number;
  };
  capitalExit?: {
    unique: PerTransfertCapitalFiscalResult;
    shortHorizon: PerTransfertCapitalHorizon;
    longHorizon: PerTransfertCapitalHorizon | null;
  };
}

export interface PerTransfertPrefonStrategyResult {
  totalRenteBrute: number;
  totalCapital: number;
  fiscal: PerTransfertFiscalResult;
  capitalUnique: PerTransfertCapitalFiscalResult;
  shortHorizon: PerTransfertCapitalHorizon;
  longHorizon: PerTransfertCapitalHorizon | null;
}

export interface PerTransfertPrefonResult {
  allRente: PerTransfertPrefonStrategyResult;
  maxCapital: PerTransfertPrefonStrategyResult;
  fractionnementYears: number;
}

export interface PerTransfertResult {
  compartment: PerTransfertCompartment;
  currentConversionRate: number;
  capitalAfterTransfer: number;
  capitalAtLiquidation: number;
  currentRent: {
    grossAnnualRent: number;
    netAnnualRent: number;
    fiscal: PerTransfertFiscalResult;
    cumulativeToShortHorizon: number;
    cumulativeToLongHorizon: number;
  };
  keepScenario: PerTransfertKeepScenario;
  newPerRent: PerTransfertAnnuityResult;
  newPerFiscal: PerTransfertFiscalResult;
  capitalExit: {
    shareRate: number;
    capitalConvertedToRent: number;
    capitalAvailableAtLiquidation: number;
    unique: PerTransfertCapitalFiscalResult;
    shortHorizon: PerTransfertCapitalHorizon;
    longHorizon: PerTransfertCapitalHorizon;
    withoutWithdrawalToLongHorizon: number;
  };
  smallAnnuityCapitalExitEligible: boolean;
  prefon?: PerTransfertPrefonResult | null;
  warnings: string[];
}
