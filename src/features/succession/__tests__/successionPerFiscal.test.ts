import { describe, expect, it } from 'vitest';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import type { SuccessionCivilContext, SuccessionPerEntry } from '../successionDraft';

function makeCivil(overrides: Partial<SuccessionCivilContext> = {}): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makePerEntry(overrides: Partial<SuccessionPerEntry> = {}): SuccessionPerEntry {
  return {
    id: 'per-1',
    typeContrat: 'standard',
    assure: 'epoux1',
    clauseBeneficiaire: 'CUSTOM:E1:100',
    capitauxDeces: 300000,
    ...overrides,
  };
}

describe('buildSuccessionPerFiscalAnalysis', () => {
  it('uses the 990 I path when the insured is under 70 at simulated death', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPerFiscalAnalysis(
      [makePerEntry()],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
        dateNaissanceEpoux1: '1970-01-01',
      }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
      new Date('2035-06-01T00:00:00Z'),
    );

    expect(analysis.totalCapitauxDeces).toBe(300000);
    expect(analysis.lines).toHaveLength(1);
    expect(analysis.lines[0]?.capitauxAvant70).toBe(300000);
    expect(analysis.lines[0]?.capitauxApres70).toBe(0);
    expect(analysis.lines[0]?.taxable990I).toBeGreaterThan(0);
    expect(analysis.lines[0]?.taxable757B).toBe(0);
    expect(analysis.byAssure.epoux1.capitauxDeces).toBe(300000);
  });

  it('uses the 757 B path when the insured is at least 70 at simulated death', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPerFiscalAnalysis(
      [makePerEntry()],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
        dateNaissanceEpoux1: '1940-01-01',
      }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
      new Date('2026-03-17T00:00:00Z'),
    );

    expect(analysis.lines).toHaveLength(1);
    expect(analysis.lines[0]?.capitauxAvant70).toBe(0);
    expect(analysis.lines[0]?.capitauxApres70).toBe(300000);
    expect(analysis.lines[0]?.taxable990I).toBe(0);
    expect(analysis.lines[0]?.taxable757B).toBeGreaterThan(0);
    expect(analysis.lines[0]?.totalDroits).toBeGreaterThan(0);
  });

  it('keeps spouse exemption on a standard clause', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPerFiscalAnalysis(
      [makePerEntry({
        clauseBeneficiaire: undefined,
      })],
      makeCivil({
        dateNaissanceEpoux1: '1970-01-01',
      }),
      [{ id: 'E1', rattachement: 'commun' }],
      [],
      snapshot,
      new Date('2035-06-01T00:00:00Z'),
    );

    expect(analysis.totalDroits).toBe(0);
    expect(analysis.lines[0]?.lien).toBe('conjoint');
  });

  it('supports demembrement and keeps the art. 669 warning path', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPerFiscalAnalysis(
      [makePerEntry({
        typeContrat: 'demembree',
        clauseBeneficiaire: undefined,
        capitauxDeces: 300000,
        ageUsufruitier: 68,
      })],
      makeCivil({
        dateNaissanceEpoux1: '1970-01-01',
      }),
      [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      [],
      snapshot,
      new Date('2035-06-01T00:00:00Z'),
    );

    const conjointLine = analysis.lines.find((line) => line.lien === 'conjoint');
    const childLines = analysis.lines.filter((line) => line.lien === 'enfant');

    expect(conjointLine?.capitauxAvant70).toBe(120000);
    expect(childLines).toHaveLength(2);
    childLines.forEach((line) => expect(line.capitauxAvant70).toBe(90000));
    expect(analysis.warnings.some((warning) => warning.includes('art. 669'))).toBe(true);
  });
});
