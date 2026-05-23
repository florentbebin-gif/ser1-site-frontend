import { describe, expect, it } from 'vitest';

import {
  capArretDuration,
  computeCollectiveAssietteBase,
  computeDecesCapitalFromContract,
  computeTranchesFromPass,
  deriveContractKindFromRegime,
  estimateSalaireNetFromBrut,
  PREVOYANCE_MAX_ARRET_DURATION_DAYS,
  selectMaintienEmployeurPalier,
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
      invalidite: { paliers: [] },
      deces: {
        capital: 120_000,
        doublementAccident: false,
        doubleEffet: false,
        renteConjoint: 0,
        renteEducation: 0,
      },
      fraisPro: { enabled: false, franchiseDays: 0, amount: 0, maxDurationYears: 1 },
      cotisation: { montantAnnuel: 900, madelin: true },
    };
    const collectif: PrevoyanceContractDraft = {
      id: 'col-1',
      name: 'Collectif',
      kind: 'collectif',
      acteJuridique: 'due',
      assiette: 'TA-TB',
      arret: { salairePct: 80 },
      invalidite: { paliers: [] },
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
});
