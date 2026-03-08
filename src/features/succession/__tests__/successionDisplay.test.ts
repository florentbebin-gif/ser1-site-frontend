import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG, type RegimeMatrimonial } from '../../../engine/civil';
import { calculateSuccession } from '../../../engine/succession';
import type { SuccessionCivilContext, SuccessionDevolutionContext } from '../successionDraft';
import { buildSuccessionDevolutionAnalysis } from '../successionDevolution';
import { buildSuccessionDirectDisplayAnalysis } from '../successionDisplay';

function makeCivil(overrides: Partial<SuccessionCivilContext>): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'celibataire',
    regimeMatrimonial: null as RegimeMatrimonial | null,
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makeDevolution(overrides: Partial<SuccessionDevolutionContext>): SuccessionDevolutionContext {
  return {
    nbEnfantsNonCommuns: 0,
    testamentActif: false,
    typeDispositionTestamentaire: null,
    quotePartLegsTitreUniverselPct: 50,
    ascendantsSurvivants: false,
    ...overrides,
  };
}

describe('buildSuccessionDirectDisplayAnalysis', () => {
  it('calcule des droits directs non nuls pour un célibataire avec deux enfants', () => {
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
    expect(analysis.transmissionRows.find((row) => row.label === 'Descendants')?.droits).toBe(expected.totalDroits);
  });

  it("ignore l'enfant propre du partenaire opposé dans le décès PACS simulé", () => {
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
  });

  it('traite PACS avec testament comme une succession directe du partenaire simulé', () => {
    const civil = makeCivil({ situationMatrimoniale: 'pacse' });
    const devolutionContext = makeDevolution({
      testamentActif: true,
      typeDispositionTestamentaire: 'legs_universel',
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
  });
});
