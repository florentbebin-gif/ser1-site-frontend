import { describe, expect, it } from 'vitest';

import {
  maintienEmployeurDataSchema,
  prevoyanceRegimeDataSchema,
  prevoyanceRegimeSettingsSchema,
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
  fiche: 'Mémento 2026',
  pagesPdf: [1, 2],
  noteValidation: 'Valeur à double valider avant livraison métier.',
};

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
