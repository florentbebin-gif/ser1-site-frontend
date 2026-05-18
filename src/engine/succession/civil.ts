/**
 * Module Civil - référentiel des régimes matrimoniaux et paramètres DMTG.
 */

import { DEFAULT_TAX_SETTINGS } from '../../constants/settingsDefaults';

// Types pour la situation civile
export type RegimeMatrimonial =
  | 'communaute_legale'
  | 'communaute_universelle'
  | 'separation_biens'
  | 'participation_acquets'
  | 'communaute_meubles_acquets'
  | 'separation_biens_societe_acquets';

export type RegimeCategory = 'communautaire' | 'separatiste';

export interface RegimeInfo {
  id: RegimeMatrimonial;
  label: string;
  description: string;
  avantages: string[];
  limites: string[];
  category: RegimeCategory;
}

// Descriptions des régimes matrimoniaux
export const REGIMES_MATRIMONIAUX: Record<RegimeMatrimonial, RegimeInfo> = {
  communaute_legale: {
    id: 'communaute_legale',
    label: 'Communauté réduite aux acquêts (Légal depuis 1966)',
    category: 'communautaire',
    description:
      'Régime légal par défaut depuis 1966. Les biens acquis pendant le mariage sont communs.',
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
    category: 'communautaire',
    description: 'Tous les biens sont communs, quelle que soit leur origine.',
    avantages: [
      'Protection maximale du conjoint survivant',
      "Clause d'attribution intégrale possible",
      'Simplicité de la liquidation',
    ],
    limites: [
      "Les enfants d'un premier lit peuvent être lésés",
      'Fiscalité successorale potentiellement plus lourde pour les enfants',
      'Pas de protection des biens propres',
    ],
  },
  communaute_meubles_acquets: {
    id: 'communaute_meubles_acquets',
    label: 'Communauté de meubles et acquêts (Légal avant 1966)',
    category: 'communautaire',
    description: 'Ancien régime légal (avant 1966). Les meubles et acquêts sont communs.',
    avantages: ['Régime simple historiquement'],
    limites: ['Régime obsolète', 'Distinction meuble/immeuble complexe'],
  },
  separation_biens: {
    id: 'separation_biens',
    label: 'Séparation de biens',
    category: 'separatiste',
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
    category: 'separatiste',
    description:
      'Fonctionne comme une séparation de biens pendant le mariage, avec partage des acquêts à la dissolution.',
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
  separation_biens_societe_acquets: {
    id: 'separation_biens_societe_acquets',
    label: "Séparation de biens avec société d'acquêts",
    category: 'separatiste',
    description:
      "Régime hybride combinant séparation de biens et société d'acquêts sur des biens choisis contractuellement.",
    avantages: [
      'Indépendance patrimoniale préservée',
      'Mise en commun sélective de certains biens',
      'Flexibilité contractuelle',
    ],
    limites: [
      'Régime rare et peu usité en pratique',
      'Rédaction contractuelle complexe',
      'Liquidation délicate à la dissolution',
    ],
  },
};

// Ordre canonique : communautaires en premier, séparatistes ensuite
export const REGIMES_ORDER: RegimeMatrimonial[] = [
  'communaute_legale',
  'communaute_universelle',
  'communaute_meubles_acquets',
  'separation_biens',
  'participation_acquets',
  'separation_biens_societe_acquets',
];

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

// --- Barèmes DMTG par défaut — source unique : DEFAULT_TAX_SETTINGS.dmtg ---
export const DEFAULT_DMTG: DmtgSettings = DEFAULT_TAX_SETTINGS.dmtg;
