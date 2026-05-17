import { computeCapitalHorizon, projectCapital } from './capitalAmortization';
import { computeAnnuityConversion, computeCurrentConversionRate } from './conversionRate';
import { computeCapitalFiscal } from './fiscaliteCapital';
import { computeRentFiscal, computeSmallAnnuityEligibility } from './fiscaliteRente';
import { resolvePerCompartiment } from './compartimentMapping';
import { computePrefonRente } from './pointsMortality';
import type {
  PerTransfertAnnuityOptions,
  PerTransfertCapitalFiscalResult,
  PerTransfertCapitalHorizon,
  PerTransfertCompartment,
  PerTransfertCurrentRentOptions,
  PerTransfertInput,
  PerTransfertPrefonPocketInput,
  PerTransfertPrefonResult,
  PerTransfertPrefonStrategyResult,
  PerTransfertResult,
} from './types';

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function yearsUntilRetirement(currentAge: number, liquidationAge: number): number {
  return Math.max(0, Math.floor(liquidationAge - currentAge));
}

function compoundRent(annualRent: number, annualRate: number, years: number): number {
  if (years <= 0) return positive(annualRent);
  return positive(annualRent) * ((1 + annualRate) ** years);
}

function projectCapitalWithAnnualPayment(capital: number, annualRate: number, years: number, annualPayment: number): number {
  const baseCapital = positive(capital);
  const payment = positive(annualPayment);
  const duration = Math.max(0, years);
  if (duration === 0) return baseCapital;
  const projectedCapital = projectCapital({
    capital: baseCapital,
    annualRate,
    years: duration,
  });
  if (payment === 0) return projectedCapital;
  if (annualRate === 0) return projectedCapital + payment * duration;
  return projectedCapital + payment * (((1 + annualRate) ** duration - 1) / annualRate);
}

function cumulativeRent(annualRent: number, annualRate: number, years: number): number {
  let total = 0;
  for (let index = 0; index < Math.max(0, years); index += 1) {
    total += compoundRent(annualRent, annualRate, index);
  }
  return total;
}

function withWarnings(input: PerTransfertInput): string[] {
  const warnings: string[] = [];
  if ((input.productType === 'PER' || input.productType === 'PERP') && input.annuityOptions.technicalRate > 0) {
    warnings.push('Le taux technique positif est neutralise pour un PER/PERP dans le moteur.');
  }
  if (input.prefon.enabled && !input.prefon.params) {
    warnings.push('Contrat en points detecte sans parametres Prefon exploitables.');
  }
  return warnings;
}

function buildCurrentAnnuityOptions(
  currentRentOptions: PerTransfertCurrentRentOptions,
  baseOptions: PerTransfertAnnuityOptions,
): PerTransfertAnnuityOptions {
  return {
    ...baseOptions,
    mortalityTable: currentRentOptions.mortalityTable,
    technicalRate: currentRentOptions.technicalRate,
    conversionFeeRate: currentRentOptions.conversionFeeRate,
    arrearsFeeRate: currentRentOptions.arrearsFeeRate,
    reversion: {
      ...baseOptions.reversion,
      enabled: currentRentOptions.reversionEnabled,
      rate: currentRentOptions.reversionRate,
      spouseBirthYear: currentRentOptions.spouseBirthYear ?? baseOptions.reversion.spouseBirthYear,
      spouseAgeAtLiquidation: currentRentOptions.spouseAgeAtLiquidation ?? baseOptions.reversion.spouseAgeAtLiquidation,
    },
    guaranteedAnnuities: {
      enabled: currentRentOptions.guaranteedYears > 0,
      years: currentRentOptions.guaranteedYears,
    },
  };
}

function emptyCapitalFiscal(): PerTransfertCapitalFiscalResult {
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

function emptyCapitalHorizon(horizonAge: number, liquidationAge: number): PerTransfertCapitalHorizon {
  return {
    horizonAge,
    years: Math.max(0, Math.floor(horizonAge - liquidationAge)),
    annualWithdrawal: 0,
    annualNetWithdrawal: 0,
    cumulativeWithdrawals: 0,
    cumulativeNetWithdrawals: 0,
    residualCapital: 0,
  };
}

function prefonPocketCapitalBasis(pocket: PerTransfertPrefonPocketInput, acquisitionValue: number): number {
  const capitalAmount = positive(pocket.capitalAmount);
  if (capitalAmount > 0) return capitalAmount;
  const pointValue = positive(pocket.transferValuePerPoint) || positive(acquisitionValue);
  return positive(pocket.points) * pointValue;
}

function buildPrefonResult(input: {
  pockets: PerTransfertPrefonPocketInput[];
  params: NonNullable<PerTransfertInput['prefon']['params']>;
  baseInput: PerTransfertInput;
}): PerTransfertPrefonResult {
  const liquidationAge = input.baseInput.insured.liquidationAge;
  const fractionnementYears = 10;
  const capitalCompartment: PerTransfertCompartment = 'C1';
  const computePocketRent = (pocket: PerTransfertPrefonPocketInput, rentShare: number) => {
    const capitalBasis = prefonPocketCapitalBasis(pocket, input.params.valeurAcquisition);
    return computePrefonRente({
      params: input.params,
      points: positive(pocket.points) * rentShare,
      capitalNet: positive(pocket.points) > 0 ? 0 : capitalBasis * rentShare,
      acquisitionAge: input.baseInput.prefon.acquisitionAge,
      liquidationAge,
      reversionRate: pocket.reversionEnabled === false
        ? 0
        : positive(pocket.reversionRate ?? input.baseInput.annuityOptions.reversion.rate),
      spouseAgeAtLiquidation: pocket.spouseAgeAtLiquidation
        ?? input.baseInput.annuityOptions.reversion.spouseAgeAtLiquidation,
      serviceValue: pocket.serviceValue,
    }).renteAnnuelleBrute;
  };
  const buildStrategy = (strategy: 'all_rente' | 'max_capital'): PerTransfertPrefonStrategyResult => {
    let totalRenteBrute = 0;
    let totalCapital = 0;
    for (const pocket of input.pockets) {
      const capitalBasis = prefonPocketCapitalBasis(pocket, input.params.valeurAcquisition);
      let capitalShare = 0;
      if (strategy === 'max_capital') {
        if (pocket.compartment === 'C0') {
          capitalShare = pocket.c0CapitalOptionEnabled === false ? 0 : 0.2;
        } else if (pocket.compartment === 'C1' || pocket.compartment === 'C1_BIS' || pocket.compartment === 'C2') {
          capitalShare = pocket.capitalOptionEnabled === false ? 0 : 1;
        }
      }
      totalCapital += capitalBasis * capitalShare;
      totalRenteBrute += computePocketRent(pocket, 1 - capitalShare);
    }
    const fiscal = computeRentFiscal({
      annualRent: totalRenteBrute,
      liquidationAge,
      tmiRetraite: input.baseInput.tmiRetraite,
      compartment: capitalCompartment,
      assumptions: input.baseInput.fiscalAssumptions,
    });
    const capitalUnique = totalCapital > 0
      ? computeCapitalFiscal({
        capital: totalCapital,
        gains: 0,
        compartment: capitalCompartment,
        tmiRetraite: input.baseInput.tmiRetraite,
        smallAnnuityEligible: true,
        assumptions: input.baseInput.fiscalAssumptions,
      })
      : emptyCapitalFiscal();
    const shortHorizonAge = liquidationAge + fractionnementYears;
    const shortHorizon = totalCapital > 0
      ? computeCapitalHorizon({
        capital: totalCapital,
        gains: 0,
        annualRate: 0,
        liquidationAge,
        horizonAge: shortHorizonAge,
        compartment: capitalCompartment,
        tmiRetraite: input.baseInput.tmiRetraite,
        smallAnnuityEligible: true,
        assumptions: input.baseInput.fiscalAssumptions,
      })
      : emptyCapitalHorizon(shortHorizonAge, liquidationAge);

    return {
      totalRenteBrute,
      totalCapital,
      fiscal,
      capitalUnique,
      shortHorizon,
      longHorizon: null,
    };
  };

  return {
    allRente: buildStrategy('all_rente'),
    maxCapital: buildStrategy('max_capital'),
    fractionnementYears,
  };
}

export function computePerTransfert(input: PerTransfertInput): PerTransfertResult {
  const compartment = resolvePerCompartiment(input.originalContractType, input.targetCompartment);
  const yearsToRetirement = yearsUntilRetirement(input.insured.currentAge, input.insured.liquidationAge);
  const currentConversionRate = computeCurrentConversionRate(
    input.capitalAcquis,
    input.renteActuelleAnnuelleBrute,
  );
  const transferFeeRate = Math.max(0, input.projection.transferFeeRate);
  const newPerEntryFeeRate = Math.max(0, input.projection.newPerEntryFeeRate ?? 0);
  const capitalAfterTransfer = positive(input.capitalAcquis)
    * (1 - transferFeeRate)
    * (1 - newPerEntryFeeRate);
  const capitalAtLiquidation = projectCapitalWithAnnualPayment(
    capitalAfterTransfer,
    input.projection.performanceUntilRetirementRate,
    yearsToRetirement,
    input.projection.newPerAnnualPayment ?? 0,
  );
  const desiredCapitalExitShare = Math.min(1, Math.max(0, input.projection.capitalShareRate));
  const principalBeforeTransfer = Math.max(0, input.capitalAcquis - positive(input.interetsAcquis));
  const gainsBeforeTransfer = Math.min(positive(input.capitalAcquis), positive(input.interetsAcquis));
  const transferRatio = positive(input.capitalAcquis) > 0 ? capitalAfterTransfer / positive(input.capitalAcquis) : 0;
  const principalAfterTransfer = principalBeforeTransfer * transferRatio;
  const gainsAfterTransfer = gainsBeforeTransfer * transferRatio;
  const gainsAtLiquidation = Math.min(
    capitalAtLiquidation,
    gainsAfterTransfer + Math.max(0, capitalAtLiquidation - principalAfterTransfer - gainsAfterTransfer),
  );
  const annuityOptions = {
    ...input.annuityOptions,
    technicalRate:
      input.productType === 'PER' || input.productType === 'PERP'
        ? Math.min(0, input.annuityOptions.technicalRate)
        : input.annuityOptions.technicalRate,
  };

  const fullRentForEligibility = computeAnnuityConversion({
    capitalGross: capitalAtLiquidation,
    insured: input.insured,
    options: annuityOptions,
  });
  const fullRentSmallAnnuityEligible = computeSmallAnnuityEligibility(
    fullRentForEligibility.netAnnualRent,
    input.fiscalAssumptions,
  );
  const capitalExitShare = compartment === 'C3' && !fullRentSmallAnnuityEligible ? 0 : desiredCapitalExitShare;
  const capitalAvailableAtLiquidation = capitalAtLiquidation * capitalExitShare;
  const capitalConvertedToRent = capitalAtLiquidation - capitalAvailableAtLiquidation;
  const capitalExitGainsAtLiquidation = gainsAtLiquidation * capitalExitShare;
  const actuarialRent = capitalConvertedToRent === capitalAtLiquidation
    ? fullRentForEligibility
    : computeAnnuityConversion({
      capitalGross: capitalConvertedToRent,
      insured: input.insured,
      options: annuityOptions,
    });
  const fallbackPrefonPocket: PerTransfertPrefonPocketInput = {
    compartment,
    points: input.prefon.points,
    capitalAmount: 0,
    transferValuePerPoint: 0,
  };
  const prefonPockets = input.prefon.pockets && input.prefon.pockets.length > 0
    ? input.prefon.pockets
    : [fallbackPrefonPocket];
  const prefonParams = input.prefon.params;
  const prefonResult = input.prefon.enabled && prefonParams
    ? buildPrefonResult({
      pockets: prefonPockets,
      params: prefonParams,
      baseInput: input,
    })
    : null;
  const newPerRent = actuarialRent;
  const keepPerf = input.projection.currentContractPerformanceUntilRetirementRate
    ?? input.projection.performanceUntilRetirementRate;
  const capitalKeptAtLiquidation = projectCapitalWithAnnualPayment(
    input.capitalAcquis,
    keepPerf,
    yearsToRetirement,
    input.annualCurrentPayment ?? 0,
  );
  const currentRentOptions = input.currentRentOptions ?? {
    mode: 'statement',
    mortalityTable: annuityOptions.mortalityTable,
    technicalRate: annuityOptions.technicalRate,
    conversionFeeRate: annuityOptions.conversionFeeRate,
    arrearsFeeRate: annuityOptions.arrearsFeeRate,
    guaranteedYears: annuityOptions.guaranteedAnnuities.years,
    reversionEnabled: annuityOptions.reversion.enabled,
    reversionRate: annuityOptions.reversion.rate,
  };
  const currentRentAtLiquidation = prefonResult
    ? prefonResult.allRente.totalRenteBrute
    : currentRentOptions.mode === 'manual_table'
      ? computeAnnuityConversion({
      capitalGross: capitalKeptAtLiquidation,
      insured: input.insured,
      options: buildCurrentAnnuityOptions(currentRentOptions, annuityOptions),
    }).grossAnnualRent
      : positive(input.renteActuelleAnnuelleBrute);
  const currentRentFiscal = computeRentFiscal({
    annualRent: currentRentAtLiquidation,
    liquidationAge: input.insured.liquidationAge,
    tmiRetraite: input.tmiRetraite,
    compartment,
    assumptions: input.fiscalAssumptions,
  });
  const newPerFiscal = computeRentFiscal({
    annualRent: newPerRent.netAnnualRent,
    liquidationAge: input.insured.liquidationAge,
    tmiRetraite: input.tmiRetraite,
    compartment,
    assumptions: input.fiscalAssumptions,
  });
  const smallAnnuityCapitalExitEligible = computeSmallAnnuityEligibility(
    newPerRent.netAnnualRent,
    input.fiscalAssumptions,
  );
  const uniqueCapitalFiscal = computeCapitalFiscal({
    capital: capitalAvailableAtLiquidation,
    gains: capitalExitGainsAtLiquidation,
    compartment,
    tmiRetraite: input.tmiRetraite,
    smallAnnuityEligible: smallAnnuityCapitalExitEligible,
    assumptions: input.fiscalAssumptions,
  });
  const shortHorizon = computeCapitalHorizon({
    capital: capitalAvailableAtLiquidation,
    gains: capitalExitGainsAtLiquidation,
    annualRate: input.projection.capitalExitRevaluationRate,
    liquidationAge: input.insured.liquidationAge,
    horizonAge: input.projection.horizonAgeShort,
    compartment,
    tmiRetraite: input.tmiRetraite,
    smallAnnuityEligible: smallAnnuityCapitalExitEligible,
    assumptions: input.fiscalAssumptions,
  });
  const longHorizon = computeCapitalHorizon({
    capital: capitalAvailableAtLiquidation,
    gains: capitalExitGainsAtLiquidation,
    annualRate: input.projection.capitalExitRevaluationRate,
    liquidationAge: input.insured.liquidationAge,
    horizonAge: input.projection.horizonAgeLong,
    compartment,
    tmiRetraite: input.tmiRetraite,
    smallAnnuityEligible: smallAnnuityCapitalExitEligible,
    assumptions: input.fiscalAssumptions,
  });
  const currentSmallAnnuityCapitalExitEligible = computeSmallAnnuityEligibility(
    currentRentFiscal.netAnnualRent,
    input.fiscalAssumptions,
  );
  const currentTypeCapitalLocked = input.originalContractType === 'MADELIN'
    || input.originalContractType === 'PERP'
    || input.originalContractType === 'ARTICLE83'
    || input.originalContractType === 'PEROB'
    || compartment === 'C3';
  const currentCapitalAllowed = !input.prefon.enabled
    && (!currentTypeCapitalLocked || currentSmallAnnuityCapitalExitEligible);
  const currentFractionAllowed = currentCapitalAllowed
    && input.originalContractType !== 'MADELIN'
    && input.originalContractType !== 'PERP'
    && input.originalContractType !== 'ARTICLE83'
    && input.originalContractType !== 'PEROB'
    && compartment !== 'C3';
  const currentGainsAtLiquidation = Math.min(
    capitalKeptAtLiquidation,
    positive(input.interetsAcquis) + Math.max(0, capitalKeptAtLiquidation - positive(input.capitalAcquis) - positive(input.annualCurrentPayment ?? 0) * yearsToRetirement),
  );
  const keepUniqueCapitalFiscal = currentCapitalAllowed
    ? computeCapitalFiscal({
      capital: capitalKeptAtLiquidation,
      gains: currentGainsAtLiquidation,
      compartment,
      tmiRetraite: input.tmiRetraite,
      smallAnnuityEligible: currentSmallAnnuityCapitalExitEligible,
      assumptions: input.fiscalAssumptions,
    })
    : emptyCapitalFiscal();
  const keepShortHorizon = currentFractionAllowed
    ? computeCapitalHorizon({
      capital: capitalKeptAtLiquidation,
      gains: currentGainsAtLiquidation,
      annualRate: input.projection.capitalExitRevaluationRate,
      liquidationAge: input.insured.liquidationAge,
      horizonAge: input.projection.horizonAgeShort,
      compartment,
      tmiRetraite: input.tmiRetraite,
      smallAnnuityEligible: currentSmallAnnuityCapitalExitEligible,
      assumptions: input.fiscalAssumptions,
    })
    : emptyCapitalHorizon(input.projection.horizonAgeShort, input.insured.liquidationAge);
  const keepLongHorizon = currentFractionAllowed
    ? computeCapitalHorizon({
      capital: capitalKeptAtLiquidation,
      gains: currentGainsAtLiquidation,
      annualRate: input.projection.capitalExitRevaluationRate,
      liquidationAge: input.insured.liquidationAge,
      horizonAge: input.projection.horizonAgeLong,
      compartment,
      tmiRetraite: input.tmiRetraite,
      smallAnnuityEligible: currentSmallAnnuityCapitalExitEligible,
      assumptions: input.fiscalAssumptions,
    })
    : null;

  return {
    compartment,
    currentConversionRate,
    capitalAfterTransfer,
    capitalAtLiquidation,
    currentRent: {
      grossAnnualRent: currentRentAtLiquidation,
      netAnnualRent: currentRentFiscal.netAnnualRent,
      fiscal: currentRentFiscal,
      cumulativeToShortHorizon: cumulativeRent(
        currentRentFiscal.netAnnualRent,
        input.projection.currentRentRevaluationRate,
        shortHorizon.years,
      ),
      cumulativeToLongHorizon: cumulativeRent(
        currentRentFiscal.netAnnualRent,
        input.projection.currentRentRevaluationRate,
        longHorizon.years,
      ),
    },
    keepScenario: {
      capitalAtLiquidation: capitalKeptAtLiquidation,
      currentRent: {
        grossAnnualRent: currentRentAtLiquidation,
        netAnnualRent: currentRentFiscal.netAnnualRent,
        netMonthly: currentRentFiscal.netAnnualRent / 12,
        fiscal: currentRentFiscal,
        cumulativeToShortHorizon: cumulativeRent(
          currentRentFiscal.netAnnualRent,
          input.projection.currentRentRevaluationRate,
          shortHorizon.years,
        ),
        cumulativeToLongHorizon: cumulativeRent(
          currentRentFiscal.netAnnualRent,
          input.projection.currentRentRevaluationRate,
          longHorizon.years,
        ),
      },
      capitalExit: {
        unique: keepUniqueCapitalFiscal,
        shortHorizon: keepShortHorizon,
        longHorizon: keepLongHorizon,
      },
    },
    newPerRent,
    newPerFiscal,
    capitalExit: {
      shareRate: capitalExitShare,
      capitalConvertedToRent,
      capitalAvailableAtLiquidation,
      unique: uniqueCapitalFiscal,
      shortHorizon,
      longHorizon,
      withoutWithdrawalToLongHorizon: projectCapital({
        capital: capitalAvailableAtLiquidation,
        annualRate: input.projection.capitalExitRevaluationRate,
        years: longHorizon.years,
      }),
    },
    smallAnnuityCapitalExitEligible,
    prefon: prefonResult,
    warnings: withWarnings(input),
  };
}
