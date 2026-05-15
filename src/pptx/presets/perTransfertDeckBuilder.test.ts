import { describe, expect, it } from 'vitest';

import { buildPerTransfertStudyDeck } from './perTransfertDeckBuilder';
import type { PerTransfertDeckData, PerTransfertUiSettingsForPptx } from './perTransfertDeckBuilder';
import { computePerTransfert, type PerTransfertFiscalAssumptions, type PerTransfertInput } from '@/engine/per';
import { DEFAULT_COLORS } from '@/settings/theme';

const theme: PerTransfertUiSettingsForPptx = DEFAULT_COLORS;

const fiscalAssumptions: PerTransfertFiscalAssumptions = {
  rvtoTaxableFractionByAge: [
    { label: 'test', ageMaxInclusive: null, fraction: 0.4 },
  ],
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
    expect(spec.slides[spec.slides.length - 1]?.type).toBe('content');
  });
});
