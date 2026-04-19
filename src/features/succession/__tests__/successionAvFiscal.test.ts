import { describe, expect, it } from 'vitest';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import type { SuccessionAssuranceVieEntry } from '../successionDraft';
import { makeCivilMarie as makeCivil } from './fixtures';

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

  it('contrat démembré: applique art. 669 CGI (ageUsufruitier=68 → 40% usufruit conjoint, 60% nu-prop enfants)', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [makeEntry({
        typeContrat: 'demembree',
        clauseBeneficiaire: 'Conjoint survivant, à défaut enfants, à défaut héritiers',
        capitauxDeces: 400000,
        versementsApres70: 0,
        ageUsufruitier: 68,
      })],
      makeCivil(),
      [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      [],
      snapshot,
    );

    expect(analysis.totalCapitauxDeces).toBe(400000);
    // Conjoint (usufruit 40%) = 160 000, exonéré
    const conjointLine = analysis.lines.find((l) => l.lien === 'conjoint');
    expect(conjointLine).toBeDefined();
    expect(conjointLine?.capitauxAvant70).toBe(160000);
    expect(conjointLine?.totalDroits).toBe(0);
    // Chaque enfant (nu-prop 60%/2) = 120 000
    const childLines = analysis.lines.filter((l) => l.lien === 'enfant');
    expect(childLines).toHaveLength(2);
    childLines.forEach((l) => {
      expect(l.capitauxAvant70).toBe(120000);
      expect(l.taxable990I).toBe(28500);
      expect(l.droits990I).toBe(5700);
    });
    expect(analysis.totalDroits).toBe(11400);
    expect(analysis.warnings.some((w) => w.includes('art. 669'))).toBe(true);
  });

  it('contrat démembré: après 70 ans — art. 669 sur versements après 70, 757B pour enfants (ageUsufruitier=75 → 30% usufruit)', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [makeEntry({
        typeContrat: 'demembree',
        clauseBeneficiaire: 'Conjoint survivant, à défaut enfants, à défaut héritiers',
        capitauxDeces: 200000,
        versementsApres70: 200000,
        ageUsufruitier: 75,
      })],
      makeCivil(),
      [{ id: 'E1', rattachement: 'commun' }],
      [],
      snapshot,
    );

    // Conjoint (usufruit 30%) = 60 000, exonéré
    const conjointLine = analysis.lines.find((l) => l.lien === 'conjoint');
    expect(conjointLine?.capitauxApres70).toBe(60000);
    expect(conjointLine?.totalDroits).toBe(0);
    // E1 (nu-prop 70%) = 140 000 après 70 → 757B
    const enfantLine = analysis.lines.find((l) => l.lien === 'enfant');
    expect(enfantLine?.capitauxApres70).toBe(140000);
    expect(enfantLine?.taxable757B).toBeGreaterThan(0);
    expect(enfantLine?.totalDroits).toBeGreaterThan(0);
  });

  it('contrat démembré sans ageUsufruitier: warning et repli sur traitement standard (conjoint clause)', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [makeEntry({
        typeContrat: 'demembree',
        clauseBeneficiaire: 'Conjoint survivant, à défaut enfants, à défaut héritiers',
        capitauxDeces: 200000,
        versementsApres70: 0,
      })],
      makeCivil(),
      [{ id: 'E1', rattachement: 'commun' }],
      [],
      snapshot,
    );

    // Repli standard: conjoint clause → conjoint reçoit tout, exonéré
    expect(analysis.totalDroits).toBe(0);
    expect(analysis.warnings.some((w) => w.includes('âge de l\'usufruitier'))).toBe(true);
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

  it('applique la tranche haute 990 I a 31,25 % au-dela de 700 000 EUR taxables', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [makeEntry({
        clauseBeneficiaire: 'CUSTOM:E1:100',
        capitauxDeces: 1_000_000,
        versementsApres70: 0,
      })],
      makeCivil({ situationMatrimoniale: 'celibataire', regimeMatrimonial: null }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
    );

    expect(analysis.lines[0]?.taxable990I).toBe(847500);
    expect(analysis.lines[0]?.droits990I).toBe(186094);
    expect(analysis.totalDroits).toBe(186094);
  });

  it('exclut les versements avant le 13/10/1998 de la base taxable globale', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [makeEntry({
        clauseBeneficiaire: 'CUSTOM:E1:100',
        capitauxDeces: 200000,
        versementsApres70: 100000,
        versementsAvant13101998: 50000,
      })],
      makeCivil({ situationMatrimoniale: 'celibataire', regimeMatrimonial: null }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
    );

    expect(analysis.totalCapitauxDeces).toBe(200000);
    expect(analysis.lines[0]?.capitauxAvant70).toBe(100000);
    expect(analysis.lines[0]?.capitauxApres70).toBe(100000);
    expect(analysis.lines[0]?.taxable990I).toBe(0);
    expect(analysis.lines[0]?.taxable757B).toBe(69500);
  });

  it('cappe la base taxable apres 70 ans quand elle chevauche les versements exoneres avant 1998', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [makeEntry({
        clauseBeneficiaire: 'CUSTOM:E1:100',
        capitauxDeces: 300000,
        versementsApres70: 250000,
        versementsAvant13101998: 100000,
      })],
      makeCivil({ situationMatrimoniale: 'celibataire', regimeMatrimonial: null }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
    );

    expect(analysis.lines[0]?.capitauxApres70).toBe(250000);
    expect(analysis.lines[0]?.taxable757B).toBe(169500);
    expect(analysis.warnings.some((warning) => warning.includes('13/10/1998'))).toBe(true);
  });
});
