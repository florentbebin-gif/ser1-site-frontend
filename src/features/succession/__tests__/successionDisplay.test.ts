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
      0,
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
      0,
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
      0,
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
      0,
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
      0,
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
});
