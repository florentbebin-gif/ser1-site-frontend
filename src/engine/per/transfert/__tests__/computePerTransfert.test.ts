import { describe, expect, it } from 'vitest';

import { computePerTransfert, type PerTransfertFiscalAssumptions, type PerTransfertInput } from '../index';

const fiscalAssumptions: PerTransfertFiscalAssumptions = {
  rvtoTaxableFractionByAge: [
    { label: 'test', ageMaxInclusive: 69, fraction: 0.4 },
    { label: 'test', ageMaxInclusive: null, fraction: 0.3 },
  ],
  pfuIrRate: 0.128,
  psRatePatrimony: 0.186,
  psRateRenteInterests: 0.172,
  psRateRenteCapitalCASA: 0.003,
  abat10Rate: 0.1,
  psRateRetirementDefault: 0.091,
  smallAnnuityMonthlyCapitalExitThreshold: 110,
  smallAnnuityAnnualCapitalExitThreshold: 1_320,
  smallAnnuityCapitalExitFlatTaxRate: 0.075,
  smallAnnuityCapitalExitFlatTaxAbatementRate: 0.1,
};

function makeInput(overrides: Partial<PerTransfertInput> & Record<string, unknown> = {}): PerTransfertInput {
  return {
    productType: 'PER',
    originalContractType: 'MADELIN',
    capitalAcquis: 80_000,
    interetsAcquis: 10_000,
    renteActuelleAnnuelleBrute: 2_400,
    insured: {
      sex: 'M',
      birthYear: 1960,
      currentAge: 60,
      liquidationAge: 64,
    },
    tmiRetraite: 0.11,
    fiscalAssumptions,
    annuityOptions: {
      mortalityTable: 'TGH05',
      technicalRate: 0,
      frequency: 12,
      paymentTiming: 'arrears',
      conversionFeeRate: 0,
      conversionFeeFixed: 0,
      arrearsFeeRate: 0,
      arrearsFeeFixedPerPayment: 0,
      reversion: {
        enabled: false,
        rate: 0,
        spouseSex: 'F',
        spouseBirthYear: 1962,
        spouseAgeAtLiquidation: 62,
        spouseMortalityTable: 'TGF05',
      },
      guaranteedAnnuities: { enabled: false, years: 0 },
      temporaryIncrease: { enabled: false, increaseRate: 0, years: 0 },
    },
    projection: {
      transferFeeRate: 0.01,
      performanceUntilRetirementRate: 0.02,
      currentRentRevaluationRate: 0.01,
      newRentRevaluationRate: 0.01,
      capitalExitRevaluationRate: 0,
      capitalShareRate: 0.3,
      horizonAgeShort: 80,
      horizonAgeLong: 90,
    },
    prefon: {
      enabled: false,
      points: 0,
      acquisitionAge: 60,
      params: null,
    },
    ...overrides,
  };
}

function expectClosePercent(actual: number | undefined, expected: number, toleranceRate: number): void {
  expect(actual).toBeDefined();
  expect(Math.abs((actual ?? 0) - expected)).toBeLessThanOrEqual(expected * toleranceRate);
}

describe('computePerTransfert', () => {
  it('calcule une synthese rente et capital pour un ancien Madelin', () => {
    const result = computePerTransfert(makeInput());

    expect(result.compartment).toBe('C1');
    expect(result.currentConversionRate).toBeCloseTo(0.03);
    expect(result.capitalAfterTransfer).toBeCloseTo(79_200);
    expect(result.capitalAtLiquidation).toBeGreaterThan(result.capitalAfterTransfer);
    expect(result.newPerRent.netAnnualRent).toBeGreaterThan(0);
    expect(result.capitalExit.shortHorizon.annualWithdrawal).toBeGreaterThan(0);
  });

  it('neutralise le taux technique positif sur PER/PERP', () => {
    const result = computePerTransfert(makeInput({
      annuityOptions: {
        ...makeInput().annuityOptions,
        technicalRate: 0.01,
      },
    }));

    expect(result.warnings).toContain('Le taux technique positif est neutralise pour un PER/PERP dans le moteur.');
  });

  it('conserve la rente du releve comme rente brute a la liquidation', () => {
    const result = computePerTransfert(makeInput({
      renteActuelleAnnuelleBrute: 3_000,
      insured: {
        sex: 'F',
        birthYear: 1980,
        currentAge: 60,
        liquidationAge: 64,
      },
      projection: {
        ...makeInput().projection,
        currentRentRevaluationRate: 0.01,
      },
    }));

    expect(result.currentRent.grossAnnualRent).toBe(3_000);
  });

  it('calcule les sorties capital nettes C1 selon les golden Excel G11 a G14', () => {
    const result = computePerTransfert(makeInput({
      capitalAcquis: 100_000,
      interetsAcquis: 0,
      renteActuelleAnnuelleBrute: 3_000,
      insured: {
        sex: 'F',
        birthYear: 1980,
        currentAge: 64,
        liquidationAge: 64,
      },
      tmiRetraite: 0.3,
      projection: {
        ...makeInput().projection,
        transferFeeRate: 0,
        performanceUntilRetirementRate: 0,
        capitalExitRevaluationRate: 0.03,
        capitalShareRate: 1,
      },
    }));
    const capitalExit = result.capitalExit as typeof result.capitalExit & {
      unique?: { netIRPS: number };
      withoutWithdrawalToLongHorizon?: number;
      shortHorizon: typeof result.capitalExit.shortHorizon & { cumulativeNetWithdrawals?: number };
      longHorizon: typeof result.capitalExit.longHorizon & { cumulativeNetWithdrawals?: number };
    };

    expect(capitalExit.unique?.netIRPS).toBeCloseTo(70_000, 2);
    expectClosePercent(capitalExit.shortHorizon.cumulativeNetWithdrawals, 89_164, 0.02);
    expectClosePercent(capitalExit.longHorizon.cumulativeNetWithdrawals, 101_808, 0.02);
    expect(capitalExit.withoutWithdrawalToLongHorizon).toBeCloseTo(215_659, 0);
  });

  it('respecte un compartiment cible force depuis le catalogue', () => {
    const input = {
      ...makeInput({ originalContractType: 'PERIN' }),
      targetCompartment: 'C1_BIS',
    } as PerTransfertInput & { targetCompartment: 'C1_BIS' };

    const result = computePerTransfert(input);

    expect(result.compartment).toBe('C1_BIS');
  });

  it('applique les frais d entree du nouveau PER apres les frais sortants', () => {
    const result = computePerTransfert(makeInput({
      capitalAcquis: 100_000,
      projection: {
        ...makeInput().projection,
        transferFeeRate: 0.05,
        newPerEntryFeeRate: 0.02,
      } as PerTransfertInput['projection'] & { newPerEntryFeeRate: number },
    }));

    expect(result.capitalAfterTransfer).toBeCloseTo(93_100);
  });

  it('expose un scenario conserver distinct avec la rente du releve non revalorisee avant liquidation', () => {
    const result = computePerTransfert(makeInput({
      renteActuelleAnnuelleBrute: 3_000,
      projection: {
        ...makeInput().projection,
        currentRentRevaluationRate: 0.03,
        currentContractPerformanceUntilRetirementRate: 0.02,
      } as PerTransfertInput['projection'] & { currentContractPerformanceUntilRetirementRate: number },
    })) as ReturnType<typeof computePerTransfert> & {
      keepScenario?: { capitalAtLiquidation: number; currentRent: { grossAnnualRent: number; netMonthly: number } };
    };

    expect(result.keepScenario).toBeDefined();
    expect(result.keepScenario?.currentRent.grossAnnualRent).toBe(3_000);
    expect(result.keepScenario?.currentRent.netMonthly).toBeGreaterThan(0);
    expect(result.keepScenario?.capitalAtLiquidation).toBeGreaterThan(80_000);
  });

  it('capitalise le versement annuel actuel uniquement dans le scenario conserver', () => {
    const base = computePerTransfert(makeInput({
      projection: {
        ...makeInput().projection,
        transferFeeRate: 0,
        performanceUntilRetirementRate: 0,
        currentContractPerformanceUntilRetirementRate: 0.02,
      } as PerTransfertInput['projection'] & { currentContractPerformanceUntilRetirementRate: number },
    })) as ReturnType<typeof computePerTransfert> & {
      keepScenario?: { capitalAtLiquidation: number };
    };
    const withPayment = computePerTransfert(makeInput({
      annualCurrentPayment: 1_200,
      projection: {
        ...makeInput().projection,
        transferFeeRate: 0,
        performanceUntilRetirementRate: 0,
        currentContractPerformanceUntilRetirementRate: 0.02,
      } as PerTransfertInput['projection'] & { currentContractPerformanceUntilRetirementRate: number },
    })) as ReturnType<typeof computePerTransfert> & {
      keepScenario?: { capitalAtLiquidation: number };
    };

    expect(withPayment.capitalAfterTransfer).toBe(base.capitalAfterTransfer);
    expect(withPayment.keepScenario?.capitalAtLiquidation).toBeGreaterThan(base.keepScenario?.capitalAtLiquidation ?? 0);
  });

  it('force la sortie capital a zero sur le compartiment C3 hors petite rente', () => {
    const result = computePerTransfert(makeInput({
      originalContractType: 'ARTICLE83',
      targetCompartment: 'C3',
      capitalAcquis: 200_000,
      renteActuelleAnnuelleBrute: 6_000,
      projection: {
        ...makeInput().projection,
        capitalShareRate: 1,
      },
    }));

    expect(result.compartment).toBe('C3');
    expect(result.capitalExit.shareRate).toBe(0);
    expect(result.capitalExit.capitalConvertedToRent).toBeCloseTo(result.capitalAtLiquidation);
  });

  it('utilise l age du conjoint propre a la rente actuelle en mode table manuelle', () => {
    const baseManualOptions = {
      mode: 'manual_table',
      mortalityTable: 'TGH05',
      technicalRate: 0,
      conversionFeeRate: 0,
      arrearsFeeRate: 0,
      guaranteedYears: 0,
      reversionEnabled: true,
      reversionRate: 0.6,
    } satisfies PerTransfertInput['currentRentOptions'];
    const withYoungSpouse = computePerTransfert(makeInput({
      currentRentOptions: {
        ...baseManualOptions,
        spouseBirthYear: 2000,
        spouseAgeAtLiquidation: 24,
      } as unknown as PerTransfertInput['currentRentOptions'],
    }));
    const withOlderSpouse = computePerTransfert(makeInput({
      currentRentOptions: {
        ...baseManualOptions,
        spouseBirthYear: 1940,
        spouseAgeAtLiquidation: 84,
      } as unknown as PerTransfertInput['currentRentOptions'],
    }));

    expect(withOlderSpouse.keepScenario.currentRent.grossAnnualRent)
      .toBeGreaterThan(withYoungSpouse.keepScenario.currentRent.grossAnnualRent);
  });
});
