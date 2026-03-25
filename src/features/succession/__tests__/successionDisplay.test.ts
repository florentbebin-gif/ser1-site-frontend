import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG, type RegimeMatrimonial } from '../../../engine/civil';
import { calculateSuccession } from '../../../engine/succession';
import type {
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDevolutionContextInput,
  SuccessionLiquidationContext,
} from '../successionDraft';
import { DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT } from '../successionDraft';
import { buildSuccessionDevolutionAnalysis } from '../successionDevolution';
import {
  buildSuccessionDirectDisplayAnalysis,
  computeSuccessionDirectEstateBasis,
} from '../successionDisplay';

const DONATION_SETTINGS = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
  donManuel: {
    abattementRenouvellement: 15,
  },
} as const;

function makeCivil(overrides: Partial<SuccessionCivilContext>): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'celibataire',
    regimeMatrimonial: null as RegimeMatrimonial | null,
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makeDevolution(overrides: SuccessionDevolutionContextInput): SuccessionDevolutionContext {
  return {
    ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
    ...overrides,
    testamentsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide,
      ...overrides.testamentsBySide,
      epoux1: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux1,
        ...overrides.testamentsBySide?.epoux1,
        particularLegacies: overrides.testamentsBySide?.epoux1?.particularLegacies ?? [],
      },
      epoux2: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux2,
        ...overrides.testamentsBySide?.epoux2,
        particularLegacies: overrides.testamentsBySide?.epoux2?.particularLegacies ?? [],
      },
    },
    ascendantsSurvivantsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
      ...overrides.ascendantsSurvivantsBySide,
    },
  };
}

function makeLiquidation(overrides: Partial<SuccessionLiquidationContext>): SuccessionLiquidationContext {
  return {
    actifEpoux1: 0,
    actifEpoux2: 0,
    actifCommun: 0,
    nbEnfants: 0,
    ...overrides,
  };
}

describe('buildSuccessionDirectDisplayAnalysis', () => {
  it('calcule des droits directs non nuls pour un celibataire avec deux enfants', () => {
    const civil = makeCivil({ situationMatrimoniale: 'celibataire' });
    const devolutionContext = makeDevolution({});
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      2,
      devolutionContext,
      400000,
      [
        { id: 'E1', rattachement: 'epoux1' },
        { id: 'E2', rattachement: 'epoux1' },
      ],
      [],
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'epoux1' },
        { id: 'E2', rattachement: 'epoux1' },
      ],
      familyMembers: [],
      order: 'epoux1',
    });

    const expected = calculateSuccession({
      actifNetSuccession: 400000,
      heritiers: [
        { lien: 'enfant', partSuccession: 200000 },
        { lien: 'enfant', partSuccession: 200000 },
      ],
      dmtgSettings: DEFAULT_DMTG,
    }).result;

    expect(analysis.result?.totalDroits).toBe(expected.totalDroits);
    expect(analysis.heirs).toHaveLength(2);
    expect(analysis.transmissionRows).toHaveLength(2);
    expect(analysis.transmissionRows[0]).toMatchObject({ id: 'E1', label: 'E1' });
    expect(analysis.transmissionRows[1]).toMatchObject({ id: 'E2', label: 'E2' });
    expect(analysis.transmissionRows.reduce((sum, row) => sum + row.droits, 0)).toBe(expected.totalDroits);
  });

  it("ignore l'enfant propre du partenaire oppose dans le deces PACS simule", () => {
    const civil = makeCivil({ situationMatrimoniale: 'pacse' });
    const devolutionContext = makeDevolution({});
    const enfants = [
      { id: 'E1', rattachement: 'epoux1' as const },
      { id: 'E2', rattachement: 'epoux2' as const },
    ];
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      1,
      devolutionContext,
      300000,
      enfants,
      [],
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      order: 'epoux1',
    });

    expect(analysis.heirs).toHaveLength(1);
    expect(analysis.heirs[0]).toMatchObject({ lien: 'enfant', partSuccession: 300000 });
    expect(analysis.result?.detailHeritiers).toHaveLength(1);
    expect(analysis.transmissionRows).toHaveLength(1);
    expect(analysis.transmissionRows[0]).toMatchObject({ id: 'E1', label: 'E1' });
  });

  it('traite PACS avec testament comme une succession directe du partenaire simule', () => {
    const civil = makeCivil({ situationMatrimoniale: 'pacse' });
    const devolutionContext = makeDevolution({
      testamentsBySide: {
        epoux1: {
          active: true,
          dispositionType: 'legs_universel',
          beneficiaryRef: 'principal:epoux2',
          quotePartPct: 50,
          particularLegacies: [],
        },
      },
    });
    const enfants = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'commun' as const },
    ];
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      2,
      devolutionContext,
      300000,
      enfants,
      [],
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      order: 'epoux1',
    });

    expect(analysis.heirs).toHaveLength(3);
    expect(analysis.heirs[0]).toMatchObject({ lien: 'conjoint', partSuccession: 100000 });
    expect(analysis.heirs[1]).toMatchObject({ lien: 'enfant', partSuccession: 100000 });
    expect(analysis.heirs[2]).toMatchObject({ lien: 'enfant', partSuccession: 100000 });
    expect(analysis.result?.totalDroits).toBe(0);
    expect(analysis.transmissionRows.map((row) => row.label)).toEqual([
      'Partenaire pacsé',
      'E1',
      'E2',
    ]);
  });

  it('retient en union libre le patrimoine propre du defunt et sa quote-part indivise seulement', () => {
    const civil = makeCivil({ situationMatrimoniale: 'concubinage' });
    const liquidation = makeLiquidation({
      actifEpoux1: 120000,
      actifEpoux2: 80000,
      actifCommun: 200000,
      nbEnfants: 2,
    });
    const basis = computeSuccessionDirectEstateBasis(civil, liquidation, 'epoux1');
    const devolutionContext = makeDevolution({});
    const enfants = [
      { id: 'E1', rattachement: 'epoux1' as const },
      { id: 'E2', rattachement: 'epoux1' as const },
    ];
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      2,
      devolutionContext,
      basis.actifNetSuccession,
      enfants,
      [],
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      order: 'epoux1',
      actifNetSuccession: basis.actifNetSuccession,
      baseWarnings: basis.warnings,
    });

    expect(basis.actifNetSuccession).toBe(220000);
    expect(basis.warnings.some((w) => w.includes('quote-part indivise'))).toBe(true);
    expect(analysis.actifNetSuccession).toBe(220000);
    expect(analysis.heirs).toHaveLength(2);
    expect(analysis.transmissionRows).toHaveLength(2);
    expect(analysis.result?.totalDroits).toBeGreaterThan(0);
  });

  it('retient en PACS indivision la quote-part du partenaire decede simule', () => {
    const civil = makeCivil({ situationMatrimoniale: 'pacse', pacsConvention: 'indivision' });
    const basis = computeSuccessionDirectEstateBasis(
      civil,
      makeLiquidation({
        actifEpoux1: 100000,
        actifEpoux2: 140000,
        actifCommun: 120000,
      }),
      'epoux2',
    );

    expect(basis.simulatedDeceased).toBe('epoux2');
    expect(basis.actifNetSuccession).toBe(200000);
    expect(basis.warnings.some((w) => w.includes('PACS indivision'))).toBe(true);
  });

  it('partage l abattement de branche entre petits-enfants representants en succession directe', () => {
    const civil = makeCivil({ situationMatrimoniale: 'celibataire' });
    const devolutionContext = makeDevolution({});
    const enfants = [
      { id: 'E1', rattachement: 'epoux1' as const },
      { id: 'E2', rattachement: 'epoux1' as const, deceased: true },
    ];
    const familyMembers = [
      { id: 'PG1', type: 'petit_enfant' as const, parentEnfantId: 'E2' },
      { id: 'PG2', type: 'petit_enfant' as const, parentEnfantId: 'E2' },
    ];
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      2,
      devolutionContext,
      600000,
      enfants,
      familyMembers,
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers,
      order: 'epoux1',
      actifNetSuccession: 600000,
    });

    expect(analysis.heirs).toMatchObject([
      { lien: 'enfant', partSuccession: 300000 },
      { lien: 'petit_enfant', partSuccession: 150000, abattementOverride: 50000 },
      { lien: 'petit_enfant', partSuccession: 150000, abattementOverride: 50000 },
    ]);
    expect(analysis.result?.detailHeritiers.map((detail) => detail.abattement)).toEqual([100000, 50000, 50000]);
    expect(analysis.result?.detailHeritiers.map((detail) => detail.droits)).toEqual([38194, 18194, 18194]);
    expect(analysis.result?.totalDroits).toBe(74582);
  });

  it('fusionne la part legale du conjoint marie et le legs testamentaire au profit du conjoint', () => {
    const civil = makeCivil({ situationMatrimoniale: 'marie', regimeMatrimonial: 'communaute_legale' });
    const devolutionContext = makeDevolution({
      testamentsBySide: {
        epoux1: {
          active: true,
          dispositionType: 'legs_universel',
          beneficiaryRef: 'principal:epoux2',
          quotePartPct: 50,
          particularLegacies: [],
        },
      },
    });
    const enfants = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'commun' as const },
    ];
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      2,
      devolutionContext,
      300000,
      enfants,
      [],
      { simulatedDeceased: 'epoux1' },
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      order: 'epoux1',
      actifNetSuccession: 300000,
    });

    expect(analysis.transmissionRows.map((row) => row.label)).toEqual([
      'Conjoint survivant',
      'E1',
      'E2',
    ]);
    expect(analysis.transmissionRows[0].brut).toBe(175000);
    expect(analysis.heirs[0]).toMatchObject({ lien: 'conjoint', partSuccession: 175000 });
    expect(analysis.heirs[1]).toMatchObject({ lien: 'enfant', partSuccession: 62500 });
    expect(analysis.heirs[2]).toMatchObject({ lien: 'enfant', partSuccession: 62500 });
  });

  it('restitue les freres et soeurs dans le display direct quand la devolution les expose', () => {
    const civil = makeCivil({ situationMatrimoniale: 'celibataire' });
    const devolutionContext = makeDevolution({});
    const familyMembers = [
      { id: 'F1', type: 'frere_soeur' as const, branch: 'epoux1' as const },
      { id: 'F2', type: 'frere_soeur' as const, branch: 'epoux1' as const },
    ];
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      0,
      devolutionContext,
      800000,
      [],
      familyMembers,
      { simulatedDeceased: 'epoux1' },
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [],
      familyMembers,
      order: 'epoux1',
      actifNetSuccession: 800000,
    });

    expect(devolution.lines.some((line) => line.heritier === 'Frères et sœurs')).toBe(true);
    expect(analysis.heirs).toHaveLength(2);
    expect(analysis.transmissionRows).toHaveLength(2);
    expect(analysis.transmissionRows.map((row) => row.label)).toEqual(['Frere / soeur 1', 'Frere / soeur 2']);
    expect(analysis.result?.totalDroits).toBeGreaterThan(0);
  });

  it('integre le rappel fiscal des donations detaillees dans les droits affiches', () => {
    const civil = makeCivil({ situationMatrimoniale: 'celibataire' });
    const devolutionContext = makeDevolution({});
    const enfants = [{ id: 'E1', rattachement: 'epoux1' as const }];
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      1,
      devolutionContext,
      200000,
      enfants,
      [],
    );

    const withoutRecall = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      order: 'epoux1',
      actifNetSuccession: 200000,
    });
    const withRecall = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      order: 'epoux1',
      actifNetSuccession: 200000,
      donationsContext: [{
        id: 'don-1',
        type: 'rapportable',
        montant: 100000,
        valeurDonation: 150000,
        date: '2020-06',
        donateur: 'epoux1',
        donataire: 'E1',
      }],
      donationSettings: DONATION_SETTINGS,
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(withoutRecall.result?.totalDroits).toBe(18194);
    expect(withRecall.result?.totalDroits).toBeGreaterThan(withoutRecall.result?.totalDroits ?? 0);
    expect(withRecall.heirs[0]).toMatchObject({
      baseHistoriqueTaxee: 150000,
    });
  });

  it('applique l abattement residence principale a l assiette fiscale directe sans reduire le brut transmis', () => {
    const civil = makeCivil({ situationMatrimoniale: 'celibataire' });
    const devolutionContext = makeDevolution({});
    const enfants = [{ id: 'E1', rattachement: 'epoux1' as const }];
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      1,
      devolutionContext,
      400000,
      enfants,
      [],
    );
    const transmissionBasis = {
      ordinaryTaxableAssetsParOwner: {
        epoux1: 400000,
        epoux2: 0,
        commun: 0,
      },
      passifsParOwner: {
        epoux1: 0,
        epoux2: 0,
        commun: 0,
      },
      groupementFoncierEntries: [],
      hasBeneficiaryLevelGfAdjustment: false,
      residencePrincipaleEntry: {
        owner: 'epoux1' as const,
        valeurTotale: 400000,
      },
    };

    const withoutAbatement = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      order: 'epoux1',
      actifNetSuccession: 400000,
      transmissionBasis,
      abattementResidencePrincipale: false,
    });
    const withAbatement = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      order: 'epoux1',
      actifNetSuccession: 400000,
      transmissionBasis,
      abattementResidencePrincipale: true,
    });

    expect(withoutAbatement.transmissionRows[0]?.brut).toBe(400000);
    expect(withAbatement.transmissionRows[0]?.brut).toBe(400000);
    expect(withoutAbatement.result?.totalDroits).toBe(58194);
    expect(withAbatement.result?.totalDroits).toBe(42194);
    expect(withAbatement.result?.totalDroits).toBeLessThan(withoutAbatement.result?.totalDroits ?? 0);
  });
});
