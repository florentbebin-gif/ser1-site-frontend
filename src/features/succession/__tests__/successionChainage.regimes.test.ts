import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { computeStep1Split } from '../successionChainageEstateSplit';
import {
  makeCivil,
  makeLiquidation,
} from './successionChainage.test.helpers';

describe('buildSuccessionChainageAnalysis - special regimes', () => {
  it('reports zero at step 1 and full patrimoine at step 2 in communaute universelle with attribution integrale', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'communaute_universelle' }),
      liquidation: makeLiquidation({ actifEpoux1: 200000, actifEpoux2: 300000, actifCommun: 1_500_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_universelle',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
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
      dmtgSettings: DEFAULT_DMTG,
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
      dmtgSettings: DEFAULT_DMTG,
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
      dmtgSettings: DEFAULT_DMTG,
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
      dmtgSettings: DEFAULT_DMTG,
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
      dmtgSettings: DEFAULT_DMTG,
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
      dmtgSettings: DEFAULT_DMTG,
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

  it('DDV pleine_propriete_totale : conjoint reçoit tout, enfants 0, carryOver = estate entier', () => {
    // estate (époux1, SB) = 300 000 ; DDV totale → conjoint = 300 000, enfants = 0
    const result = computeStep1Split(
      makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'separation_biens' }),
      'separation_biens',
      300_000,
      2,
      'epoux1',
      { donationEntreEpouxActive: true, donationEntreEpouxOption: 'pleine_propriete_totale' },
    );

    expect(result.conjointPart).toBe(300_000);
    expect(result.enfantsPart).toBe(0);
    expect(result.carryOverToStep2).toBe(300_000);
    expect(result.preciputDeducted).toBe(0);
    expect(result.warnings.some((w) => w.includes('totalite en pleine propriete'))).toBe(true);
  });

  it('DDV pleine_propriete_totale : chainage step2 reçoit les propres + carry', () => {
    // époux1 décédé SB : propres = 300 000 ; époux2 : 200 000
    // carryOver = 300 000 → step2 = 200 000 + 300 000 = 500 000
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      patrimonial: {
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'pleine_propriete_totale',
        attributionIntegrale: false,
        preciputMontant: 0,
      },
    });

    expect(analysis.step1?.partConjoint).toBe(300_000);
    expect(analysis.step1?.partEnfants).toBe(0);
    expect(analysis.step2?.actifTransmis).toBe(500_000);
  });

  it('DDV mixte : 1/4 PP + usufruit des 3/4 valorisé CGI 669', () => {
    // Époux 2 né le 1960-01-01, referenceDate = 2024-01-01 → 64 ans → taux usufruit = 40 %
    // estate = 500 000 ; PP = 125 000, 3/4 = 375 000
    // valeurUsufruit = 375 000 × 40 % = 150 000
    // conjointPart = 125 000 + 150 000 = 275 000 ; enfantsPart = 375 000 × 60 % = 225 000
    // carryOverToStep2 = 125 000 (seulement la PP)
    const REFERENCE = new Date('2024-01-01T00:00:00Z');
    const result = computeStep1Split(
      makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
        dateNaissanceEpoux2: '1960-01-01',
      }),
      'separation_biens',
      500_000,
      2,
      'epoux1',
      { donationEntreEpouxActive: true, donationEntreEpouxOption: 'mixte' },
      REFERENCE,
    );

    expect(result.conjointPart).toBeCloseTo(275_000, 0);
    expect(result.enfantsPart).toBeCloseTo(225_000, 0);
    expect(result.carryOverToStep2).toBeCloseTo(125_000, 0);
    expect(result.warnings.some((w) => w.includes('mixte'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('669'))).toBe(true);
  });

  it('DDV usufruit_total sans date de naissance : repli 1/4 PP, warning date manquante', () => {
    const result = computeStep1Split(
      makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'separation_biens' }),
      'separation_biens',
      400_000,
      2,
      'epoux1',
      { donationEntreEpouxActive: true, donationEntreEpouxOption: 'usufruit_total' },
    );

    expect(result.conjointPart).toBeCloseTo(100_000, 0); // 1/4
    expect(result.carryOverToStep2).toBeCloseTo(100_000, 0);
    expect(result.warnings.some((w) => w.includes('date de naissance'))).toBe(true);
  });

  it('DDV mixte sans date de naissance : repli 1/4 PP, warning date manquante', () => {
    const result = computeStep1Split(
      makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'separation_biens' }),
      'separation_biens',
      400_000,
      2,
      'epoux1',
      { donationEntreEpouxActive: true, donationEntreEpouxOption: 'mixte' },
    );

    expect(result.conjointPart).toBeCloseTo(100_000, 0);
    expect(result.carryOverToStep2).toBeCloseTo(100_000, 0);
    expect(result.warnings.some((w) => w.includes('date de naissance'))).toBe(true);
  });

  it('applies the residence principale abatement on step 1 only in chainage', () => {
    const transmissionBasis = {
      ordinaryTaxableAssetsParPocket: {
        epoux1: 0,
        epoux2: 0,
        communaute: 1_000_000,
        societe_acquets: 0,
        indivision_pacse: 0,
        indivision_concubinage: 0,
        indivision_separatiste: 0,
      },
      passifsParPocket: {
        epoux1: 0,
        epoux2: 0,
        communaute: 0,
        societe_acquets: 0,
        indivision_pacse: 0,
        indivision_concubinage: 0,
        indivision_separatiste: 0,
      },
      groupementFoncierEntries: [],
      hasBeneficiaryLevelGfAdjustment: false,
      residencePrincipaleEntry: {
        pocket: 'communaute' as const,
        valeurTotale: 1_000_000,
      },
    };

    const withoutAbatement = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 0, actifEpoux2: 0, actifCommun: 1_000_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      transmissionBasis,
      abattementResidencePrincipale: false,
    });
    const withAbatement = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 0, actifEpoux2: 0, actifCommun: 1_000_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      transmissionBasis,
      abattementResidencePrincipale: true,
    });

    expect(withAbatement.step1?.droitsEnfants).toBeLessThan(withoutAbatement.step1?.droitsEnfants ?? 0);
    expect(withAbatement.step2?.droitsEnfants).toBe(withoutAbatement.step2?.droitsEnfants);
    expect(
      withAbatement.warnings.some((warning) => warning.includes('abattement residence principale 20 % applique')),
    ).toBe(true);
  });
});
