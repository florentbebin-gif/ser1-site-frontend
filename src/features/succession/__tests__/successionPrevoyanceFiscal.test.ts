import { describe, expect, it } from 'vitest';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import type {
  FamilyMember,
  SuccessionCivilContext,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';

function makeCivil(overrides: Partial<SuccessionCivilContext> = {}): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    dateNaissanceEpoux1: '1970-01-01',
    dateNaissanceEpoux2: '1972-01-01',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<SuccessionPrevoyanceDecesEntry> = {}): SuccessionPrevoyanceDecesEntry {
  return {
    id: 'prev-1',
    souscripteur: 'epoux1',
    assure: 'epoux1',
    capitalDeces: 500000,
    dernierePrime: 50000,
    clauseBeneficiaire: undefined,
    ...overrides,
  };
}

describe('buildSuccessionPrevoyanceFiscalAnalysis', () => {
  it('keeps spouse exemption on the standard clause, including after 70 under 757 B', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [makeEntry()],
      makeCivil({
        dateNaissanceEpoux1: '1940-01-01',
      }),
      [{ id: 'E1', rattachement: 'commun' }],
      [],
      snapshot,
      new Date('2026-03-19T00:00:00Z'),
    );

    expect(analysis.totalCapitalDeces).toBe(500000);
    expect(analysis.totalDroits).toBe(0);
    expect(analysis.lines[0]?.lien).toBe('conjoint');
    expect(analysis.lines[0]?.capitalTransmis).toBe(500000);
    expect(analysis.lines[0]?.capitauxAvant70).toBe(0);
    expect(analysis.lines[0]?.capitauxApres70).toBe(50000);
  });

  it('applies 990 I on the last annual premium only before 70', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [makeEntry({
        capitalDeces: 1_000_000,
        dernierePrime: 300000,
        clauseBeneficiaire: 'CUSTOM:E1:100',
      })],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
      }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
      new Date('2026-03-19T00:00:00Z'),
    );

    expect(analysis.lines).toHaveLength(1);
    expect(analysis.lines[0]?.capitalTransmis).toBe(1_000_000);
    expect(analysis.lines[0]?.capitauxAvant70).toBe(300000);
    expect(analysis.lines[0]?.capitauxApres70).toBe(0);
    expect(analysis.lines[0]?.taxable990I).toBe(147500);
    expect(analysis.lines[0]?.taxable757B).toBe(0);
    expect(analysis.totalDroits).toBeGreaterThan(0);
    expect(analysis.byAssure.epoux1.capitalDeces).toBe(1_000_000);
  });

  it('switches from 990 I to 757 B when the simulated death date pushes the subscriber over 70', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const familyMembers: FamilyMember[] = [
      { id: 'fam-1', type: 'tierce_personne', branch: 'epoux1' },
    ];
    const entry = makeEntry({
      capitalDeces: 400000,
      dernierePrime: 100000,
      clauseBeneficiaire: 'CUSTOM:fam-1:100',
    });

    const before70Analysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [entry],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
        dateNaissanceEpoux1: '1960-06-01',
      }),
      [],
      familyMembers,
      snapshot,
      new Date('2026-03-19T00:00:00Z'),
    );
    const after70Analysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [entry],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
        dateNaissanceEpoux1: '1960-06-01',
      }),
      [],
      familyMembers,
      snapshot,
      new Date('2031-07-01T00:00:00Z'),
    );

    expect(before70Analysis.lines[0]?.capitauxAvant70).toBe(100000);
    expect(before70Analysis.lines[0]?.capitauxApres70).toBe(0);
    expect(before70Analysis.lines[0]?.taxable757B).toBe(0);

    expect(after70Analysis.lines[0]?.capitauxAvant70).toBe(0);
    expect(after70Analysis.lines[0]?.capitauxApres70).toBe(100000);
    expect(after70Analysis.lines[0]?.taxable990I).toBe(0);
    expect(after70Analysis.lines[0]?.taxable757B).toBeCloseTo(69500, 6);
    expect(after70Analysis.totalDroits).toBeGreaterThan(0);
  });

  it('falls back to 990 I on the capital with an explicit warning when the last premium is missing', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [makeEntry({
        capitalDeces: 200000,
        dernierePrime: 0,
        clauseBeneficiaire: 'CUSTOM:E1:100',
      })],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
      }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
      new Date('2026-03-19T00:00:00Z'),
    );

    expect(analysis.lines[0]?.capitauxAvant70).toBe(200000);
    expect(analysis.lines[0]?.capitauxApres70).toBe(0);
    expect(analysis.lines[0]?.taxable990I).toBe(47500);
    expect(analysis.warnings.some((warning) => warning.includes('Dernière prime non renseignée'))).toBe(true);
  });

  it('supports a generic family-member beneficiary label', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const familyMembers: FamilyMember[] = [
      { id: 'fam-1', type: 'oncle_tante', branch: 'epoux1' },
    ];
    const analysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [makeEntry({
        clauseBeneficiaire: 'CUSTOM:fam-1:100',
      })],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
      }),
      [],
      familyMembers,
      snapshot,
      new Date('2026-03-19T00:00:00Z'),
    );

    expect(analysis.lines[0]?.label).toBe('Oncle / tante');
  });
});
