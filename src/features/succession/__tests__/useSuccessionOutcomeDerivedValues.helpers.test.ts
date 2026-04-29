import { describe, expect, it } from 'vitest';
import {
  buildSuccessionDisplayTotals,
  computeCumulativeSuccessionTotalDroits,
  hasSuccessionSecondSubject,
} from '../hooks/useSuccessionOutcomeDerivedValues.helpers';

const baseInput = {
  shouldRenderSuccessionComputationSections: true,
  chainageTotalDroits: 1000,
  directTotalDroits: 100,
  avFiscalAnalysis: { totalDroits: 30 },
  perFiscalAnalysis: { totalDroits: 70 },
  prevoyanceFiscalAnalysis: { totalDroits: 110 },
};

describe('computeCumulativeSuccessionTotalDroits', () => {
  it('additionne les droits hors succession des deux assures en mode direct epoux1', () => {
    expect(computeCumulativeSuccessionTotalDroits({
      ...baseInput,
      displayUsesChainage: false,
    })).toBe(310);
  });

  it('additionne les droits hors succession des deux assures en mode direct epoux2', () => {
    expect(computeCumulativeSuccessionTotalDroits({
      ...baseInput,
      displayUsesChainage: false,
      directTotalDroits: 120,
    })).toBe(330);
  });

  it('conserve les droits globaux des deux assures en mode chainage', () => {
    expect(computeCumulativeSuccessionTotalDroits({
      ...baseInput,
      displayUsesChainage: true,
    })).toBe(1210);
  });
});

describe('hasSuccessionSecondSubject', () => {
  it.each([
    ['marie', true],
    ['pacse', true],
    ['concubinage', true],
    ['celibataire', false],
    ['divorce', false],
    ['veuf', false],
  ] as const)('retourne %s -> %s', (situationMatrimoniale, expected) => {
    expect(hasSuccessionSecondSubject(situationMatrimoniale)).toBe(expected);
  });
});

describe('buildSuccessionDisplayTotals', () => {
  const directCoupleScenario = {
    shouldRenderSuccessionComputationSections: true,
    displayUsesChainage: false,
    chainageOrder: 'epoux1' as const,
    chainageStep1Droits: 0,
    chainageStep2Droits: 0,
    chainageTotalDroits: 0,
    directSimulatedDeceased: 'epoux1' as const,
    directSuccessionDroits: 100,
    avFiscalAnalysis: {
      totalDroits: 110,
      byAssure: { epoux1: { totalDroits: 10 }, epoux2: { totalDroits: 100 } },
    },
    perFiscalAnalysis: {
      totalDroits: 330,
      byAssure: { epoux1: { totalDroits: 30 }, epoux2: { totalDroits: 300 } },
    },
    prevoyanceFiscalAnalysis: {
      totalDroits: 550,
      byAssure: { epoux1: { totalDroits: 50 }, epoux2: { totalDroits: 500 } },
    },
  };

  it('expose la projection autre assuré quand un second sujet existe (couple ou concubinage)', () => {
    const totals = buildSuccessionDisplayTotals({
      ...directCoupleScenario,
      hasSecondSubject: true,
    });

    expect(totals.decesSimule.totalDroits).toBe(190);
    expect(totals.projectionAutreAssure?.totalDroits).toBe(900);
    expect(totals.projectionAutreAssure?.side).toBe('epoux2');
    expect(totals.droitsCumulesProjetes).toBe(1090);
    expect(totals.droitsChronologie).toBe(1090);
  });

  it.each(['celibataire', 'divorce', 'veuf'] as const)(
    'null la projection autre assuré pour %s',
    () => {
    const totals = buildSuccessionDisplayTotals({
      ...directCoupleScenario,
      hasSecondSubject: false,
      // Même si byAssure[epoux2] porte des droits (donnée résiduelle),
      // la projection ne doit pas s'afficher faute de second sujet métier.
    });

    expect(totals.projectionAutreAssure).toBeNull();
    expect(totals.decesSimule.side).toBe('epoux1');
    // Le coût cumulé reste calculé sur la totalité des droits hors succession :
    // c'est le helper computeCumulativeSuccessionTotalDroits qui s'en charge.
    // L'invariant projection nullable n'altère que l'affichage.
    expect(totals.droitsCumulesProjetes).toBe(1090);
    },
  );

  it('expose les deux décès comme total chronologie en mode chainage', () => {
    const totals = buildSuccessionDisplayTotals({
      shouldRenderSuccessionComputationSections: true,
      displayUsesChainage: true,
      hasSecondSubject: true,
      chainageOrder: 'epoux2',
      chainageStep1Droits: 100,
      chainageStep2Droits: 300,
      chainageTotalDroits: 400,
      directSimulatedDeceased: 'epoux1',
      directSuccessionDroits: 0,
      avFiscalAnalysis: {
        totalDroits: 30,
        byAssure: { epoux1: { totalDroits: 10 }, epoux2: { totalDroits: 20 } },
      },
      perFiscalAnalysis: {
        totalDroits: 70,
        byAssure: { epoux1: { totalDroits: 30 }, epoux2: { totalDroits: 40 } },
      },
      prevoyanceFiscalAnalysis: {
        totalDroits: 110,
        byAssure: { epoux1: { totalDroits: 50 }, epoux2: { totalDroits: 60 } },
      },
    });

    expect(totals.decesSimule.side).toBe('epoux2');
    expect(totals.decesSimule.totalDroits).toBe(220);
    expect(totals.secondDeces?.side).toBe('epoux1');
    expect(totals.secondDeces?.totalDroits).toBe(390);
    expect(totals.projectionAutreAssure).toBeNull();
    expect(totals.droitsCumulesProjetes).toBe(610);
    expect(totals.droitsChronologie).toBe(610);
  });
});
