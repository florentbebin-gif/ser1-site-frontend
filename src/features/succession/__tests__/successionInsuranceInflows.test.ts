import { describe, expect, it } from 'vitest';
import { buildSuccessionSurvivorEconomicInflows } from '../successionInsuranceInflows';
import type { SuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import type { SuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';

function makeAvAnalysis(): SuccessionAvFiscalAnalysis {
  return {
    totalCapitauxDeces: 0,
    totalDroits: 0,
    totalNetTransmis: 0,
    lines: [],
    warnings: [],
    byAssure: {
      epoux1: {
        capitauxDeces: 0,
        totalDroits: 0,
        lines: [
          {
            id: 'conjoint',
            label: 'Conjoint(e)',
            lien: 'conjoint',
            capitauxAvant70: 0,
            capitauxApres70: 0,
            taxable990I: 0,
            droits990I: 0,
            taxable757B: 0,
            droits757B: 0,
            totalDroits: 0,
            netTransmis: 120000,
          },
          {
            id: 'E1',
            label: 'E1',
            lien: 'enfant',
            capitauxAvant70: 0,
            capitauxApres70: 0,
            taxable990I: 0,
            droits990I: 0,
            taxable757B: 0,
            droits757B: 0,
            totalDroits: 0,
            netTransmis: 50000,
          },
        ],
      },
      epoux2: {
        capitauxDeces: 0,
        totalDroits: 0,
        lines: [
          {
            id: 'conjoint',
            label: 'Conjoint(e)',
            lien: 'conjoint',
            capitauxAvant70: 0,
            capitauxApres70: 0,
            taxable990I: 0,
            droits990I: 0,
            taxable757B: 0,
            droits757B: 0,
            totalDroits: 0,
            netTransmis: 70000,
          },
        ],
      },
    },
  };
}

function makePrevoyanceAnalysis(): SuccessionPrevoyanceFiscalAnalysis {
  return {
    totalCapitalDeces: 0,
    totalDroits: 0,
    totalNetTransmis: 0,
    lines: [],
    warnings: [],
    byAssure: {
      epoux1: {
        capitalDeces: 0,
        totalDroits: 0,
        lines: [
          {
            id: 'conjoint',
            label: 'Conjoint(e)',
            lien: 'conjoint',
            capitalTransmis: 0,
            capitauxAvant70: 0,
            capitauxApres70: 0,
            taxable990I: 0,
            droits990I: 0,
            taxable757B: 0,
            droits757B: 0,
            totalDroits: 0,
            netTransmis: 10000,
          },
        ],
      },
      epoux2: {
        capitalDeces: 0,
        totalDroits: 0,
        lines: [
          {
            id: 'autre',
            label: 'Autre',
            lien: 'autre',
            capitalTransmis: 0,
            capitauxAvant70: 0,
            capitauxApres70: 0,
            taxable990I: 0,
            droits990I: 0,
            taxable757B: 0,
            droits757B: 0,
            totalDroits: 0,
            netTransmis: 99999,
          },
        ],
      },
    },
  };
}

describe('buildSuccessionSurvivorEconomicInflows', () => {
  it('keeps only spouse net inflows by first deceased side across AV, PER and prevoyance', () => {
    const avFiscalAnalysis = makeAvAnalysis();
    const perFiscalAnalysis = makeAvAnalysis();
    const prevoyanceFiscalAnalysis = makePrevoyanceAnalysis();

    const inflows = buildSuccessionSurvivorEconomicInflows({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
    });

    expect(inflows).toEqual({
      epoux1: 250000,
      epoux2: 140000,
    });
  });
});
