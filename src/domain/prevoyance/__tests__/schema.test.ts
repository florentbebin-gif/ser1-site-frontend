import { describe, expect, it } from 'vitest';

import {
  maintienEmployeurDataSchema,
  prevoyanceRegimeDataSchema,
  prevoyanceRegimeSettingsSchema,
  prevoyanceSourcesSchema,
} from '../schema';

const baseData = {
  arret: {
    carences: { maladie: 3, accident: 0, hospitalisation: 0 },
    maxDurationDays: 1095,
    paliers: [
      {
        fromDay: 4,
        toDay: 1095,
        label: 'Indemnités journalières',
        amount: { mode: 'formula', value: null, label: 'Selon assiette déclarée' },
      },
    ],
  },
  invalidite: {
    paliers: [
      {
        fromRate: 33,
        toRate: null,
        label: 'Pension invalidité',
        amount: { mode: 'formula', value: null, label: 'Selon catégorie' },
      },
    ],
  },
  deces: {
    capital: { mode: 'formula', value: null, label: 'Selon régime obligatoire' },
    doublementAccident: false,
    doubleEffet: false,
    renteConjoint: null,
    renteEducation: null,
  },
  cotisations: {
    mode: 'none',
    value: null,
  },
};

const sources = {
  references: [
    {
      organisme: 'Service-Public',
      titre: 'Arrêt maladie : indemnités journalières versées au salarié',
      url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F3053',
      dateConsultation: '2026-05-24',
      valeursCouvertes: ['arret.carences.maladie', 'maintien_employeur'],
      confiance: 'haute',
      relevanceNote:
        'La fiche Service-Public documente les indemnités journalières salarié utilisées par le cas de test.',
      verifiedAt: '2026-05-24',
    },
  ],
  noteAdmin: 'Valeur à double valider avant livraison métier.',
};

function sourcesWithUrl(url: string) {
  return {
    ...sources,
    references: sources.references.map((reference) => ({ ...reference, url })),
  };
}

describe('schémas prévoyance JSONB', () => {
  it.each([
    ['salarie-cpam', 'salarie', 'collectif'],
    ['ssi', 'tns', 'individuel'],
    ['cnavpl', 'liberal', 'individuel'],
    ['cipav', 'liberal', 'individuel'],
    ['carmf', 'liberal', 'individuel'],
    ['carpimko', 'liberal', 'individuel'],
    ['cnbf', 'avocat', 'individuel'],
    ['msa-exploitant', 'exploitant_agricole', 'individuel'],
  ] as const)('valide le régime %s', (code, population, defaultContractKind) => {
    const parsed = prevoyanceRegimeSettingsSchema.safeParse({
      code,
      label: code.toUpperCase(),
      caisse: code.toUpperCase(),
      population,
      defaultContractKind,
      year: 2026,
      data: baseData,
      sources,
    });

    expect(parsed.success).toBe(true);
  });

  it('refuse les clés accentuées ou inconnues dans le payload régime', () => {
    const parsed = prevoyanceRegimeDataSchema.safeParse({
      ...baseData,
      arrêt: baseData.arret,
    });

    expect(parsed.success).toBe(false);
  });

  it('valide une composition de régimes obligatoires dans le JSONB data', () => {
    const parsed = prevoyanceRegimeDataSchema.safeParse({
      ...baseData,
      composition: { componentCodes: ['cnavpl', 'cavamac'] },
    });

    expect(parsed.success).toBe(true);
  });

  it('refuse les anciennes sources non structurées', () => {
    const parsed = prevoyanceRegimeSettingsSchema.safeParse({
      code: 'salarie-cpam',
      label: 'Salarié secteur privé — CPAM',
      caisse: 'CPAM',
      population: 'salarie',
      defaultContractKind: 'collectif',
      year: 2026,
      data: baseData,
      sources: {
        fiche: 'Ancienne fiche',
        pagesPdf: [1],
        noteValidation: 'Ancien format.',
      },
    });

    expect(parsed.success).toBe(false);
  });

  it.each([
    'https://www.service-public.gouv.fr/particuliers/vosdroits/F3053',
    'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006901160',
    'https://www.carmf.fr/page.php?page=allocataires/invalidite-deces/invalidite.htm',
  ])('accepte une URL officielle %s', (url) => {
    const parsed = prevoyanceSourcesSchema.safeParse(sourcesWithUrl(url));

    expect(parsed.success).toBe(true);
  });

  it('accepte un état explicite sans source', () => {
    const parsed = prevoyanceSourcesSchema.safeParse({
      references: [],
      noRefReason:
        'Aucune source institutionnelle stable et pertinente n’a été validée pour cette ligne de régime.',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepte une référence sans URL factice', () => {
    const parsed = prevoyanceSourcesSchema.safeParse(sourcesWithUrl(''));

    expect(parsed.success).toBe(true);
  });

  it('refuse une URL non officielle', () => {
    const parsed = prevoyanceSourcesSchema.safeParse(
      sourcesWithUrl('https://example.com/source-prevoyance'),
    );

    expect(parsed.success).toBe(false);
  });

  it('refuse une source URL sans attestation', () => {
    const parsed = prevoyanceSourcesSchema.safeParse(
      sourcesWithUrl('https://www.service-public.gouv.fr/particuliers/vosdroits/F3053'),
    );
    const withoutAttestation = {
      ...sources,
      references: sources.references.map((reference) => ({
        organisme: reference.organisme,
        titre: reference.titre,
        url: reference.url,
        dateConsultation: reference.dateConsultation,
        valeursCouvertes: reference.valeursCouvertes,
        confiance: reference.confiance,
      })),
    };

    expect(parsed.success).toBe(true);
    expect(prevoyanceSourcesSchema.safeParse(withoutAttestation).success).toBe(false);
  });

  it('refuse les pages institutionnelles de type actualité', () => {
    const parsed = prevoyanceSourcesSchema.safeParse(
      sourcesWithUrl('https://www.cavamac.fr/actus/regime-invalidite-deces'),
    );

    expect(parsed.success).toBe(false);
  });

  it('valide le bloc maintien employeur légal', () => {
    const parsed = maintienEmployeurDataSchema.safeParse({
      maintienEmployeur: {
        carenceDays: 7,
        minAncienneteYears: 1,
        paliers: [
          {
            fromAncienneteYears: 1,
            toAncienneteYears: 5,
            firstPeriodDays: 30,
            firstPeriodRate: 90,
            secondPeriodDays: 30,
            secondPeriodRate: 66.67,
          },
        ],
      },
    });

    expect(parsed.success).toBe(true);
  });
});
