import { describe, expect, it } from 'vitest';
import { buildArretEuroChart, selectMaintienEmployeurPalier } from '../helpers';
import type { PrevoyanceMaintienEmployeurSettings, PrevoyanceRegimeSettings } from '../types';

const maintien: PrevoyanceMaintienEmployeurSettings = {
  code: 'code-travail',
  label: 'Code du travail',
  year: 2026,
  data: {
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
  },
  sources: {
    references: [
      {
        organisme: 'Service-Public',
        titre: 'Arrêt maladie : maintien employeur',
        url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F3053',
        dateConsultation: '2026-05-24',
        valeursCouvertes: ['maintien_employeur'],
        confiance: 'haute',
      },
    ],
  },
};

function salarieRegime(roDay: number): PrevoyanceRegimeSettings {
  return {
    code: 'salarie',
    label: 'Salarié',
    caisse: 'CPAM',
    population: 'salarie',
    defaultContractKind: 'collectif',
    year: 2026,
    data: {
      arret: {
        carences: { maladie: 3, accident: 3, hospitalisation: 3 },
        maxDurationDays: 1095,
        paliers: [
          {
            fromDay: 4,
            toDay: 1095,
            label: 'IJSS',
            amount: { mode: 'fixed_eur_day', value: roDay, label: `${roDay} €/j` },
          },
        ],
      },
      invalidite: { paliers: [] },
      deces: {
        capital: { mode: 'formula', value: null },
        doublementAccident: false,
        doubleEffet: false,
      },
      cotisations: { mode: 'none', value: null },
    },
    sources: {
      references: [
        {
          organisme: 'Ameli',
          titre: 'Barème salarié',
          url: 'https://www.ameli.fr/assure/remboursements/pensions-allocations-rentes/invalidite',
          dateConsultation: '2026-05-24',
          valeursCouvertes: ['arret'],
          confiance: 'haute',
        },
      ],
    },
  };
}

function buildChart(roDay: number) {
  return buildArretEuroChart({
    regimeStack: [salarieRegime(roDay)],
    contracts: [],
    kind: 'collectif',
    maintienPalier: selectMaintienEmployeurPalier(1, maintien),
    referenceAnnual: 58_400,
    salaireBrutAnnuel: 73_000,
  });
}

describe('maintien employeur prévoyance', () => {
  it('calcule le complément après carence et déduction du RO', () => {
    const chart = buildChart(40);

    expect(chart.periods.map((period) => [period.from, period.to])).toEqual([
      [0, 3],
      [4, 7],
      [8, 37],
      [38, 67],
      [68, 1095],
    ]);
    expect(chart.periods.map((period) => period.maintienEuro)).toEqual([0, 0, 140, 93, 0]);
    expect(chart.periods.map((period) => period.totalEuro)).toEqual([0, 40, 180, 133, 40]);
  });

  it('ne crée pas de complément négatif si le RO dépasse le maintien légal', () => {
    const chart = buildChart(220);

    expect(chart.periods.map((period) => period.maintienEuro)).toEqual([0, 0, 0, 0, 0]);
  });
});
