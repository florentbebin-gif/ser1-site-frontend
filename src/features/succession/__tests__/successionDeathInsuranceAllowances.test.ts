import { describe, expect, it } from 'vitest';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { coordinateSuccessionInsuranceAllowances } from '../successionDeathInsuranceAllowances';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import type {
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';

function makeCivil(overrides: Partial<SuccessionCivilContext> = {}): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'celibataire',
    regimeMatrimonial: null,
    pacsConvention: 'separation',
    dateNaissanceEpoux1: '1970-01-01',
    dateNaissanceEpoux2: '1972-01-01',
    ...overrides,
  };
}

function makeAssuranceVieEntry(
  overrides: Partial<SuccessionAssuranceVieEntry> = {},
): SuccessionAssuranceVieEntry {
  return {
    id: 'av-1',
    typeContrat: 'standard',
    souscripteur: 'epoux1',
    assure: 'epoux1',
    clauseBeneficiaire: 'CUSTOM:E1:100',
    capitauxDeces: 1_000_000,
    versementsApres70: 0,
    ...overrides,
  };
}

function makePrevoyanceEntry(
  overrides: Partial<SuccessionPrevoyanceDecesEntry> = {},
): SuccessionPrevoyanceDecesEntry {
  return {
    id: 'prev-1',
    souscripteur: 'epoux1',
    assure: 'epoux1',
    capitalDeces: 200_000,
    dernierePrime: 10_000,
    clauseBeneficiaire: 'CUSTOM:E1:100',
    ...overrides,
  };
}

describe('coordinateSuccessionInsuranceAllowances', () => {
  it('shares the 990 I allowance between assurance-vie and prevoyance for the same beneficiary', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const civil = makeCivil();
    const enfants = [{ id: 'E1', rattachement: 'epoux1' as const }];
    const avFiscalAnalysis = buildSuccessionAvFiscalAnalysis(
      [makeAssuranceVieEntry()],
      civil,
      enfants,
      [],
      snapshot,
    );
    const perFiscalAnalysis = buildSuccessionPerFiscalAnalysis(
      [],
      civil,
      enfants,
      [],
      snapshot,
      new Date('2035-06-01T00:00:00Z'),
    );
    const prevoyanceFiscalAnalysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [makePrevoyanceEntry()],
      civil,
      enfants,
      [],
      snapshot,
    );

    expect(prevoyanceFiscalAnalysis.totalDroits).toBeGreaterThan(0);

    const coordinated = coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      fiscalSnapshot: snapshot,
    });

    expect(coordinated.prevoyanceFiscalAnalysis.totalDroits).toBeGreaterThan(0);
    expect(coordinated.avFiscalAnalysis.totalDroits + coordinated.prevoyanceFiscalAnalysis.totalDroits)
      .toBeGreaterThan(avFiscalAnalysis.totalDroits + prevoyanceFiscalAnalysis.totalDroits);
    expect(
      coordinated.avFiscalAnalysis.byAssure.epoux1.lines[0].taxable990I
      + coordinated.prevoyanceFiscalAnalysis.byAssure.epoux1.lines[0].taxable990I,
    ).toBeCloseTo(1_047_500, 6);
  });

  it('keeps prevoyance entirely in the 990 I pool after coordination', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const civil = makeCivil({ dateNaissanceEpoux1: '1940-01-01' });
    const familyMembers: FamilyMember[] = [
      { id: 'fam-1', type: 'tierce_personne', branch: 'epoux1' },
    ];
    const avFiscalAnalysis = buildSuccessionAvFiscalAnalysis(
      [makeAssuranceVieEntry({
        capitauxDeces: 20_000,
        versementsApres70: 20_000,
        clauseBeneficiaire: 'CUSTOM:fam-1:100',
      })],
      civil,
      [],
      familyMembers,
      snapshot,
    );
    const perFiscalAnalysis = buildSuccessionPerFiscalAnalysis(
      [],
      civil,
      [],
      familyMembers,
      snapshot,
      new Date('2026-03-18T00:00:00Z'),
    );
    const prevoyanceFiscalAnalysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [makePrevoyanceEntry({
        capitalDeces: 300_000,
        dernierePrime: 20_000,
        clauseBeneficiaire: 'CUSTOM:fam-1:100',
      })],
      civil,
      [],
      familyMembers,
      snapshot,
    );

    expect(avFiscalAnalysis.totalDroits).toBe(0);
    expect(prevoyanceFiscalAnalysis.lines[0]?.taxable757B).toBe(0);

    const coordinated = coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      fiscalSnapshot: snapshot,
    });

    expect(coordinated.avFiscalAnalysis.byAssure.epoux1.lines[0].taxable757B).toBe(0);
    expect(coordinated.prevoyanceFiscalAnalysis.byAssure.epoux1.lines[0].taxable757B).toBe(0);
    expect(coordinated.prevoyanceFiscalAnalysis.byAssure.epoux1.lines[0].taxable990I).toBeGreaterThan(0);
  });
});
