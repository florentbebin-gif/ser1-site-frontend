import { describe, expect, it } from 'vitest';

import {
  capArretDuration,
  buildArretCoverageBars,
  buildArretEuroChart,
  buildInvaliditeCoverageBars,
  buildInvaliditePctChart,
  computeCollectiveAssietteBase,
  computeDecesCapitalFromContract,
  computeTranchesFromPass,
  deriveContractKindFromRegime,
  estimateSalaireNetFromBrut,
  findArretPalierForRange,
  PREVOYANCE_MAX_ARRET_DURATION_DAYS,
  selectMaintienEmployeurPalier,
  splitIntoSubPeriods,
  unionBoundaries,
} from '../helpers';
import type {
  PrevoyanceContractDraft,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '../types';

const PASS_TEST = 50_000;

function regime(
  population: PrevoyanceRegimeSettings['population'],
): Pick<PrevoyanceRegimeSettings, 'population' | 'defaultContractKind'> {
  return {
    population,
    defaultContractKind: population === 'salarie' ? 'collectif' : 'individuel',
  };
}

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
        {
          fromAncienneteYears: 6,
          toAncienneteYears: 10,
          firstPeriodDays: 40,
          firstPeriodRate: 90,
          secondPeriodDays: 40,
          secondPeriodRate: 66.67,
        },
      ],
    },
  },
  sources: {
    fiche: 'Code du travail',
    pagesPdf: [1],
    noteValidation: 'Cas de test.',
  },
};

describe('helpers prévoyance', () => {
  it('déduit le type de contrat depuis le régime obligatoire', () => {
    expect(deriveContractKindFromRegime(regime('salarie'))).toBe('collectif');
    expect(deriveContractKindFromRegime(regime('tns'))).toBe('individuel');
    expect(deriveContractKindFromRegime(regime('liberal'))).toBe('individuel');
  });

  it('calcule les tranches TA/TB/TC depuis le PASS fourni par le contexte fiscal', () => {
    const tranches = computeTranchesFromPass(PASS_TEST * 5, PASS_TEST);

    expect(tranches.ta).toBe(PASS_TEST);
    expect(tranches.tb).toBe(PASS_TEST * 3);
    expect(tranches.tc).toBe(PASS_TEST);
    expect(computeCollectiveAssietteBase('TA-TB', tranches)).toBe(PASS_TEST * 4);
  });

  it('sélectionne le maintien employeur selon l’ancienneté', () => {
    expect(selectMaintienEmployeurPalier(0, maintien)).toBeNull();
    expect(selectMaintienEmployeurPalier(1, maintien)?.firstPeriodDays).toBe(30);
    expect(selectMaintienEmployeurPalier(5, maintien)?.secondPeriodDays).toBe(30);
    expect(selectMaintienEmployeurPalier(10, maintien)?.firstPeriodDays).toBe(40);
  });

  it('borne la durée arrêt de travail à la limite réglementaire de présentation', () => {
    expect(capArretDuration(PREVOYANCE_MAX_ARRET_DURATION_DAYS + 1)).toBe(
      PREVOYANCE_MAX_ARRET_DURATION_DAYS,
    );
  });

  it('calcule la base décès selon le modèle individuel ou collectif', () => {
    const individuel: PrevoyanceContractDraft = {
      id: 'ind-1',
      name: 'Individuel',
      kind: 'individuel',
      indemnisation: 'forfaitaire',
      arret: {
        franchises: { accident: 0, hospitalisation: 0, maladie: 0 },
        paliers: [],
      },
      invalidite: { indemnisation: 'forfaitaire', paliers: [] },
      deces: {
        capital: 120_000,
        doublementAccident: false,
        doubleEffet: false,
        renteConjoint: 0,
        renteEducation: 0,
      },
      fraisPro: { enabled: false, franchiseDays: 0, amount: 0, maxDurationYears: 1 },
      cotisation: { montantAnnuel: 900, dontMadelin: 900 },
    };
    const collectif: PrevoyanceContractDraft = {
      id: 'col-1',
      name: 'Collectif',
      kind: 'collectif',
      acteJuridique: 'due',
      assiette: 'TA-TB',
      arret: { salairePct: 80 },
      invalidite: { indemnisation: 'forfaitaire', paliers: [] },
      deces: {
        salairePct: 300,
        doublementAccident: true,
        doubleEffet: true,
        renteConjointPct: 0,
        renteEducationPct: 0,
      },
      cotisation: {
        tauxPctSalaire: 1.5,
        repartition: { employeur: 70, salarie: 30 },
      },
    };

    expect(computeDecesCapitalFromContract(individuel, 80_000)).toBe(120_000);
    expect(computeDecesCapitalFromContract(collectif, 80_000)).toBe(240_000);
    expect(estimateSalaireNetFromBrut(100_000)).toBe(80_000);
  });

  it('retrouve un palier arrêt par intersection de période', () => {
    const paliers = [
      {
        fromDay: 91,
        toDay: 365,
        label: 'Après franchise',
        amount: { mode: 'fixed_eur_day' as const, value: 80, label: '80 €/j' },
      },
    ];

    expect(findArretPalierForRange(paliers, 0, 90)).toBeNull();
    expect(findArretPalierForRange(paliers, 120, 200)?.label).toBe('Après franchise');
  });

  it('calcule l’union des bornes arrêt et les sous-périodes contiguës', () => {
    const paliers = [
      { from: 0, to: 3 },
      { from: 4, to: 1095 },
      { from: 0, to: 7 },
      { from: 8, to: 90 },
      { from: 91, to: 1095 },
    ];

    expect(unionBoundaries(paliers)).toEqual([0, 3, 4, 7, 8, 90, 91, 1095]);
    expect(splitIntoSubPeriods(paliers)).toEqual([
      { from: 0, to: 3 },
      { from: 4, to: 7 },
      { from: 8, to: 90 },
      { from: 91, to: 1095 },
    ]);
  });

  it('construit le graphique arrêt en euros journaliers', () => {
    const individuel: PrevoyanceContractDraft = {
      id: 'ind-1',
      name: 'Individuel',
      kind: 'individuel',
      indemnisation: 'forfaitaire',
      arret: {
        franchises: { accident: 0, hospitalisation: 0, maladie: 0 },
        paliers: [
          { fromDay: 0, toDay: 7, amount: 20 },
          { fromDay: 8, toDay: 90, amount: 90 },
          { fromDay: 91, toDay: 1095, amount: 120 },
        ],
      },
      invalidite: { paliers: [] },
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
    const chart = buildArretEuroChart({
      regimeStack: [
        {
          code: 'ssi',
          label: 'SSI',
          caisse: 'SSI',
          population: 'tns',
          defaultContractKind: 'individuel',
          year: 2026,
          data: {
            arret: {
              carences: { maladie: 3, accident: 0, hospitalisation: 0 },
              maxDurationDays: 1095,
              paliers: [
                {
                  fromDay: 4,
                  toDay: 1095,
                  label: 'IJ',
                  amount: { mode: 'fixed_eur_day', value: 40, label: '40 €/j' },
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
          sources: { fiche: 'test', pagesPdf: [], noteValidation: 'test' },
        },
      ],
      contracts: [individuel],
      kind: 'individuel',
      maintienPalier: null,
      referenceAnnual: 36_500,
      salaireBrutAnnuel: 0,
    });

    expect(chart.reference).toBe(100);
    expect(chart.periods.map((period) => [period.from, period.to, period.totalEuro])).toEqual([
      [0, 3, 20],
      [4, 7, 60],
      [8, 90, 130],
      [91, 1095, 160],
    ]);
  });

  it('construit les fenêtres arrêt depuis la carence quand le RO a un seul palier', () => {
    const bars = buildArretCoverageBars({
      regimeStack: [
        {
          code: 'carpimko',
          label: 'CARPIMKO',
          caisse: 'CARPIMKO',
          population: 'liberal',
          defaultContractKind: 'individuel',
          year: 2026,
          data: {
            arret: {
              carences: { maladie: 90, accident: 90, hospitalisation: 90 },
              maxDurationDays: 1095,
              paliers: [
                {
                  fromDay: 91,
                  toDay: 1095,
                  label: 'IJ CARPIMKO',
                  amount: { mode: 'fixed_eur_day', value: 55, label: '55 €/j' },
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
          sources: { fiche: 'test', pagesPdf: [], noteValidation: 'test' },
        },
      ],
      contracts: [],
      kind: 'individuel',
      maintienPalier: null,
      referenceAnnual: 60_000,
      salaireBrutAnnuel: 0,
    });

    expect(bars.map((bar) => bar.label)).toEqual([
      'Net perçu',
      '0 à 90 j',
      '91 à 365 j',
      '366 à 1095 j',
    ]);
  });

  it('affiche une seule fenêtre arrêt quand aucun palier RO n’est renseigné', () => {
    const bars = buildArretCoverageBars({
      regimeStack: [],
      contracts: [],
      kind: 'individuel',
      maintienPalier: null,
      referenceAnnual: 60_000,
      salaireBrutAnnuel: 0,
    });

    expect(bars.map((bar) => bar.label)).toEqual(['Net perçu', '0 à 1095 j']);
  });

  it('construit les seuils invalidité depuis le RO et les contrats', () => {
    const collectif: PrevoyanceContractDraft = {
      id: 'col-1',
      name: 'Collectif',
      kind: 'collectif',
      acteJuridique: 'due',
      assiette: 'TA-TB',
      arret: { salairePct: 80 },
      invalidite: { paliers: [{ fromRate: 16, salairePct: 40 }] },
      deces: {
        salairePct: 300,
        doublementAccident: false,
        doubleEffet: false,
        renteConjointPct: 0,
        renteEducationPct: 0,
      },
      cotisation: { tauxPctSalaire: 1, repartition: { employeur: 50, salarie: 50 } },
    };
    const bars = buildInvaliditeCoverageBars({
      regimeStack: [
        {
          code: 'salarie',
          label: 'Salarié',
          caisse: 'CPAM',
          population: 'salarie',
          defaultContractKind: 'collectif',
          year: 2026,
          data: {
            arret: {
              carences: { maladie: 3, accident: 0, hospitalisation: 0 },
              maxDurationDays: 1095,
              paliers: [],
            },
            invalidite: {
              paliers: [
                {
                  fromRate: 33,
                  toRate: 66,
                  label: 'Catégorie 1',
                  amount: { mode: 'percent_salary', value: 30, label: '30 %' },
                },
              ],
            },
            deces: {
              capital: { mode: 'formula', value: null },
              doublementAccident: false,
              doubleEffet: false,
            },
            cotisations: { mode: 'none', value: null },
          },
          sources: { fiche: 'test', pagesPdf: [], noteValidation: 'test' },
        },
      ],
      contracts: [collectif],
      kind: 'collectif',
      referenceAnnual: 40_000,
      salaireBrutAnnuel: 50_000,
    });

    expect(bars.map((bar) => bar.label)).toEqual(['Net perçu', '16 %', '33 %']);
  });

  it('construit le graphique invalidité en pourcentage du revenu cible', () => {
    const individuel: PrevoyanceContractDraft = {
      id: 'ind-1',
      name: 'Individuel',
      kind: 'individuel',
      indemnisation: 'forfaitaire',
      arret: {
        franchises: { accident: 0, hospitalisation: 0, maladie: 0 },
        paliers: [],
      },
      invalidite: {
        indemnisation: 'forfaitaire',
        paliers: [
          { fromRate: 16, toRate: 65, mode: 'fixed', referenceAmount: 0, amount: 12_000 },
          { fromRate: 66, toRate: null, mode: 'fixed', referenceAmount: 0, amount: 24_000 },
        ],
      },
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
    const chart = buildInvaliditePctChart({
      regimeStack: [],
      contracts: [individuel],
      kind: 'individuel',
      referenceAnnual: 48_000,
      salaireBrutAnnuel: 0,
    });

    expect(chart.reference).toBe(100);
    expect(chart.paliers.map((palier) => [palier.rate, palier.contratPct])).toEqual([
      [16, 25],
      [66, 50],
    ]);
  });
});
