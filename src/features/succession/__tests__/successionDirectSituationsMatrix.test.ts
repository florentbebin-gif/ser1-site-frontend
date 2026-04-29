import { describe, expect, it } from 'vitest';
import type { FamilyMember, SuccessionEnfant } from '../successionDraft';
import type { SuccessionDirectDisplayAnalysis } from '../successionDisplay';
import {
  buildDirectAnalysis,
  makeCivil,
  makeDevolution,
  makeLiquidation,
} from './successionBugRepro.helpers';

const DEUX_ENFANTS_DEFUNT: SuccessionEnfant[] = [
  { id: 'E1', rattachement: 'epoux1' },
  { id: 'E2', rattachement: 'epoux1' },
];

function expectDirectDisplayMatchesResult(analysis: SuccessionDirectDisplayAnalysis) {
  const displayedDroits = analysis.transmissionRows.reduce((sum, row) => sum + row.droits, 0);
  const displayedBrut = analysis.transmissionRows.reduce((sum, row) => sum + row.brut, 0);

  expect(displayedDroits).toBe(analysis.result?.totalDroits ?? 0);
  expect(displayedBrut).toBe(analysis.heirs.reduce((sum, heir) => sum + heir.partSuccession, 0));
}

describe('matrice succession directe par situation familiale', () => {
  it('célibataire sans descendants: les parents et la fratrie sont affichés selon le partage art. 738', () => {
    const familyMembers: FamilyMember[] = [
      { id: 'P1', type: 'parent', branch: 'epoux1' },
      { id: 'P2', type: 'parent', branch: 'epoux1' },
      { id: 'F1', type: 'frere_soeur', branch: 'epoux1' },
      { id: 'F2', type: 'frere_soeur', branch: 'epoux1' },
    ];
    const analysis = buildDirectAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'celibataire' }),
      liquidation: makeLiquidation({ actifEpoux1: 800000, nbEnfants: 0 }),
      familyMembers,
    });

    expect(analysis.transmissionRows.map((row) => row.label)).toEqual([
      'Parent 1',
      'Parent 2',
      'Frere / soeur 1',
      'Frere / soeur 2',
    ]);
    expect(analysis.transmissionRows.map((row) => row.brut)).toEqual([200000, 200000, 200000, 200000]);
    expect(analysis.heirs.map((heir) => heir.lien)).toEqual(['parent', 'parent', 'frere_soeur', 'frere_soeur']);
    expectDirectDisplayMatchesResult(analysis);
  });

  it('veuf sans descendants: aucune ligne de conjoint survivant n est injectée', () => {
    const familyMembers: FamilyMember[] = [
      { id: 'P1', type: 'parent', branch: 'epoux1' },
      { id: 'F1', type: 'frere_soeur', branch: 'epoux1' },
      { id: 'F2', type: 'frere_soeur', branch: 'epoux1' },
    ];
    const analysis = buildDirectAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'veuf' }),
      liquidation: makeLiquidation({ actifEpoux1: 800000, nbEnfants: 0 }),
      familyMembers,
    });

    expect(analysis.transmissionRows.map((row) => row.label)).toEqual([
      'Parent 1',
      'Frere / soeur 1',
      'Frere / soeur 2',
    ]);
    expect(analysis.transmissionRows.map((row) => row.brut)).toEqual([200000, 300000, 300000]);
    expect(analysis.transmissionRows.some((row) => row.label === 'Conjoint survivant')).toBe(false);
    expectDirectDisplayMatchesResult(analysis);
  });

  it('PACS sans testament et sans descendants: les parents et la fratrie héritent, pas le partenaire', () => {
    const familyMembers: FamilyMember[] = [
      { id: 'P1', type: 'parent', branch: 'epoux1' },
      { id: 'P2', type: 'parent', branch: 'epoux1' },
      { id: 'F1', type: 'frere_soeur', branch: 'epoux1' },
    ];
    const analysis = buildDirectAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'pacse' }),
      liquidation: makeLiquidation({ actifEpoux1: 600000, nbEnfants: 0 }),
      familyMembers,
    });

    expect(analysis.transmissionRows.map((row) => row.label)).toEqual([
      'Parent 1',
      'Parent 2',
      'Frere / soeur 1',
    ]);
    expect(analysis.transmissionRows.some((row) => row.label === 'Partenaire pacsé')).toBe(false);
    expect(analysis.warnings.some((warning) => warning.includes('PACS'))).toBe(true);
    expectDirectDisplayMatchesResult(analysis);
  });

  it('PACS avec testament et sans descendants: le partenaire reçoit la masse avec exonération DMTG', () => {
    const familyMembers: FamilyMember[] = [
      { id: 'P1', type: 'parent', branch: 'epoux1' },
      { id: 'F1', type: 'frere_soeur', branch: 'epoux1' },
    ];
    const analysis = buildDirectAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'pacse' }),
      liquidation: makeLiquidation({ actifEpoux1: 600000, nbEnfants: 0 }),
      familyMembers,
      devolutionContext: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
    });

    expect(analysis.transmissionRows).toHaveLength(1);
    expect(analysis.transmissionRows[0]).toMatchObject({
      label: 'Partenaire pacsé',
      brut: 600000,
      droits: 0,
      exonerated: true,
    });
    expect(analysis.heirs[0]).toMatchObject({ lien: 'conjoint', partSuccession: 600000 });
    expect(analysis.result?.totalDroits).toBe(0);
    expectDirectDisplayMatchesResult(analysis);
  });

  it('concubinage avec testament et sans descendants: le concubin est taxé comme tiers', () => {
    const analysis = buildDirectAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'concubinage' }),
      liquidation: makeLiquidation({ actifEpoux1: 600000, nbEnfants: 0 }),
      devolutionContext: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
    });

    expect(analysis.transmissionRows).toHaveLength(1);
    expect(analysis.transmissionRows[0]).toMatchObject({
      label: 'Concubin',
      brut: 600000,
      exonerated: false,
    });
    expect(analysis.heirs[0]).toMatchObject({ lien: 'autre', partSuccession: 600000 });
    expect(analysis.result?.totalDroits).toBeGreaterThan(0);
    expectDirectDisplayMatchesResult(analysis);
  });

  it('divorcé avec enfants et legs à un tiers: le tiers est taxé comme autre bénéficiaire', () => {
    const familyMembers: FamilyMember[] = [
      { id: 'T1', type: 'tierce_personne' },
    ];
    const analysis = buildDirectAnalysis({
      civil: makeCivil({ situationMatrimoniale: 'divorce' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, nbEnfants: 2 }),
      enfantsContext: DEUX_ENFANTS_DEFUNT,
      familyMembers,
      devolutionContext: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_particulier',
            beneficiaryRef: null,
            quotePartPct: 100,
            particularLegacies: [
              { id: 'leg-1', beneficiaryRef: 'family:T1', amount: 50000 },
            ],
          },
        },
      }),
    });

    expect(analysis.transmissionRows.map((row) => row.label)).toEqual(['Tierce personne', 'E1', 'E2']);
    expect(analysis.heirs.map((heir) => heir.lien)).toEqual(['autre', 'enfant', 'enfant']);
    expect(analysis.heirs.map((heir) => heir.partSuccession)).toEqual([50000, 125000, 125000]);
    expect(analysis.transmissionRows.some((row) => row.label === 'Ex-conjoint')).toBe(false);
    expectDirectDisplayMatchesResult(analysis);
  });
});
