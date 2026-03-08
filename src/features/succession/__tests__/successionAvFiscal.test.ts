import { describe, expect, it } from 'vitest';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import type { SuccessionAssuranceVieEntry, SuccessionCivilContext } from '../successionDraft';

function makeCivil(overrides: Partial<SuccessionCivilContext> = {}): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<SuccessionAssuranceVieEntry> = {}): SuccessionAssuranceVieEntry {
  return {
    id: 'av-1',
    typeContrat: 'standard',
    souscripteur: 'epoux1',
    assure: 'epoux1',
    clauseBeneficiaire: 'CUSTOM:E1:50;E2:50',
    capitauxDeces: 600000,
    versementsApres70: 100000,
    ...overrides,
  };
}

describe('buildSuccessionAvFiscalAnalysis', () => {
  it('ventile les capitaux AV entre bénéficiaires et calcule 990 I / 757 B', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [makeEntry()],
      makeCivil(),
      [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      [],
      snapshot,
    );

    expect(analysis.totalCapitauxDeces).toBe(600000);
    expect(analysis.lines).toHaveLength(2);
    expect(analysis.totalDroits).toBeGreaterThan(0);
    expect(analysis.lines.every((line) => line.taxable990I >= 0)).toBe(true);
    expect(analysis.lines.every((line) => line.taxable757B >= 0)).toBe(true);
  });

  it('exonère le conjoint/partenaire sur la clause standard', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [makeEntry({
        clauseBeneficiaire: 'Conjoint survivant, à défaut enfants, à défaut héritiers',
        capitauxDeces: 250000,
      })],
      makeCivil({ situationMatrimoniale: 'pacse', regimeMatrimonial: null }),
      [{ id: 'E1', rattachement: 'commun' }],
      [],
      snapshot,
    );

    expect(analysis.totalDroits).toBe(0);
    expect(analysis.lines[0]?.lien).toBe('conjoint');
  });
});
