/**
 * Module Civil - Régimes matrimoniaux et situation familiale
 * 
 * Ce module fournit des informations descriptives sur les régimes matrimoniaux.
 * Les calculs juridiques complexes ne sont pas implémentés au MVP.
 */

import { mkResult, mkRuleVersion } from './helpers';
import type { CalcResult } from './types';

// Types pour la situation civile
export type RegimeMatrimonial = 
  | 'communaute_legale'
  | 'communaute_universelle'
  | 'separation_biens'
  | 'participation_acquets'
  | 'communaute_meubles_acquets';

export interface RegimeInfo {
  id: RegimeMatrimonial;
  label: string;
  description: string;
  avantages: string[];
  limites: string[];
}

// Descriptions des régimes matrimoniaux
export const REGIMES_MATRIMONIAUX: Record<RegimeMatrimonial, RegimeInfo> = {
  communaute_legale: {
    id: 'communaute_legale',
    label: 'Communauté réduite aux acquêts',
    description: 'Régime légal par défaut depuis 1966. Les biens acquis pendant le mariage sont communs.',
    avantages: [
      'Protection du conjoint survivant',
      'Mutualisation des acquêts',
      'Simplicité de gestion courante',
    ],
    limites: [
      'Les dettes contractées par un époux engagent la communauté',
      'Liquidation complexe en cas de divorce',
      'Biens propres peuvent être difficiles à tracer',
    ],
  },
  communaute_universelle: {
    id: 'communaute_universelle',
    label: 'Communauté universelle',
    description: 'Tous les biens sont communs, quelle que soit leur origine.',
    avantages: [
      'Protection maximale du conjoint survivant',
      'Clause d\'attribution intégrale possible',
      'Simplicité de la liquidation',
    ],
    limites: [
      'Les enfants d\'un premier lit peuvent être lésés',
      'Fiscalité successorale potentiellement plus lourde pour les enfants',
      'Pas de protection des biens propres',
    ],
  },
  separation_biens: {
    id: 'separation_biens',
    label: 'Séparation de biens',
    description: 'Chaque époux conserve la propriété et la gestion de ses biens.',
    avantages: [
      'Indépendance patrimoniale totale',
      'Protection contre les dettes du conjoint',
      'Adapté aux professions à risque',
    ],
    limites: [
      'Moindre protection du conjoint survivant',
      'Nécessite une bonne organisation des comptes',
      'Peut créer des inégalités patrimoniales',
    ],
  },
  participation_acquets: {
    id: 'participation_acquets',
    label: 'Participation aux acquêts',
    description: 'Fonctionne comme une séparation de biens pendant le mariage, avec partage des acquêts à la dissolution.',
    avantages: [
      'Indépendance pendant le mariage',
      'Partage équitable à la dissolution',
      'Protection contre les dettes',
    ],
    limites: [
      'Complexité de calcul de la créance de participation',
      'Peu utilisé en pratique',
      'Liquidation plus complexe',
    ],
  },
  communaute_meubles_acquets: {
    id: 'communaute_meubles_acquets',
    label: 'Communauté de meubles et acquêts',
    description: 'Ancien régime légal (avant 1966). Les meubles et acquêts sont communs.',
    avantages: [
      'Régime simple historiquement',
    ],
    limites: [
      'Régime obsolète',
      'Distinction meuble/immeuble complexe',
    ],
  },
};

// --- Types DMTG ---
export interface DmtgScaleItem {
  from: number;
  to: number | null;
  rate: number;
}

export interface DmtgCategory {
  abattement: number;
  scale: DmtgScaleItem[];
}

export interface DmtgSettings {
  ligneDirecte: DmtgCategory;
  frereSoeur: DmtgCategory;
  neveuNiece: DmtgCategory;
  autre: DmtgCategory;
}

// --- Barèmes DMTG par défaut (2024) ---
export const DEFAULT_DMTG: DmtgSettings = {
  ligneDirecte: {
    abattement: 100_000,
    scale: [
      { from: 0, to: 8_072, rate: 5 },
      { from: 8_072, to: 12_109, rate: 10 },
      { from: 12_109, to: 15_932, rate: 15 },
      { from: 15_932, to: 552_324, rate: 20 },
      { from: 552_324, to: 902_838, rate: 30 },
      { from: 902_838, to: 1_805_677, rate: 40 },
      { from: 1_805_677, to: null, rate: 45 },
    ],
  },
  frereSoeur: {
    abattement: 15_932,
    scale: [
      { from: 0, to: 24_430, rate: 35 },
      { from: 24_430, to: null, rate: 45 },
    ],
  },
  neveuNiece: {
    abattement: 7_967,
    scale: [
      { from: 0, to: null, rate: 55 },
    ],
  },
  autre: {
    abattement: 1_594,
    scale: [
      { from: 0, to: null, rate: 60 },
    ],
  },
};

// Abattements transmission (enfants) - Version 2024
// @deprecated Utiliser DEFAULT_DMTG.ligneDirecte.abattement
export const ABATTEMENT_ENFANT = DEFAULT_DMTG.ligneDirecte.abattement;

// Barème DMTG ligne directe (2024)
// @deprecated Utiliser DEFAULT_DMTG.ligneDirecte.scale
export const BAREME_DMTG_LIGNE_DIRECTE = DEFAULT_DMTG.ligneDirecte.scale.map(s => ({
  min: s.from,
  max: s.to ?? Infinity,
  taux: s.rate,
}));

export interface CivilSituationInput {
  regime: RegimeMatrimonial;
  nbEnfants: number;
  nbEnfantsPremierLit?: number;
}

export interface CivilSituationResult {
  regime: RegimeInfo;
  abattementTotal: number;
  baremeApplicable: typeof BAREME_DMTG_LIGNE_DIRECTE;
}

/**
 * Analyse la situation civile et retourne les informations pertinentes
 */
export function analyzeCivilSituation(
  input: CivilSituationInput
): CalcResult<CivilSituationResult> {
  const regime = REGIMES_MATRIMONIAUX[input.regime];
  const abattementTotal = input.nbEnfants * ABATTEMENT_ENFANT;

  return mkResult({
    id: 'civil-situation',
    name: 'Analyse situation civile',
    inputs: [
      { id: 'regime', label: 'Régime matrimonial', value: input.regime },
      { id: 'nbEnfants', label: 'Nombre d\'enfants', value: input.nbEnfants },
    ],
    assumptions: [
      {
        id: 'abattement_2024',
        label: 'Abattement enfant',
        value: ABATTEMENT_ENFANT,
        source: 'CGI Art. 779',
        editable: true,
      },
    ],
    formulaText: 'abattementTotal = nbEnfants × abattementEnfant',
    outputs: [
      { id: 'abattementTotal', label: 'Abattement total', value: abattementTotal, unit: '€' },
    ],
    result: {
      regime,
      abattementTotal,
      baremeApplicable: BAREME_DMTG_LIGNE_DIRECTE,
    },
    ruleVersion: mkRuleVersion('2024.1', 'CGI Art. 779, 777', true),
    sourceNote: 'Barème DMTG et abattements 2024',
    warnings: [],
  });
}
