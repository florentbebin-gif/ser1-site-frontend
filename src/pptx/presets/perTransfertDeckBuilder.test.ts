import { describe, expect, it } from 'vitest';

import { buildPerTransfertStudyDeck } from './perTransfertDeckBuilder';
import type { PerTransfertDeckData, PerTransfertUiSettingsForPptx } from './perTransfertDeckBuilder';
import {
  computePerTransfert,
  type PerTransfertFiscalAssumptions,
  type PerTransfertInput,
  type PerTransfertResult,
} from '@/engine/per';
import { DEFAULT_COLORS } from '@/settings/theme';
import type { PerTransfertSynthesisSlideSpec } from '../theme/types';

const theme: PerTransfertUiSettingsForPptx = DEFAULT_COLORS;

const fiscalAssumptions: PerTransfertFiscalAssumptions = {
  rvtoTaxableFractionByAge: [
    { label: 'test', ageMaxInclusive: null, fraction: 0.4 },
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

const input: PerTransfertInput = {
  productType: 'PER',
  originalContractType: 'MADELIN',
  capitalAcquis: 50_000,
  interetsAcquis: 5_000,
  renteActuelleAnnuelleBrute: 1_500,
  insured: { sex: 'M', birthYear: 1960, currentAge: 60, liquidationAge: 64 },
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
    transferFeeRate: 0,
    performanceUntilRetirementRate: 0,
    currentRentRevaluationRate: 0,
    newRentRevaluationRate: 0,
    capitalExitRevaluationRate: 0,
    capitalShareRate: 0.2,
    horizonAgeShort: 80,
    horizonAgeLong: 90,
  },
  prefon: { enabled: false, points: 0, acquisitionAge: 60, params: null },
};

function normalizeText(value: string): string {
  return value.replace(/\s/g, ' ');
}

function findSynthesisSlide(result: PerTransfertResult): PerTransfertSynthesisSlideSpec {
  const data: PerTransfertDeckData = {
    input,
    result,
    selectedContract: null,
  };
  const spec = buildPerTransfertStudyDeck(data, theme);
  const slide = spec.slides.find((candidate) => candidate.type === 'per-transfert-synthesis');
  expect(slide).toBeDefined();
  return slide as PerTransfertSynthesisSlideSpec;
}

describe('buildPerTransfertStudyDeck', () => {
  it('genere une etude client structuree en quinze slides de contenu', () => {
    const data: PerTransfertDeckData = {
      input,
      result: computePerTransfert(input),
      selectedContract: null,
    };
    const spec = buildPerTransfertStudyDeck(data, theme);

    expect(spec.cover.title).toContain('Transfert');
    expect(spec.slides).toHaveLength(15);
    expect(spec.slides.map((slide) => slide.type)).toContain('chapter');
    expect(spec.slides.map((slide) => slide.type)).toContain('per-transfert-synthesis');
    expect(spec.slides[spec.slides.length - 1]?.type).toBe('content');
  });

  it('restitue les valeurs golden G1-G14 dans la synthese dediee', () => {
    const computed = computePerTransfert(input);
    const goldenResult: PerTransfertResult = {
      ...computed,
      currentConversionRate: 0.03,
      currentRent: {
        ...computed.currentRent,
        grossAnnualRent: 3_000,
        netAnnualRent: 1_880,
        cumulativeToShortHorizon: 32_447,
        cumulativeToLongHorizon: 55_511,
      },
      newPerRent: {
        ...computed.newPerRent,
        grossAnnualRent: 3_103,
        apparentRate: 0.031,
      },
      newPerFiscal: {
        ...computed.newPerFiscal,
        netAnnualRent: 2_163,
      },
      capitalExit: {
        ...computed.capitalExit,
        unique: {
          available: true,
          capital: 100_000,
          gains: 0,
          incomeTax: 30_000,
          socialContributions: 0,
          netPS: 100_000,
          netIRPS: 70_000,
        },
        shortHorizon: {
          ...computed.capitalExit.shortHorizon,
          horizonAge: 80,
          cumulativeNetWithdrawals: 89_164,
        },
        longHorizon: {
          ...computed.capitalExit.longHorizon,
          horizonAge: 90,
          cumulativeNetWithdrawals: 101_808,
        },
        withoutWithdrawalToLongHorizon: 215_659,
      },
    };
    const slide = findSynthesisSlide(goldenResult);
    const values = slide.rows.flatMap((row) => [
      row.label,
      row.currentContract,
      row.newPer,
      row.capitalExit,
    ]).map(normalizeText);

    expect(values).toContain('Taux de conversion');
    expect(values).toContain('3,00 %');
    expect(values).toContain('3 000 €');
    expect(values).toContain('1 880 €');
    expect(values).toContain('3 103 €');
    expect(values).toContain('2 163 €');
    expect(values).toContain('32 447 €');
    expect(values).toContain('55 511 €');
    expect(values).toContain('70 000 €');
    expect(values).toContain('89 164 €');
    expect(values).toContain('101 808 €');
    expect(values).toContain('215 659 €');
  });
});
