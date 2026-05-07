import { describe, expect, it } from 'vitest';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { computeStep1Split } from '../successionChainageEstateSplit';
import { DMTG_SETTINGS } from './successionChainage.regimes.fixtures';
import { makeCivil, makeLiquidation } from './successionChainage.test.helpers';

describe('buildSuccessionChainageAnalysis - DDV', () => {
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
      dmtgSettings: DMTG_SETTINGS,
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
      dmtgSettings: DMTG_SETTINGS,
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
      dmtgSettings: DMTG_SETTINGS,
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
      dmtgSettings: DMTG_SETTINGS,
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
      dmtgSettings: DMTG_SETTINGS,
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
      dmtgSettings: DMTG_SETTINGS,
      attributionBiensCommunsPct: 80,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }, { id: 'E2', rattachement: 'commun' }],
      familyMembers: [],
    });

    expect(analysis.step1?.actifTransmis).toBe(380_000);
    expect(analysis.step1?.partConjoint).toBeCloseTo(95_000, 0);
    expect(analysis.step2?.actifTransmis).toBe(615_000);
  });
});
