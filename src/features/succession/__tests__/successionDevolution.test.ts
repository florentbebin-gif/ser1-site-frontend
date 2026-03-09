import { describe, expect, it } from 'vitest';
import type {
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDevolutionContextInput,
} from '../successionDraft';
import { DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT } from '../successionDraft';
import { buildSuccessionDevolutionAnalysis } from '../successionDevolution';

function makeCivil(overrides: Partial<SuccessionCivilContext>): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makeDevolution(overrides: SuccessionDevolutionContextInput): SuccessionDevolutionContext {
  return {
    ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
    ...overrides,
    testamentsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide,
      ...overrides.testamentsBySide,
      epoux1: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux1,
        ...overrides.testamentsBySide?.epoux1,
        particularLegacies: overrides.testamentsBySide?.epoux1?.particularLegacies ?? [],
      },
      epoux2: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux2,
        ...overrides.testamentsBySide?.epoux2,
        particularLegacies: overrides.testamentsBySide?.epoux2?.particularLegacies ?? [],
      },
    },
    ascendantsSurvivantsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
      ...overrides.ascendantsSurvivantsBySide,
    },
  };
}

describe('buildSuccessionDevolutionAnalysis', () => {
  it('gère conjoint + enfants communs avec hypothèse moteur 1/4 PP', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      2,
      makeDevolution({ nbEnfantsNonCommuns: 0 }),
      800000,
    );

    expect(analysis.masseReference).toBe(800000);
    expect(analysis.reserve?.reserve).toBe('2/3');
    expect(analysis.lines.some((line) => line.heritier === 'Conjoint survivant')).toBe(true);
    expect(analysis.lines.some((line) => line.droits.includes('hypothèse moteur'))).toBe(true);
    expect(analysis.lines.some((line) => line.montantEstime === 200000)).toBe(true);
    expect(analysis.lines.every((line) => !line.heritier.includes('Option A') && !line.heritier.includes('Option B'))).toBe(true);
  });

  it('gère conjoint + enfants non communs (1/4 PP)', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      3,
      makeDevolution({ nbEnfantsNonCommuns: 1 }),
      600000,
    );

    expect(analysis.lines.some((line) => line.droits.includes('1/4 en pleine propriété'))).toBe(true);
    expect(analysis.lines.some((line) => line.heritier === 'Descendants')).toBe(true);
    expect(analysis.lines.some((line) => line.montantEstime === 150000)).toBe(true);
  });

  it('valorise une donation entre époux en usufruit total selon l’art. 669 CGI', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({
        situationMatrimoniale: 'marie',
        dateNaissanceEpoux1: '1955-06-01',
        dateNaissanceEpoux2: '1957-05-12',
      }),
      2,
      makeDevolution({ nbEnfantsNonCommuns: 0 }),
      500000,
      0,
      [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      [],
      {
        patrimonial: {
          donationEntreEpouxActive: true,
          donationEntreEpouxOption: 'usufruit_total',
        },
        simulatedDeceased: 'epoux1',
        referenceDate: new Date('2026-03-08'),
      },
    );

    const conjointLine = analysis.lines.find((line) => line.heritier === 'Conjoint survivant');
    const descendantsLine = analysis.lines.find((line) => line.heritier === 'Descendants');
    expect(conjointLine?.montantEstime).toBe(200000);
    expect(conjointLine?.droits).toContain('usufruit');
    expect(descendantsLine?.montantEstime).toBe(300000);
    expect(descendantsLine?.droits).toContain('Nue-propriété');
    expect(analysis.warnings.some((warning) => warning.includes('art. 669 CGI'))).toBe(true);
  });

  it('gère conjoint + enfants communs avec choix légal en usufruit total', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({
        situationMatrimoniale: 'marie',
        dateNaissanceEpoux1: '1955-06-01',
        dateNaissanceEpoux2: '1957-05-12',
      }),
      2,
      makeDevolution({
        nbEnfantsNonCommuns: 0,
        choixLegalConjointSansDDV: 'usufruit',
      }),
      500000,
      0,
      [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      [],
      {
        simulatedDeceased: 'epoux1',
        referenceDate: new Date('2026-03-08'),
      },
    );

    const conjointLine = analysis.lines.find((line) => line.heritier === 'Conjoint survivant');
    const descendantsLine = analysis.lines.find((line) => line.heritier === 'Descendants');
    expect(conjointLine?.montantEstime).toBe(200000);
    expect(conjointLine?.droits).toContain('Usufruit');
    expect(descendantsLine?.montantEstime).toBe(300000);
    expect(descendantsLine?.droits).toContain('Nue-propriété');
    expect(analysis.warnings.some((warning) => warning.includes('Choix légal du conjoint'))).toBe(true);
  });

  it('gère conjoint + enfants communs avec choix légal au quart en pleine propriété', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      2,
      makeDevolution({
        nbEnfantsNonCommuns: 0,
        choixLegalConjointSansDDV: 'quart_pp',
      }),
      800000,
    );

    expect(analysis.lines.some((line) => line.droits.includes('art. 757 CC, choix légal'))).toBe(true);
    expect(analysis.lines.some((line) => line.montantEstime === 200000)).toBe(true);
  });

  it('privilégie la donation entre époux si elle est active même en présence d’enfant non commun', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({
        situationMatrimoniale: 'marie',
        dateNaissanceEpoux1: '1955-06-01',
        dateNaissanceEpoux2: '1957-05-12',
      }),
      2,
      makeDevolution({
        nbEnfantsNonCommuns: 1,
        choixLegalConjointSansDDV: 'usufruit',
      }),
      500000,
      0,
      [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'epoux1' },
      ],
      [],
      {
        patrimonial: {
          donationEntreEpouxActive: true,
          donationEntreEpouxOption: 'usufruit_total',
        },
        simulatedDeceased: 'epoux1',
        referenceDate: new Date('2026-03-08'),
      },
    );

    const conjointLine = analysis.lines.find((line) => line.heritier === 'Conjoint survivant');
    expect(conjointLine?.droits).toContain('usufruit');
    expect(analysis.lines.some((line) => line.droits === '1/4 en pleine propriété')).toBe(false);
  });
  it('produit les warnings PACS sans testament', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'pacse', regimeMatrimonial: null }),
      1,
      makeDevolution({ nbEnfantsNonCommuns: 0 }),
      250000,
    );

    expect(analysis.lines.some((line) => line.heritier === 'Partenaire pacsé')).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('PACS'))).toBe(true);
  });

  it('plafonne enfants non communs et avertit', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      1,
      makeDevolution({
        nbEnfantsNonCommuns: 3,
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_titre_universel',
            beneficiaryRef: 'enfant:E1',
            quotePartPct: 50,
            particularLegacies: [],
          },
        },
      }),
      300000,
    );

    expect(analysis.nbEnfantsNonCommuns).toBe(1);
    expect(analysis.warnings.some((warning) => warning.includes('plafonnés'))).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('Testament actif'))).toBe(true);
    expect(analysis.lines.some((line) => line.heritier === 'Légataire à titre universel')).toBe(true);
  });

  it('prend en compte un enfant décédé représenté par des petits-enfants', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      1,
      makeDevolution({ nbEnfantsNonCommuns: 0 }),
      600000,
      0,
      [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun', deceased: true },
      ],
      [
        { id: 'PG1', type: 'petit_enfant', parentEnfantId: 'E2' },
        { id: 'PG2', type: 'petit_enfant', parentEnfantId: 'E2' },
      ],
    );

    expect(analysis.nbEnfantsTotal).toBe(2);
    expect(analysis.reserve?.reserve).toBe('2/3');
    expect(analysis.lines.some((line) => line.droits.includes('représentation'))).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('Représentation successorale simplifiée'))).toBe(true);
  });

  it('marié sans descendants, deux parents vivants — art. 757-1 CC (conjoint 1/2, parents 1/4 chacun)', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      0,
      makeDevolution({
        nbEnfantsNonCommuns: 0,
        ascendantsSurvivantsBySide: { epoux1: true },
      }),
      400000,
      0,
      [],
      [
        { id: 'P1', type: 'parent', branch: 'epoux1' },
        { id: 'P2', type: 'parent', branch: 'epoux1' },
      ],
    );

    const conjointLine = analysis.lines.find((l) => l.heritier === 'Conjoint survivant');
    expect(conjointLine?.montantEstime).toBe(200000); // 1/2
    expect(conjointLine?.droits).toContain('art. 757-1 CC');
    const ascendantsLine = analysis.lines.find((l) => l.heritier === 'Ascendants (père et mère)');
    expect(ascendantsLine?.montantEstime).toBe(200000); // 1/4 + 1/4
    expect(analysis.reserve).toBeNull();
  });

  it('marié sans descendants, un seul parent — art. 757-1 CC (conjoint 3/4, parent 1/4)', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      0,
      makeDevolution({
        nbEnfantsNonCommuns: 0,
        ascendantsSurvivantsBySide: { epoux1: true },
      }),
      400000,
      0,
      [],
      [{ id: 'P1', type: 'parent', branch: 'epoux1' }],
    );

    const conjointLine = analysis.lines.find((l) => l.heritier === 'Conjoint survivant');
    expect(conjointLine?.montantEstime).toBe(300000); // 3/4
    expect(conjointLine?.droits).toContain('art. 757-1 CC');
    const ascendantLine = analysis.lines.find((l) => l.heritier === 'Ascendant survivant');
    expect(ascendantLine?.montantEstime).toBe(100000); // 1/4
  });

  it('marié sans descendants, sans ascendants — art. 757-2 CC (conjoint hérite de tout)', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'marie' }),
      0,
      makeDevolution({
        nbEnfantsNonCommuns: 0,
        ascendantsSurvivantsBySide: { epoux1: false },
      }),
      500000,
    );

    expect(analysis.lines).toHaveLength(1);
    expect(analysis.lines[0].heritier).toBe('Conjoint survivant');
    expect(analysis.lines[0].montantEstime).toBe(500000);
    expect(analysis.lines[0].droits).toContain('art. 757-2 CC');
  });

  it('célibataire sans descendants, deux parents et un frère — art. 738 CC (parents 1/4 chacun, frère 1/2)', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'celibataire' as never }),
      0,
      makeDevolution({ nbEnfantsNonCommuns: 0 }),
      600000,
      0,
      [],
      [
        { id: 'P1', type: 'parent', branch: 'epoux1' },
        { id: 'P2', type: 'parent', branch: 'epoux1' },
        { id: 'F1', type: 'frere_soeur', branch: 'epoux1' },
      ],
    );

    const parentsLine = analysis.lines.find((l) => l.heritier === 'Père et mère');
    expect(parentsLine?.montantEstime).toBe(300000); // 1/2 total (1/4 chacun)
    expect(parentsLine?.droits).toContain('art. 738 CC');
    const freresLine = analysis.lines.find((l) => l.heritier === 'Frères et sœurs');
    expect(freresLine?.montantEstime).toBe(300000); // 1/2
    expect(freresLine?.droits).toContain('art. 738 CC');
  });

  it('célibataire sans descendants, sans parents, deux frères — art. 737 CC (frères héritent de tout)', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'celibataire' as never }),
      0,
      makeDevolution({ nbEnfantsNonCommuns: 0 }),
      300000,
      0,
      [],
      [
        { id: 'F1', type: 'frere_soeur', branch: 'epoux1' },
        { id: 'F2', type: 'frere_soeur', branch: 'epoux1' },
      ],
    );

    expect(analysis.lines).toHaveLength(1);
    expect(analysis.lines[0].heritier).toBe('Frères et sœurs');
    expect(analysis.lines[0].montantEstime).toBe(300000);
    expect(analysis.lines[0].droits).toContain('art. 737 CC');
  });

  it('célibataire sans descendants, un parent et deux frères — art. 738-1 CC (parent 1/4, frères 3/4)', () => {
    const analysis = buildSuccessionDevolutionAnalysis(
      makeCivil({ situationMatrimoniale: 'celibataire' as never }),
      0,
      makeDevolution({ nbEnfantsNonCommuns: 0 }),
      800000,
      0,
      [],
      [
        { id: 'P1', type: 'parent', branch: 'epoux1' },
        { id: 'F1', type: 'frere_soeur', branch: 'epoux1' },
        { id: 'F2', type: 'frere_soeur', branch: 'epoux1' },
      ],
    );

    const parentLine = analysis.lines.find((l) => l.heritier === 'Ascendant survivant');
    expect(parentLine?.montantEstime).toBe(200000); // 1/4
    expect(parentLine?.droits).toContain('art. 738-1 CC');
    const freresLine = analysis.lines.find((l) => l.heritier === 'Frères et sœurs');
    expect(freresLine?.montantEstime).toBe(600000); // 3/4
    expect(freresLine?.droits).toContain('art. 738-1 CC');
    expect(freresLine?.droits).toContain('2 collatéraux privilégiés');
  });
});


