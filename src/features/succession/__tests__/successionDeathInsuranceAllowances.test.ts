import { describe, expect, it } from 'vitest';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import {
  coordinateSuccessionInsuranceAllowances,
  extractEstateAllowanceUsage,
  type EstateAllowanceUsage,
} from '../successionDeathInsuranceAllowances';
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
  it('shares the 990 I allowance between assurance-vie and prevoyance before 70 for the same beneficiary', () => {
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
      new Date('2026-03-19T00:00:00Z'),
    );

    expect(prevoyanceFiscalAnalysis.totalDroits).toBe(0);

    const coordinated = coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      fiscalSnapshot: snapshot,
    });

    expect(coordinated.prevoyanceFiscalAnalysis.totalDroits).toBeGreaterThan(0);
    expect(
      coordinated.avFiscalAnalysis.byAssure.epoux1.lines[0].taxable990I
      + coordinated.prevoyanceFiscalAnalysis.byAssure.epoux1.lines[0].taxable990I,
    ).toBeCloseTo(857500, 6);
  });

  it('shares the 757 B allowance between assurance-vie and prevoyance after 70 for the same beneficiary', () => {
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
      new Date('2026-03-19T00:00:00Z'),
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
      new Date('2026-03-19T00:00:00Z'),
    );

    expect(avFiscalAnalysis.totalDroits).toBe(0);
    expect(prevoyanceFiscalAnalysis.lines[0]?.taxable757B).toBe(0);

    const coordinated = coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      fiscalSnapshot: snapshot,
    });

    expect(coordinated.avFiscalAnalysis.byAssure.epoux1.lines[0].taxable757B).toBeGreaterThan(0);
    expect(coordinated.prevoyanceFiscalAnalysis.byAssure.epoux1.lines[0].taxable757B).toBeGreaterThan(0);
    expect(
      coordinated.avFiscalAnalysis.byAssure.epoux1.lines[0].taxable757B
      + coordinated.prevoyanceFiscalAnalysis.byAssure.epoux1.lines[0].taxable757B,
    ).toBeCloseTo(9500, 6);
  });

  it('BUG-6/13/14: uses residual abattement from succession for 757B instead of re-applying full 100k', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const civil = makeCivil({ dateNaissanceEpoux1: '1940-01-01' });
    const enfants = [
      { id: 'E1', rattachement: 'epoux1' as const },
      { id: 'E2', rattachement: 'epoux1' as const },
    ];

    // PER after 70: 200k total, 100k per child
    const perFiscalAnalysis = buildSuccessionPerFiscalAnalysis(
      [{
        id: 'per-1',
        typeContrat: 'standard',
        assure: 'epoux1',
        clauseBeneficiaire: 'CUSTOM:E1:50;E2:50',
        capitauxDeces: 200_000,
      }],
      civil,
      enfants,
      [],
      snapshot,
      new Date('2026-03-19T00:00:00Z'),
    );

    const avFiscalAnalysis = buildSuccessionAvFiscalAnalysis([], civil, enfants, [], snapshot);
    const prevoyanceFiscalAnalysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [], civil, enfants, [], snapshot, new Date('2026-03-19T00:00:00Z'),
    );

    // Succession consumed the full 100k abattement per child (e.g. 250k brut each)
    const estateUsage: EstateAllowanceUsage = {
      E1: { lien: 'enfant', partSuccessorale: 250_000, abattementResiduel: 0 },
      E2: { lien: 'enfant', partSuccessorale: 250_000, abattementResiduel: 0 },
    };

    const coordinated = coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      fiscalSnapshot: snapshot,
      estateAllowanceUsageBySide: { epoux1: estateUsage },
    });

    // Each child: PER 100k after 70, minus ~15250 (share of 30500 global),
    // = ~84750 taxable 757B. With abattementResiduel=0, no additional DMTG abattement.
    // Expected: droits757B > 0 for each child (the old code would apply full 100k → 0 droits)
    const e1Line = coordinated.perFiscalAnalysis.byAssure.epoux1.lines.find((l) => l.id === 'E1');
    const e2Line = coordinated.perFiscalAnalysis.byAssure.epoux1.lines.find((l) => l.id === 'E2');
    expect(e1Line).toBeDefined();
    expect(e2Line).toBeDefined();
    expect(e1Line!.droits757B).toBeGreaterThan(0);
    expect(e2Line!.droits757B).toBeGreaterThan(0);
  });

  it('BUG-6/13/14: partial residual abattement correctly applied', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const civil = makeCivil({ dateNaissanceEpoux1: '1940-01-01' });
    const enfants = [{ id: 'E1', rattachement: 'epoux1' as const }];

    const perFiscalAnalysis = buildSuccessionPerFiscalAnalysis(
      [{
        id: 'per-1',
        typeContrat: 'standard',
        assure: 'epoux1',
        clauseBeneficiaire: 'CUSTOM:E1:100',
        capitauxDeces: 200_000,
      }],
      civil,
      enfants,
      [],
      snapshot,
      new Date('2026-03-19T00:00:00Z'),
    );

    const avFiscalAnalysis = buildSuccessionAvFiscalAnalysis([], civil, enfants, [], snapshot);
    const prevoyanceFiscalAnalysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [], civil, enfants, [], snapshot, new Date('2026-03-19T00:00:00Z'),
    );

    // Succession consumed 60k of the 100k abattement → residual = 40k
    const estateUsage: EstateAllowanceUsage = {
      E1: { lien: 'enfant', partSuccessorale: 60_000, abattementResiduel: 40_000 },
    };

    const withResidual = coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      fiscalSnapshot: snapshot,
      estateAllowanceUsageBySide: { epoux1: estateUsage },
    });
    const withoutResidual = coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      fiscalSnapshot: snapshot,
    });

    // With residual 40k, less abattement → more tax
    const droitsWithResidual = withResidual.perFiscalAnalysis.totalDroits;
    const droitsWithout = withoutResidual.perFiscalAnalysis.totalDroits;
    expect(droitsWithResidual).toBeGreaterThan(droitsWithout);
  });

  it('BUG-7a: demembered AV prorates 990I allowance in coordination', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const civil = makeCivil({
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'communaute_legale',
    });
    const enfants = [{ id: 'E1', rattachement: 'commun' as const }];

    // Demembered AV: conjoint gets usufruit (40%), child gets NP (60%)
    const avFiscalAnalysis = buildSuccessionAvFiscalAnalysis(
      [{
        id: 'av-1',
        typeContrat: 'demembree',
        souscripteur: 'epoux1',
        assure: 'epoux1',
        clauseBeneficiaire: 'Conjoint survivant, à défaut enfants, à défaut héritiers',
        capitauxDeces: 1_000_000,
        versementsApres70: 0,
        ageUsufruitier: 70,
      }],
      civil,
      enfants,
      [],
      snapshot,
    );

    const perFiscalAnalysis = buildSuccessionPerFiscalAnalysis(
      [], civil, enfants, [], snapshot, new Date('2035-06-01T00:00:00Z'),
    );
    const prevoyanceFiscalAnalysis = buildSuccessionPrevoyanceFiscalAnalysis(
      [], civil, enfants, [], snapshot, new Date('2035-06-01T00:00:00Z'),
    );

    const coordinated = coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      fiscalSnapshot: snapshot,
    });

    // Child (E1) gets NP 60% = 600k before 70
    // Prorated allowance = 152500 * 0.6 = 91500
    // Taxable = 600000 - 91500 = 508500
    const childLine = coordinated.avFiscalAnalysis.byAssure.epoux1.lines.find((l) => l.id === 'E1');
    expect(childLine).toBeDefined();
    expect(childLine!.capitauxAvant70).toBeCloseTo(600_000, 0);
    expect(childLine!.taxable990I).toBeCloseTo(508_500, 0);
  });

  it('extractEstateAllowanceUsage computes residual correctly', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const beneficiaries = [
      { id: 'E1', lien: 'enfant' as const, brut: 250_000 },
      { id: 'E2', lien: 'enfant' as const, brut: 50_000 },
      { id: 'conjoint', lien: 'conjoint' as const, brut: 200_000 },
    ];

    const usage = extractEstateAllowanceUsage(beneficiaries, snapshot.dmtgSettings);

    // E1: 250k brut, abattement 100k → residual 0 (fully consumed)
    expect(usage.E1?.abattementResiduel).toBe(0);
    // E2: 50k brut, abattement 100k → residual 50k
    expect(usage.E2?.abattementResiduel).toBe(50_000);
    // Conjoint: exonerated (abattement = Infinity → effective = brut)
    expect(usage.conjoint?.abattementResiduel).toBe(0);
  });
});
