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
  it('keeps spouse exemption on the standard clause', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [makeEntry()],
      makeCivil(),
      [{ id: 'E1', rattachement: 'commun' }],
      [],
      snapshot,
      new Date('2035-06-01T00:00:00Z'),
    );

    expect(analysis.totalCapitalDeces).toBe(500000);
    expect(analysis.totalDernierePrimeTaxable).toBe(50000);
    expect(analysis.totalDroits).toBe(0);
    expect(analysis.lines[0]?.lien).toBe('conjoint');
    expect(analysis.lines[0]?.capitalTransmis).toBe(500000);
    expect(analysis.lines[0]?.primeTaxableAvant70).toBe(50000);
  });

  it('uses the last premium only as taxable base before 70', () => {
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
      new Date('2035-06-01T00:00:00Z'),
    );

    expect(analysis.lines).toHaveLength(1);
    expect(analysis.lines[0]?.capitalTransmis).toBe(1_000_000);
    expect(analysis.lines[0]?.primeTaxableAvant70).toBe(300000);
    expect(analysis.lines[0]?.taxable990I).toBe(147500);
    expect(analysis.lines[0]?.totalDroits).toBeGreaterThan(0);
    expect(analysis.byAssure.epoux1.capitalDeces).toBe(1_000_000);
    expect(analysis.byAssure.epoux1.dernierePrimeTaxable).toBe(300000);
  });

  it('uses the 757 B path when the insured is at least 70 at simulated death', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [makeEntry({
        capitalDeces: 400000,
        dernierePrime: 80000,
        clauseBeneficiaire: 'CUSTOM:E1:100',
      })],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
        dateNaissanceEpoux1: '1940-01-01',
      }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
      new Date('2026-03-18T00:00:00Z'),
    );

    expect(analysis.lines).toHaveLength(1);
    expect(analysis.lines[0]?.capitalTransmis).toBe(400000);
    expect(analysis.lines[0]?.primeTaxableAvant70).toBe(0);
    expect(analysis.lines[0]?.primeTaxableApres70).toBe(80000);
    expect(analysis.lines[0]?.taxable757B).toBeGreaterThan(0);
    expect(analysis.lines[0]?.lien).toBe('enfant');
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
      new Date('2035-06-01T00:00:00Z'),
    );

    expect(analysis.lines[0]?.label).toBe('Oncle / tante 1');
  });
});
