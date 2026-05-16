import { computeCapitalHorizon, projectCapital } from './capitalAmortization';
import { computeAnnuityConversion, computeCurrentConversionRate } from './conversionRate';
import { computeCapitalFiscal } from './fiscaliteCapital';
import { computeRentFiscal, computeSmallAnnuityEligibility } from './fiscaliteRente';
import { resolvePerCompartiment } from './compartimentMapping';
import { computePrefonRente } from './pointsMortality';
import type { PerTransfertAnnuityOptions, PerTransfertCurrentRentOptions, PerTransfertInput, PerTransfertResult } from './types';

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
    },
    guaranteedAnnuities: {
      enabled: currentRentOptions.guaranteedYears > 0,
      years: currentRentOptions.guaranteedYears,
    },
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
  const capitalAtLiquidation = projectCapital({
    capital: capitalAfterTransfer,
    annualRate: input.projection.performanceUntilRetirementRate,
    years: yearsToRetirement,
  });
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
  const prefonRent = input.prefon.enabled && input.prefon.params
    ? computePrefonRente({
      params: input.prefon.params,
      points: input.prefon.points,
      capitalNet: actuarialRent.capitalNet,
      acquisitionAge: input.prefon.acquisitionAge,
      liquidationAge: input.insured.liquidationAge,
      reversionRate: annuityOptions.reversion.enabled ? annuityOptions.reversion.rate : 0,
    })
    : null;
  const newPerRent = prefonRent
    ? {
      ...actuarialRent,
      grossAnnualRent: prefonRent.renteAnnuelleBrute,
      netAnnualRent: Math.max(0, prefonRent.renteAnnuelleBrute * (1 - annuityOptions.arrearsFeeRate)),
      monthlyRent: Math.max(0, prefonRent.renteMensuelleBrute * (1 - annuityOptions.arrearsFeeRate)),
      apparentRate: actuarialRent.capitalNet > 0 ? prefonRent.renteAnnuelleBrute / actuarialRent.capitalNet : 0,
    }
    : actuarialRent;
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
  const currentRentAtLiquidation = currentRentOptions.mode === 'manual_table'
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
    warnings: withWarnings(input),
  };
}
