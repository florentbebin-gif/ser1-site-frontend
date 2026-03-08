import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG, type RegimeMatrimonial } from '../../../engine/civil';
import type {
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionEnfant,
  SuccessionLiquidationContext,
} from '../successionDraft';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
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

function makeLiquidation(overrides: Partial<SuccessionLiquidationContext>): SuccessionLiquidationContext {
  return {
    actifEpoux1: 0,
    actifEpoux2: 0,
    actifCommun: 0,
    nbEnfants: 0,
    ...overrides,
  };
}

const DEUX_ENFANTS_DEFUNT = [
  { id: 'E1', rattachement: 'epoux1' as const },
  { id: 'E2', rattachement: 'epoux1' as const },
];

function buildDirectAnalysisFor(
  civil: SuccessionCivilContext,
  liquidation: SuccessionLiquidationContext,
  enfants: SuccessionEnfant[],
  devolutionContext = makeDevolution({}),
) {
  const basis = computeSuccessionDirectEstateBasis(civil, liquidation, 'epoux1');
  const devolution = buildSuccessionDevolutionAnalysis(
    civil,
    enfants.length,
    devolutionContext,
    basis.actifNetSuccession,
    devolutionContext.nbEnfantsNonCommuns,
    enfants,
    [],
  );

  return buildSuccessionDirectDisplayAnalysis({
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
}

describe('succession validation matrix', () => {
  it('veuf avec deux enfants: succession directe avec droits ligne directe non nuls', () => {
    const analysis = buildDirectAnalysisFor(
      makeCivil({ situationMatrimoniale: 'veuf' }),
      makeLiquidation({ actifEpoux1: 400000, nbEnfants: 2 }),
      DEUX_ENFANTS_DEFUNT,
    );

    expect(analysis.result?.totalDroits).toBeGreaterThan(0);
    expect(analysis.transmissionRows.map((row) => row.label)).toEqual(['E1', 'E2']);
  });

  it('divorce avec deux enfants: ex-conjoint absent, enfants seuls heritiers directs', () => {
    const analysis = buildDirectAnalysisFor(
      makeCivil({ situationMatrimoniale: 'divorce' }),
      makeLiquidation({ actifEpoux1: 420000, nbEnfants: 2 }),
      DEUX_ENFANTS_DEFUNT,
    );

    expect(analysis.heirs).toHaveLength(2);
    expect(analysis.transmissionRows.every((row) => row.label !== 'Ex-conjoint')).toBe(true);
    expect(analysis.result?.totalDroits).toBeGreaterThan(0);
  });

  it('PACS sans testament et sans descendant: partenaire non heritier legal dans la synthese directe', () => {
    const civil = makeCivil({ situationMatrimoniale: 'pacse' });
    const devolutionContext = makeDevolution({});
    const basis = computeSuccessionDirectEstateBasis(
      civil,
      makeLiquidation({ actifEpoux1: 300000 }),
      'epoux1',
    );
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      0,
      devolutionContext,
      basis.actifNetSuccession,
      0,
      [],
      [],
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [],
      familyMembers: [],
      order: 'epoux1',
      actifNetSuccession: basis.actifNetSuccession,
      baseWarnings: basis.warnings,
    });

    expect(analysis.heirs).toHaveLength(0);
    expect(analysis.result).toBeNull();
    expect(analysis.warnings.some((warning) => warning.includes('PACS'))).toBe(true);
  });

  it('mariage avec enfant commun et enfant propre: la branche du defunt est respectee au 1er deces', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 450000,
        actifEpoux2: 250000,
        actifCommun: 0,
        nbEnfants: 2,
      }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'epoux1' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E1', 'E2']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E1']);
  });

  it('union libre avec indivision: seule la quote-part du defunt est retenue', () => {
    const basis = computeSuccessionDirectEstateBasis(
      makeCivil({ situationMatrimoniale: 'concubinage' }),
      makeLiquidation({
        actifEpoux1: 120000,
        actifEpoux2: 80000,
        actifCommun: 200000,
        nbEnfants: 2,
      }),
      'epoux1',
    );

    expect(basis.actifNetSuccession).toBe(220000);
    expect(basis.warnings.some((warning) => warning.includes('quote-part indivise'))).toBe(true);
  });
});
