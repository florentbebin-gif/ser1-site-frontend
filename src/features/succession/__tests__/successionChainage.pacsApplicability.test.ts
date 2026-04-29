import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { makeCivil, makeDevolution, makeLiquidation } from './fixtures';

/**
 * PR-A : applicabilite du chainage successoral.
 *
 * Source de verite : `docs/SUCCESSION_MODEL_MATURITY.md` ligne 72
 * "PACS avec chainage 2 deces : Exclu par spec actuelle - Non modelise".
 *
 * Le chainage doit donc retourner `applicable: false` pour toute situation PACS,
 * peu importe la convention (separation / indivision) et l'existence d'un
 * testament. La succession directe du defunt simule reste calculee par
 * `buildSuccessionDirectDisplayAnalysis` en aval.
 */
describe('buildSuccessionChainageAnalysis - applicabilite PACS', () => {
  it('PACS separation sans testament: chainage non applicable, basculement direct', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'separation',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 300000 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({}),
    });

    expect(analysis.applicable).toBe(false);
    expect(analysis.step1).toBeNull();
    expect(analysis.step2).toBeNull();
    expect(analysis.totalDroits).toBe(0);
    expect(analysis.warnings.some((warning) => warning.includes('PACS'))).toBe(true);
  });

  it('PACS indivision sans testament: chainage non applicable', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'indivision',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 250000, actifCommun: 100000 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({}),
    });

    expect(analysis.applicable).toBe(false);
    expect(analysis.step1).toBeNull();
    expect(analysis.step2).toBeNull();
  });

  it('PACS separation avec testament au partenaire: chainage non applicable (matrice de maturite)', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'separation',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 300000 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
    });

    expect(analysis.applicable).toBe(false);
    expect(analysis.step1).toBeNull();
    expect(analysis.step2).toBeNull();
  });

  it('PACS indivision avec testament au partenaire: chainage non applicable', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'indivision',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 250000, actifCommun: 100000 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
    });

    expect(analysis.applicable).toBe(false);
    expect(analysis.step1).toBeNull();
  });

  it('mariage en communaute legale: chainage applicable (non regression)', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 200000,
        actifEpoux2: 150000,
        actifCommun: 300000,
        nbEnfants: 2,
      }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
  });

  it('mariage en separation de biens: chainage applicable (non regression)', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 400000,
        actifEpoux2: 100000,
        nbEnfants: 1,
      }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
  });
});
