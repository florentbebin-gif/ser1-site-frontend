import { describe, expect, it } from 'vitest';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { DMTG_SETTINGS } from './successionChainage.regimes.fixtures';
import { makeCivil, makeLiquidation } from './successionChainage.test.helpers';

describe('buildSuccessionChainageAnalysis - société d’acquêts', () => {
  it('reports zero at step 1 and full patrimoine at step 2 in communaute universelle with attribution integrale', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'communaute_universelle' }),
      liquidation: makeLiquidation({ actifEpoux1: 200000, actifEpoux2: 300000, actifCommun: 1_500_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_universelle',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: true,
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'pleine_propriete_totale',
        preciputMontant: 100000,
      },
    });

    expect(analysis.step1?.actifTransmis).toBe(0);
    expect(analysis.step1?.partConjoint).toBe(0);
    expect(analysis.step1?.partEnfants).toBe(0);
    expect(analysis.step1?.droitsEnfants).toBe(0);
    expect(analysis.step2?.actifTransmis).toBe(2_000_000);
    expect(analysis.totalDroits).toBe(analysis.step2?.droitsEnfants ?? 0);
    expect(analysis.warnings.some((warning) => warning.includes('attribution integrale'))).toBe(true);
  });

  it("liquidates the societe d'acquets pocket with contractual quotes", () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 200000, actifCommun: 400000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 40,
          quoteEpoux2Pct: 60,
          attributionSurvivantPct: 0,
        },
      },
      societeAcquetsNetValue: 400000,
    });

    expect(analysis.step1?.actifTransmis).toBe(460000);
    expect(analysis.step1?.partConjoint).toBe(115000);
    expect(analysis.step1?.partEnfants).toBe(345000);
    expect(analysis.step2?.actifTransmis).toBe(555000);
    expect(analysis.societeAcquets).toMatchObject({
      totalValue: 400000,
      firstEstateContribution: 160000,
      survivorShare: 240000,
      deceasedQuotePct: 40,
      survivorQuotePct: 60,
      liquidationMode: 'quotes',
    });
    expect(analysis.warnings.some((warning) => warning.includes("Societe d'acquets"))).toBe(true);
  });

  it("applies a preliminary survivor attribution before splitting the societe d'acquets pocket", () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 200000, actifCommun: 400000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        societeAcquets: {
          active: true,
          liquidationMode: 'attribution_survivant',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 25,
        },
      },
      societeAcquetsNetValue: 400000,
    });

    expect(analysis.step1?.actifTransmis).toBe(450000);
    expect(analysis.step1?.partConjoint).toBe(112500);
    expect(analysis.step2?.actifTransmis).toBe(562500);
    expect(analysis.societeAcquets?.survivorAttributionAmount).toBe(100000);
    expect(analysis.warnings.some((warning) => warning.includes('attribution prealable'))).toBe(true);
  });

  it("can report the whole societe d'acquets pocket to the survivor while keeping the deceased own assets in step 1", () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 200000, actifCommun: 400000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: true,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 50000,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
      },
      societeAcquetsNetValue: 400000,
    });

    expect(analysis.step1?.actifTransmis).toBe(300000);
    expect(analysis.step1?.partConjoint).toBe(75000);
    expect(analysis.step2?.actifTransmis).toBe(675000);
    expect(analysis.societeAcquets?.attributionIntegrale).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('attribution integrale du reliquat'))).toBe(true);
  });

  it('applies a simplified participation claim when the dedicated config is active', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'participation_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        participationAcquets: {
          active: true,
          useCurrentAssetsAsFinalPatrimony: true,
          patrimoineOriginaireEpoux1: 100000,
          patrimoineOriginaireEpoux2: 100000,
          patrimoineFinalEpoux1: 0,
          patrimoineFinalEpoux2: 0,
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
        },
      },
    });

    expect(analysis.participationAcquets).toMatchObject({
      active: true,
      creditor: 'epoux2',
      debtor: 'epoux1',
      quoteAppliedPct: 50,
      creanceAmount: 150000,
      firstEstateAdjustment: -150000,
    });
    expect(analysis.step1?.actifTransmis).toBe(350000);
    expect(analysis.step2?.actifTransmis).toBe(437500);
    expect(analysis.warnings.some((warning) => warning.includes('Participation aux acquets'))).toBe(true);
  });

  it("SA quotes + préciput : preciputAmount soustrait avant application des quotes", () => {
    // SA value = 400 000, préciput = 50 000 → reliquat = 350 000
    // quotes 50/50 → firstEstateContribution = 350 000 × 50 % = 175 000
    // step1 = propres époux1 (300 000) + 175 000 = 475 000
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 50_000,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
      },
      societeAcquetsNetValue: 400_000,
    });

    expect(analysis.societeAcquets?.preciputAmount).toBe(50_000);
    expect(analysis.societeAcquets?.firstEstateContribution).toBe(175_000);
    expect(analysis.step1?.actifTransmis).toBe(475_000);
    expect(analysis.warnings.some((w) => w.includes('preciput'))).toBe(true);
  });

  it("SA quotes + préciput supérieur à la valeur SA : plafonné à la valeur totale SA", () => {
    // SA value = 100 000, préciput = 200 000 → préciput plafonné à 100 000
    // reliquat = 0 → firstEstateContribution = 0
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 100_000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DMTG_SETTINGS,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 200_000,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
      },
      societeAcquetsNetValue: 100_000,
    });

    expect(analysis.societeAcquets?.preciputAmount).toBe(100_000);
    expect(analysis.societeAcquets?.firstEstateContribution).toBe(0);
    // step1 = propres époux1 (300 000) + 0 SA = 300 000
    expect(analysis.step1?.actifTransmis).toBe(300_000);
  });
});
