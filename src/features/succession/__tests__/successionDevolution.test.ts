import { describe, expect, it } from 'vitest';
import type { SuccessionCivilContext } from '../successionDraft';
import { buildSuccessionDevolutionAnalysis } from '../successionDevolution';

function makeCivil(overrides: Partial<SuccessionCivilContext>): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

describe('buildSuccessionDevolutionAnalysis', () => {
  it('gère conjoint + enfants communs avec options civiles', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      2,
      { nbEnfantsNonCommuns: 0, testamentActif: false },
      800000,
    );

    expect(analysis.masseReference).toBe(800000);
    expect(analysis.reserve?.reserve).toBe('2/3');
    expect(analysis.lines.some((line) => line.heritier.includes('Option A - Conjoint survivant'))).toBe(true);
    expect(analysis.lines.some((line) => line.heritier.includes('Option B - Conjoint survivant'))).toBe(true);
    expect(analysis.lines.some((line) => line.montantEstime === 200000)).toBe(true);
  });

  it('gère conjoint + enfants non communs (1/4 PP)', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      3,
      { nbEnfantsNonCommuns: 1, testamentActif: false },
      600000,
    );

    expect(analysis.lines.some((line) => line.droits.includes('1/4 en pleine propriété'))).toBe(true);
    expect(analysis.lines.some((line) => line.heritier === 'Descendants')).toBe(true);
    expect(analysis.lines.some((line) => line.montantEstime === 150000)).toBe(true);
  });

  it('produit les warnings PACS sans testament', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'pacse', regimeMatrimonial: null }),
      1,
      { nbEnfantsNonCommuns: 0, testamentActif: false },
      250000,
    );

    expect(analysis.lines.some((line) => line.heritier === 'Partenaire pacsé')).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('PACS'))).toBe(true);
  });

  it('plafonne enfants non communs et avertit', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      1,
      {
        nbEnfantsNonCommuns: 3,
        testamentActif: true,
        typeDispositionTestamentaire: 'legs_titre_universel',
        quotePartLegsTitreUniverselPct: 50,
      },
      300000,
    );

    expect(analysis.nbEnfantsNonCommuns).toBe(1);
    expect(analysis.warnings.some((warning) => warning.includes('plafonnés'))).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('Testament actif'))).toBe(true);
    expect(analysis.lines.some((line) => line.heritier === 'Légataire à titre universel')).toBe(true);
  });
});
