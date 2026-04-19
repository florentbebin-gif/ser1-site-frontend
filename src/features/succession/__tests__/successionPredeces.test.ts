import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionPredecesAnalysis } from '../successionPredeces';
import { makeCivilMarie as makeCivil } from './fixtures';

describe('buildSuccessionPredecesAnalysis', () => {
  it('approxime participation aux acquets en separation de biens avec warning', () => {
    const analysis = buildSuccessionPredecesAnalysis(
      makeCivil({ regimeMatrimonial: 'participation_acquets' }),
      { actifEpoux1: 300000, actifEpoux2: 100000, actifCommun: 200000, nbEnfants: 2 },
      DEFAULT_DMTG,
    );

    expect(analysis.applicable).toBe(true);
    expect(analysis.regimeUsed).toBe('separation_biens');
    expect(analysis.warnings.some((w) => w.includes('Participation aux acqu'))).toBe(true);
  });

  it('active une approximation PACS indivision avec warnings explicites', () => {
    const analysis = buildSuccessionPredecesAnalysis(
      makeCivil({ situationMatrimoniale: 'pacse', regimeMatrimonial: null, pacsConvention: 'indivision' }),
      { actifEpoux1: 200000, actifEpoux2: 200000, actifCommun: 100000, nbEnfants: 1 },
      DEFAULT_DMTG,
    );

    expect(analysis.applicable).toBe(true);
    expect(analysis.regimeUsed).toBe('communaute_legale');
    expect(analysis.warnings.some((w) => w.includes('PACS indivision'))).toBe(true);
  });

  it('retourne non applicable en union libre et renvoie un warning de succession directe', () => {
    const analysis = buildSuccessionPredecesAnalysis(
      makeCivil({ situationMatrimoniale: 'concubinage', regimeMatrimonial: null }),
      { actifEpoux1: 100000, actifEpoux2: 100000, actifCommun: 0, nbEnfants: 1 },
      DEFAULT_DMTG,
    );

    expect(analysis.applicable).toBe(false);
    expect(analysis.calc).toBeNull();
    expect(analysis.warnings.some((w) => w.includes('succession directe'))).toBe(true);
  });

  it('documente en union libre la quote-part indivise retenue', () => {
    const analysis = buildSuccessionPredecesAnalysis(
      makeCivil({ situationMatrimoniale: 'concubinage', regimeMatrimonial: null }),
      { actifEpoux1: 100000, actifEpoux2: 100000, actifCommun: 200000, nbEnfants: 1 },
      DEFAULT_DMTG,
    );

    expect(analysis.applicable).toBe(false);
    expect(analysis.warnings.some((w) => w.includes('50 %'))).toBe(true);
  });

  it('propage les dmtgSettings personnalises dans le calcul predeces', () => {
    const customDmtg = {
      ...DEFAULT_DMTG,
      ligneDirecte: {
        abattement: 300000,
        scale: [{ from: 0, to: null, rate: 10 }],
      },
    };

    const analysis = buildSuccessionPredecesAnalysis(
      makeCivil({ regimeMatrimonial: 'communaute_legale' }),
      { actifEpoux1: 300000, actifEpoux2: 300000, actifCommun: 200000, nbEnfants: 2 },
      customDmtg,
    );

    expect(analysis.applicable).toBe(true);
    expect(analysis.calc?.result.scenarioMrDecede.droitsSuccession).toBe(0);
    expect(analysis.calc?.result.scenarioMmeDecede.droitsSuccession).toBe(0);
  });
});
