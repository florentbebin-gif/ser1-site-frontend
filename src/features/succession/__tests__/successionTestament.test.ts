import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import {
  buildTestamentBeneficiaryOptions,
  computeTestamentDistribution,
  getQuotiteDisponiblePctForSide,
  getReserveHintForSide,
  getTestamentCardTitle,
} from '../successionTestament';
import { makeCivil, makeDevolution, makeLiquidation } from './fixtures';

describe('computeTestamentDistribution', () => {
  const ENFANTS_2 = [
    { id: 'E1', rattachement: 'commun' as const },
    { id: 'E2', rattachement: 'commun' as const },
  ];

  it('legs_universel au conjoint : plafonné à la quotité disponible, conjoint exonéré', () => {
    // 2 enfants → quotité dispo = 1/3 → plafond = 300 000 / 3 = 100 000
    const result = computeTestamentDistribution({
      situation: 'marie',
      side: 'epoux1',
      testament: {
        active: true,
        dispositionType: 'legs_universel',
        beneficiaryRef: 'principal:epoux2',
        quotePartPct: 100,
        particularLegacies: [],
      },
      masseReference: 300_000,
      enfants: ENFANTS_2,
      familyMembers: [],
    });

    expect(result).not.toBeNull();
    expect(result!.distributedAmount).toBeCloseTo(100_000, 0);
    expect(result!.plafondTestament).toBeCloseTo(100_000, 0);
    expect(result!.beneficiaries).toHaveLength(1);
    expect(result!.beneficiaries[0].lien).toBe('conjoint');
    expect(result!.beneficiaries[0].exonerated).toBe(true);
    expect(result!.warnings.some((w) => w.includes('plafonnement'))).toBe(true);
  });

  it('legs_titre_universel (50 %) : plafonnement à la quotité disponible', () => {
    // 2 enfants → quotité dispo = 1/3 = 200 000
    // requestedAmount = 600 000 × 50 % = 300 000 → plafonnement à 200 000
    const result = computeTestamentDistribution({
      situation: 'marie',
      side: 'epoux1',
      testament: {
        active: true,
        dispositionType: 'legs_titre_universel',
        beneficiaryRef: 'principal:epoux2',
        quotePartPct: 50,
        particularLegacies: [],
      },
      masseReference: 600_000,
      enfants: ENFANTS_2,
      familyMembers: [],
    });

    expect(result).not.toBeNull();
    expect(result!.requestedAmount).toBeCloseTo(300_000, 0);
    expect(result!.distributedAmount).toBeCloseTo(200_000, 0);
    expect(result!.warnings.some((w) => w.includes('plafonnement'))).toBe(true);
  });

  it('legs_particulier multi-bénéficiaires sans dépassement : distribués intégralement', () => {
    const result = computeTestamentDistribution({
      situation: 'marie',
      side: 'epoux1',
      testament: {
        active: true,
        dispositionType: 'legs_particulier',
        beneficiaryRef: null,
        quotePartPct: 0,
        particularLegacies: [
          { id: 'L1', beneficiaryRef: 'enfant:E1', amount: 40_000 },
          { id: 'L2', beneficiaryRef: 'enfant:E2', amount: 30_000 },
        ],
      },
      masseReference: 600_000,
      enfants: ENFANTS_2,
      familyMembers: [],
    });

    expect(result).not.toBeNull();
    expect(result!.distributedAmount).toBeCloseTo(70_000, 0);
    expect(result!.beneficiaries).toHaveLength(2);
    const partE1 = result!.beneficiaries.find((b) => b.id === 'E1')?.partSuccession ?? 0;
    const partE2 = result!.beneficiaries.find((b) => b.id === 'E2')?.partSuccession ?? 0;
    expect(partE1).toBeCloseTo(40_000, 0);
    expect(partE2).toBeCloseTo(30_000, 0);
  });

  it('legs_particulier avec dépassement : ratio appliqué sur chaque legs', () => {
    // 2 enfants → plafond = 600 000 / 3 = 200 000
    // Legs total = 250 000 → ratio = 200 000 / 250 000 = 0.8
    const result = computeTestamentDistribution({
      situation: 'marie',
      side: 'epoux1',
      testament: {
        active: true,
        dispositionType: 'legs_particulier',
        beneficiaryRef: null,
        quotePartPct: 0,
        particularLegacies: [
          { id: 'L1', beneficiaryRef: 'enfant:E1', amount: 150_000 },
          { id: 'L2', beneficiaryRef: 'enfant:E2', amount: 100_000 },
        ],
      },
      masseReference: 600_000,
      enfants: ENFANTS_2,
      familyMembers: [],
    });

    expect(result).not.toBeNull();
    expect(result!.distributedAmount).toBeCloseTo(200_000, 0);
    const partE1 = result!.beneficiaries.find((b) => b.id === 'E1')?.partSuccession ?? 0;
    const partE2 = result!.beneficiaries.find((b) => b.id === 'E2')?.partSuccession ?? 0;
    expect(partE1).toBeCloseTo(120_000, 0); // 150 000 × 0.8
    expect(partE2).toBeCloseTo(80_000, 0);  // 100 000 × 0.8
    expect(result!.warnings.some((w) => w.includes('plafonnement'))).toBe(true);
  });

  it('legs_particulier avec bénéficiaire absent du contexte : warning généré', () => {
    const result = computeTestamentDistribution({
      situation: 'marie',
      side: 'epoux1',
      testament: {
        active: true,
        dispositionType: 'legs_particulier',
        beneficiaryRef: null,
        quotePartPct: 0,
        particularLegacies: [
          { id: 'L1', beneficiaryRef: null, amount: 50_000 },
        ],
      },
      masseReference: 300_000,
      enfants: ENFANTS_2,
      familyMembers: [],
    });

    expect(result).not.toBeNull();
    expect(result!.beneficiaries).toHaveLength(0);
    expect(result!.warnings.some((w) => w.includes('sans beneficiaire'))).toBe(true);
  });

  it('testament actif sans type de disposition : distributedAmount = 0, warning', () => {
    const result = computeTestamentDistribution({
      situation: 'marie',
      side: 'epoux1',
      testament: {
        active: true,
        dispositionType: null,
        beneficiaryRef: null,
        quotePartPct: 0,
        particularLegacies: [],
      },
      masseReference: 300_000,
      enfants: ENFANTS_2,
      familyMembers: [],
    });

    expect(result).not.toBeNull();
    expect(result!.distributedAmount).toBe(0);
    expect(result!.warnings.some((w) => w.includes('type de disposition'))).toBe(true);
  });

  it('PACS avec testament en faveur du partenaire : lien conjoint, exonéré', () => {
    const result = computeTestamentDistribution({
      situation: 'pacse',
      side: 'epoux1',
      testament: {
        active: true,
        dispositionType: 'legs_universel',
        beneficiaryRef: 'principal:epoux2',
        quotePartPct: 100,
        particularLegacies: [],
      },
      masseReference: 400_000,
      enfants: [],
      familyMembers: [],
    });

    expect(result).not.toBeNull();
    expect(result!.beneficiaries).toHaveLength(1);
    expect(result!.beneficiaries[0].lien).toBe('conjoint');
    expect(result!.beneficiaries[0].exonerated).toBe(true);
    expect(result!.distributedAmount).toBeCloseTo(400_000, 0);
  });
});

describe('computeTestamentDistribution → chainage end-to-end', () => {
  it('legs_universel vers enfant : step1.beneficiaries contient le légataire', () => {
    const enfants = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'commun' as const },
    ];
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'communaute_legale' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'enfant:E1',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1?.actifTransmis).toBe(300_000);   // propres époux1, pas de commun
    const conjoint = analysis.step1?.beneficiaries.find((b) => b.lien === 'conjoint');
    expect(conjoint?.brut).toBe(75_000);                   // 300 000 × 1/4 (part légale sans DDV)
    const e1 = analysis.step1?.beneficiaries.find((b) => b.id === 'E1');
    expect(e1?.brut).toBe(162_500);                        // 100 000 (testament) + 62 500 (réserve)
    const e2 = analysis.step1?.beneficiaries.find((b) => b.id === 'E2');
    expect(e2?.brut).toBe(62_500);                         // 125 000 résiduel / 2 (réserve seule)
  });

  it('legs_titre_universel (chainage e2e) : plafonné à la quotité, bruts exacts', () => {
    // CL, propres epoux1=300k, actifCommun=0, 2 enfants communs
    // legs_titre_universel 50% vers E1 : requested=150k → plafonnement à quotité=100k
    // conjoint 1/4 PP = 75k ; résidu réserve = 300k-75k-100k = 125k → 62.5k/enfant
    // E1.brut = 100k (testament) + 62.5k (réserve) = 162.5k
    // E2.brut = 62.5k (réserve seule)
    const enfants = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'commun' as const },
    ];
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'communaute_legale' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_titre_universel',
            beneficiaryRef: 'enfant:E1',
            quotePartPct: 50,
            particularLegacies: [],
          },
        },
      }),
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1?.actifTransmis).toBe(300_000);
    const conjoint3 = analysis.step1?.beneficiaries.find((b) => b.lien === 'conjoint');
    expect(conjoint3?.brut).toBe(75_000);                  // 1/4 PP légal
    const e1t3 = analysis.step1?.beneficiaries.find((b) => b.id === 'E1');
    expect(e1t3?.brut).toBe(162_500);                      // 100k testament (plafonné) + 62.5k réserve
    const e2t3 = analysis.step1?.beneficiaries.find((b) => b.id === 'E2');
    expect(e2t3?.brut).toBe(62_500);                       // réserve seule
    expect(analysis.warnings.some((w) => w.includes('plafonnement'))).toBe(true);
  });

  it('legs_particulier multi-legataire (chainage e2e) : ratio appliqué, bruts exacts', () => {
    // CL, propres epoux1=300k, actifCommun=0, 2 enfants communs
    // legs E1=150k, E2=50k → total=200k > quotité=100k → ratio=0.5
    // E1 testament = 75k, E2 testament = 25k
    // conjoint 1/4 PP = 75k ; résidu réserve = 125k → 62.5k/enfant
    // E1.brut = 75k + 62.5k = 137.5k ; E2.brut = 25k + 62.5k = 87.5k
    const enfants = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'commun' as const },
    ];
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'communaute_legale' }),
      liquidation: makeLiquidation({ actifEpoux1: 300_000, actifEpoux2: 200_000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_particulier',
            beneficiaryRef: null,
            quotePartPct: 0,
            particularLegacies: [
              { id: 'L1', beneficiaryRef: 'enfant:E1', amount: 150_000 },
              { id: 'L2', beneficiaryRef: 'enfant:E2', amount: 50_000 },
            ],
          },
        },
      }),
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1?.actifTransmis).toBe(300_000);
    const conjoint4 = analysis.step1?.beneficiaries.find((b) => b.lien === 'conjoint');
    expect(conjoint4?.brut).toBe(75_000);
    const e1t4 = analysis.step1?.beneficiaries.find((b) => b.id === 'E1');
    expect(e1t4?.brut).toBe(137_500);                      // 75k testament (ratio 0.5) + 62.5k réserve
    const e2t4 = analysis.step1?.beneficiaries.find((b) => b.id === 'E2');
    expect(e2t4?.brut).toBe(87_500);                       // 25k testament + 62.5k réserve
    expect(analysis.warnings.some((w) => w.includes('plafonnement'))).toBe(true);
  });
});

describe('successionTestament helpers', () => {
  it('construit les beneficiaires testamentaires avec reserve sur la branche concernee', () => {
    const enfants = [
      { id: 'E1', prenom: 'Alice', rattachement: 'commun' as const },
      { id: 'E2', prenom: 'Bastien', rattachement: 'epoux2' as const },
    ];
    const familyMembers = [
      { id: 'F1', type: 'parent' as const, branch: 'epoux1' as const },
      { id: 'F2', type: 'tierce_personne' as const },
    ];

    const options = buildTestamentBeneficiaryOptions('pacse', 'epoux1', enfants, familyMembers);

    expect(options.find((option) => option.value === 'principal:epoux2')?.label).toBe('Partenaire 2');
    expect(options.find((option) => option.value === 'enfant:E1')?.label).toContain('reservataire');
    expect(options.find((option) => option.value === 'enfant:E2')?.label).not.toContain('reservataire');
    expect(options.find((option) => option.value === 'family:F1')?.label).toContain('Parent');
  });

  it('calcule la quotite disponible et le libelle de reserve par cote', () => {
    const enfants = [
      { id: 'E1', rattachement: 'epoux1' as const },
      { id: 'E2', rattachement: 'epoux1' as const },
    ];

    expect(getQuotiteDisponiblePctForSide(enfants, [], 'epoux1')).toBeCloseTo(33.333, 2);
    expect(getReserveHintForSide(enfants, [], 'epoux1')).toContain('33.33 %');
    expect(getQuotiteDisponiblePctForSide(enfants, [], 'epoux2')).toBe(100);
    expect(getReserveHintForSide(enfants, [], 'epoux2')).toBeNull();
  });

  it('retourne un titre de carte coherent avec la situation', () => {
    expect(getTestamentCardTitle('marie', 'epoux1')).toBe('Epoux 1');
    expect(getTestamentCardTitle('pacse', 'epoux2')).toBe('Partenaire 2');
    expect(getTestamentCardTitle('celibataire', 'epoux1')).toBe('Defunt(e)');
  });
});
