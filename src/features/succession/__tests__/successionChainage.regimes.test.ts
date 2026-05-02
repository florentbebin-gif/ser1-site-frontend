import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { computeStep1Split } from '../successionChainageEstateSplit';
import {
  makeCivil,
  makeLiquidation,
  makeDevolution,
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

  it('DDV pleine_propriete_quotite actif (computeStep1Split) : conjointPart = quotite disponible', () => {
    // 2 enfants → réserve 2/3, quotité dispo 1/3 = 600 000 / 3 = 200 000
    const result = computeStep1Split(
      makeCivil({ regimeMatrimonial: 'separation_biens' }),
      'separation_biens',
      600_000,
      2,
      'epoux1',
      { donationEntreEpouxActive: true, donationEntreEpouxOption: 'pleine_propriete_quotite' },
    );

    expect(result.conjointPart).toBeCloseTo(200_000, 0);
    expect(result.enfantsPart).toBeCloseTo(400_000, 0);
    expect(result.carryOverToStep2).toBeCloseTo(200_000, 0);
    expect(result.preciputDeducted).toBe(0);
  });

  it('DDV pleine_propriete_quotite actif (chainage e2e) : step1 plafonne a la quotite, step2 = survivorBase + carry PP', () => {
    // SB, epoux1 décédé, estate=600k, 2 enfants
    // step1 : conjointPart = 200k (quotité 1/3), enfantsPart = 400k (réserve 2/3)
    // survivorBase = (600k+200k) - 600k = 200k ; step2 = 200k + 200k = 400k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 600_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      patrimonial: {
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'pleine_propriete_quotite',
        attributionIntegrale: false,
        preciputMontant: 0,
      },
    });

    expect(analysis.step1?.partConjoint).toBeCloseTo(200_000, 0);  // quotité 1/3 = 200k
    expect(analysis.step1?.partEnfants).toBeCloseTo(400_000, 0);   // réserve 2/3 = 400k
    expect(analysis.step2?.actifTransmis).toBe(400_000);           // survivorBase(200k) + carry PP(200k)
  });

  it('DDV mixte avec date de naissance (chainage e2e) : 1/4 PP + 3/4 usufruit CGI 669, carry = PP seule', () => {
    // SB, epoux1 décédé, epoux2 né 1965-01-01, referenceDate 2026-01-01 → age=61
    // BAREME_USUFRUIT_669 (successionUsufruit.ts:7) : 61 <= age < 71 → tauxUsufruit=0.4
    // estate=300k ; 1/4 PP=75k, 3/4=225k × 0.4=90k (usufruit)
    // conjointPart = 75k + 90k = 165k ; carryOverToStep2 = 75k (PP seule, usufruit non transmis)
    // survivorBase = (300k+200k) - 300k = 200k ; step2 = 200k + 75k = 275k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens', dateNaissanceEpoux2: '1965-01-01' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      patrimonial: {
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'mixte',
        attributionIntegrale: false,
        preciputMontant: 0,
      },
    });

    expect(analysis.step1?.partConjoint).toBeCloseTo(165_000, 0);
    expect(analysis.step1?.partEnfants).toBeCloseTo(135_000, 0);
    expect(analysis.step2?.actifTransmis).toBeCloseTo(275_000, 0);
    expect(analysis.warnings.some((w) => w.includes('mixte'))).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('669'))).toBe(true);
  });

  it('attributionBiensCommunsPct=80 (chainage e2e CL) : firstEstate reduit, step2 elargi', () => {
    // CL, epoux1 décédé : propres epoux1=300k, actifCommun=400k, propres epoux2=200k
    // attributionPct=80 → survivant prend 80% du commun
    // firstEstate = 300k + 400k × (1-0.8) = 380k   (source: successionChainage.ts:164)
    // survivorBase = 900k - 380k = 520k              (source: successionChainage.ts:186)
    // carryOver = 380k × 1/4 = 95k (sans DDV, 2 enfants)
    // step2 = survivorBase + carryOver = 615k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'communaute_legale' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      attributionBiensCommunsPct: 80,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
    });

    expect(analysis.step1?.actifTransmis).toBe(380_000);
    expect(analysis.step1?.partConjoint).toBeCloseTo(95_000, 0);
    expect(analysis.step2?.actifTransmis).toBe(615_000);
  });

  it("SA active + preciputMode cible sans selection : preciputMontant gouverne societeAcquets.preciputAmount (usesGlobalFallback)", () => {
    // preciputMode:'cible' sans sélection active → usesGlobalFallback=true
    // SA.preciputAmount = min(preciputMontant=60k, totalSA=400k) = 60k
    // reliquat SA = 340k ; quotes 50/50 → firstEstateContribution = 170k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      societeAcquetsNetValue: 400_000,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMode: 'cible',
        preciputMontant: 60_000,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
      },
    });

    expect(analysis.societeAcquets?.preciputAmount).toBe(60_000);
    expect(analysis.societeAcquets?.firstEstateContribution).toBe(170_000);
    expect(analysis.preciput?.usesGlobalFallback).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('preciput'))).toBe(true);
  });

  it("T9 [audit] SA préciput cible avec sélection active : usesGlobalFallback=false, preciputAmount=min(selection,asset)", () => {
    // Scénario cible réel (G7) : sélection active sur asset SA-1 (150k) pour 80k.
    // preciputPatrimonial.preciputMontant = resolvedPreciput.requestedAmount = 80k
    // SA total = 400k ; preciput = 80k ; reliquat = 320k ; quotes 50/50 → firstEstateContribution = 160k
    // step1.actifTransmis = propres époux1 (300k) + 160k = 460k
    // Le warning fallback NE doit PAS apparaître.
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      societeAcquetsNetValue: 400_000,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      assetEntries: [
        { id: 'SA-1', pocket: 'societe_acquets', category: 'financier', subCategory: 'Compte épargne', amount: 150_000 },
      ],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMode: 'cible',
        preciputMontant: 0,
        preciputSelections: [
          { id: 'sel-1', sourceType: 'asset', sourceId: 'SA-1', labelSnapshot: 'SA-1', pocket: 'societe_acquets', amount: 80_000, enabled: true },
        ],
        societeAcquets: { active: true, liquidationMode: 'quotes', quoteEpoux1Pct: 50, quoteEpoux2Pct: 50, attributionSurvivantPct: 0 },
      },
    });

    expect(analysis.preciput?.mode).toBe('cible');
    expect(analysis.preciput?.usesGlobalFallback).toBe(false);
    expect(analysis.preciput?.appliedAmount).toBe(80_000);
    expect(analysis.societeAcquets?.preciputAmount).toBe(80_000);
    expect(analysis.societeAcquets?.firstEstateContribution).toBe(160_000);
    expect(analysis.step1?.actifTransmis).toBe(460_000);
    // Warning cible présent, warning fallback absent
    expect(analysis.warnings.some((w) => w.includes('Preciput cible:') && w.includes('80'))).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('repli sur le montant global'))).toBe(false);
  });

  it('T6a [audit] choixLegal usufruit + date fournie : usufruit CGI 669 appliqué, carryOver=0', () => {
    // CL, époux1 décédé, firstEstate = 200k + 200k = 400k, survivorBase = 400k
    // dateNaissanceEpoux2='1975-01-01', refDate='2026-01-01' → âge=51 → taux 0.5 (bracket <61)
    // conjointPart = 400k × 0.5 = 200k ; enfantsPart = 200k ; carryOver = 0
    // step2.actifTransmis = survivorBase(400k) + carryOver(0) = 400k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ dateNaissanceEpoux2: '1975-01-01' }),
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({ choixLegalConjointSansDDV: 'usufruit', nbEnfantsNonCommuns: 0 }),
      referenceDate: new Date('2026-01-01'),
    });

    expect(analysis.step1?.partConjoint).toBe(200_000);
    expect(analysis.step1?.partEnfants).toBe(200_000);
    expect(analysis.step2?.actifTransmis).toBe(400_000);
    expect(analysis.warnings.some((w) => w.includes('Choix legal du conjoint') && w.includes('669'))).toBe(true);
    // Pas de warning hypothèse moteur
    expect(analysis.warnings.some((w) => w.includes('Hypothese simplifiee'))).toBe(false);
  });

  it('T6b [audit] choixLegal quart_pp : 1/4 PP explicite avec warning art. 757 CC', () => {
    // CL, même scénario, choix explicite 1/4 PP
    // conjointPart = 400k × 0.25 = 100k ; carryOver = 100k
    // step2.actifTransmis = 400k + 100k = 500k
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ dateNaissanceEpoux2: '1975-01-01' }),
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({ choixLegalConjointSansDDV: 'quart_pp', nbEnfantsNonCommuns: 0 }),
      referenceDate: new Date('2026-01-01'),
    });

    expect(analysis.step1?.partConjoint).toBe(100_000);
    expect(analysis.step2?.actifTransmis).toBe(500_000);
    expect(analysis.warnings.some((w) => w.includes('1/4 en pleine propriete retenu (art. 757 CC)'))).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('Hypothese simplifiee'))).toBe(false);
  });

  it('T6c [audit] choixLegal usufruit sans date de naissance : fallback 1/4 PP + warning date manquante', () => {
    // Pas de dateNaissanceEpoux2 → valorisation CGI 669 impossible → repli 1/4 PP
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil(),
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({ choixLegalConjointSansDDV: 'usufruit', nbEnfantsNonCommuns: 0 }),
      referenceDate: new Date('2026-01-01'),
    });

    expect(analysis.step1?.partConjoint).toBe(100_000);
    expect(analysis.warnings.some((w) => w.includes('date de naissance') && w.includes('manquante'))).toBe(true);
  });

  it('T6d [audit] choixLegal usufruit + enfant non commun : usufruit ignoré, 1/4 PP forcé (art. 757 CC)', () => {
    // Présence d'enfant non commun → usufruit legal inapplicable
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ dateNaissanceEpoux2: '1975-01-01' }),
      liquidation: makeLiquidation({ actifEpoux1: 200_000, actifEpoux2: 200_000, actifCommun: 400_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({ choixLegalConjointSansDDV: 'usufruit', nbEnfantsNonCommuns: 1 }),
      referenceDate: new Date('2026-01-01'),
    });

    expect(analysis.step1?.partConjoint).toBe(100_000);
    expect(analysis.warnings.some((w) => w.includes("enfant(s) non commun(s)"))).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('Choix legal du conjoint') && w.includes('669'))).toBe(false);
  });

});
