import { describe, expect, it } from 'vitest';
import {
  buildSuccessionDisplayTotals,
  computeCumulativeSuccessionTotalDroits,
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

describe('buildSuccessionDisplayTotals', () => {
  it('expose le décès simulé, la projection autre assuré et le cumul en mode direct', () => {
    const totals = buildSuccessionDisplayTotals({
      shouldRenderSuccessionComputationSections: true,
      displayUsesChainage: false,
      chainageOrder: 'epoux1',
      chainageStep1Droits: 0,
      chainageStep2Droits: 0,
      chainageTotalDroits: 0,
      directSimulatedDeceased: 'epoux1',
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
    });

    expect(totals.decesSimule.totalDroits).toBe(190);
    expect(totals.projectionAutreAssure.totalDroits).toBe(900);
    expect(totals.projectionAutreAssure.side).toBe('epoux2');
    expect(totals.droitsCumulesProjetes).toBe(1090);
    expect(totals.droitsChronologie).toBe(1090);
  });

  it('expose les deux décès comme total chronologie en mode chainage', () => {
    const totals = buildSuccessionDisplayTotals({
      shouldRenderSuccessionComputationSections: true,
      displayUsesChainage: true,
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
    expect(totals.droitsCumulesProjetes).toBe(610);
    expect(totals.droitsChronologie).toBe(610);
  });
});
