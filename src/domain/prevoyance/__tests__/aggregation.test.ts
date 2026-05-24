import { describe, expect, it } from 'vitest';
import {
  buildArretEuroChart,
  buildInvaliditePctChart,
  computeRegimeDecesCapital,
  resolveRegimeStack,
} from '../helpers';
import type { PrevoyanceContractDraft, PrevoyanceRegimeSettings } from '../types';

function regime(
  code: string,
  data: Partial<PrevoyanceRegimeSettings['data']> = {},
): PrevoyanceRegimeSettings {
  return {
    code,
    label: code.toUpperCase(),
    caisse: code.toUpperCase(),
    population: 'liberal',
    defaultContractKind: 'individuel',
    year: 2026,
    data: {
      arret: {
        carences: { maladie: 0, accident: 0, hospitalisation: 0 },
        maxDurationDays: 1095,
        paliers: [],
      },
      invalidite: { paliers: [] },
      deces: {
        capital: { mode: 'formula', value: null },
        doublementAccident: false,
        doubleEffet: false,
      },
      cotisations: { mode: 'none', value: null },
      ...data,
    },
    sources: { fiche: 'test', pagesPdf: [], noteValidation: 'test' },
  };
}

function individualContract(
  id: string,
  indemnisation: 'indemnitaire' | 'forfaitaire',
  amount: number,
): PrevoyanceContractDraft {
  return {
    id,
    name: id,
    kind: 'individuel',
    indemnisation,
    arret: {
      franchises: { accident: 0, hospitalisation: 0, maladie: 0 },
      paliers: [{ fromDay: 0, toDay: 1095, amount }],
    },
    invalidite: { indemnisation, paliers: [] },
    deces: {
      capital: 0,
      doublementAccident: false,
      doubleEffet: false,
      renteConjoint: 0,
      renteEducation: 0,
    },
    fraisPro: { enabled: false, franchiseDays: 0, amount: 0, maxDurationYears: 1 },
    cotisation: { montantAnnuel: 0, dontMadelin: 0 },
  };
}

describe('agrégation prévoyance', () => {
  it('résout une pile de régimes obligatoires depuis la composition JSONB', () => {
    const socle = regime('cnavpl', {
      deces: {
        capital: { mode: 'fixed_eur_year', value: 1_000 },
        doublementAccident: false,
        doubleEffet: false,
      },
    });
    const caissePro = regime('cavamac', {
      composition: { componentCodes: ['cnavpl', 'cavamac'] },
      deces: {
        capital: { mode: 'fixed_eur_year', value: 4_000 },
        doublementAccident: false,
        doubleEffet: false,
      },
    });

    const stack = resolveRegimeStack(caissePro, [caissePro, socle]);

    expect(stack.map((item) => item.code)).toEqual(['cnavpl', 'cavamac']);
    expect(computeRegimeDecesCapital(stack, 80_000, 0)).toBe(5_000);
  });

  it('additionne les RO et applique la règle indemnitaire puis forfaitaire en cumul', () => {
    const socle = regime('ro-1', {
      arret: {
        carences: { maladie: 0, accident: 0, hospitalisation: 0 },
        maxDurationDays: 1095,
        paliers: [
          {
            fromDay: 0,
            toDay: 30,
            label: 'RO 1',
            amount: { mode: 'fixed_eur_day', value: 30, label: 'RO 1' },
          },
          {
            fromDay: 31,
            toDay: 1095,
            label: 'RO 1',
            amount: { mode: 'fixed_eur_day', value: 20, label: 'RO 1' },
          },
        ],
      },
    });
    const caissePro = regime('ro-2', {
      arret: {
        carences: { maladie: 0, accident: 0, hospitalisation: 0 },
        maxDurationDays: 1095,
        paliers: [
          {
            fromDay: 0,
            toDay: 90,
            label: 'RO 2',
            amount: { mode: 'fixed_eur_day', value: 10, label: 'RO 2' },
          },
          {
            fromDay: 91,
            toDay: 1095,
            label: 'RO 2',
            amount: { mode: 'fixed_eur_day', value: 5, label: 'RO 2' },
          },
        ],
      },
    });

    const chart = buildArretEuroChart({
      regimeStack: [socle, caissePro],
      contracts: [
        individualContract('indemnitaire', 'indemnitaire', 90),
        individualContract('forfaitaire', 'forfaitaire', 30),
      ],
      kind: 'individuel',
      contractAggregationMode: 'cumulate',
      maintienPalier: null,
      referenceAnnual: 36_500,
      salaireBrutAnnuel: 0,
    });

    expect(
      chart.periods.map((period) => [
        period.from,
        period.to,
        period.roEuro,
        period.contratEuro,
        period.totalEuro,
      ]),
    ).toEqual([
      [0, 30, 40, 90, 130],
      [31, 90, 30, 100, 130],
      [91, 1095, 25, 105, 130],
    ]);
    expect(chart.periods[0]?.roSegments.map((segment) => [segment.code, segment.euro])).toEqual([
      ['ro-1', 30],
      ['ro-2', 10],
    ]);
  });

  it('additionne les seuils invalidité de plusieurs RO', () => {
    const baseRegime = regime('ro-invalidite-1', {
      invalidite: {
        paliers: [
          {
            fromRate: 33,
            toRate: null,
            label: 'RO 1',
            amount: { mode: 'fixed_eur_year', value: 12_000, label: 'RO 1' },
          },
        ],
      },
    });
    const secondRegime = regime('ro-invalidite-2', {
      invalidite: {
        paliers: [
          {
            fromRate: 66,
            toRate: null,
            label: 'RO 2',
            amount: { mode: 'fixed_eur_year', value: 6_000, label: 'RO 2' },
          },
        ],
      },
    });

    const chart = buildInvaliditePctChart({
      regimeStack: [baseRegime, secondRegime],
      contracts: [],
      kind: 'individuel',
      contractAggregationMode: 'compare',
      referenceAnnual: 60_000,
      salaireBrutAnnuel: 0,
    });

    expect(chart.paliers.map((palier) => [palier.rate, palier.roPct, palier.totalPct])).toEqual([
      [33, 20, 20],
      [66, 30, 30],
    ]);
    expect(chart.paliers[1]?.roSegments.map((segment) => [segment.code, segment.pct])).toEqual([
      ['ro-invalidite-1', 20],
      ['ro-invalidite-2', 10],
    ]);
  });
});
