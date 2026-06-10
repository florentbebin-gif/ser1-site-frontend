import type { MementoChapter } from './types';

export const MEMENTO_CHAPTERS = [
  {
    id: 'foyer',
    label: 'Foyer',
    description: 'Socle familial, composition du foyer et informations personnelles structurantes.',
  },
  {
    id: 'civil',
    label: 'Civil',
    description: 'Régimes matrimoniaux, protection du conjoint et règles civiles transverses.',
  },
  {
    id: 'patrimoine',
    label: 'Patrimoine',
    description: 'Synthèse actif-passif, masses patrimoniales et rattachement au dossier central.',
  },
  {
    id: 'fiscalite-foyer',
    label: 'Fiscalité foyer',
    description: 'Paramètres fiscaux du foyer, sans dupliquer les valeurs portées par Settings.',
  },
  {
    id: 'transmission',
    label: 'Transmission',
    description: 'Succession, donations et préparation de la liquidité successorale.',
  },
  {
    id: 'placements',
    label: 'Placements',
    description: 'Allocation, enveloppes financières et référentiels de contrats.',
  },
  {
    id: 'immobilier',
    label: 'Immobilier',
    description: 'Crédit, détention, revenus immobiliers et arbitrages associés.',
  },
  {
    id: 'arbitrage',
    label: 'Arbitrage',
    description: 'Choix conserver, céder, réemployer ou comparer des scénarios patrimoniaux.',
  },
  {
    id: 'retraite',
    label: 'Retraite',
    description: 'Retraite obligatoire, droits futurs et régimes de base ou complémentaires.',
  },
  {
    id: 'epargne-retraite',
    label: 'Épargne retraite',
    description: 'PER, contrats retraite et fiscalité de constitution ou de sortie.',
  },
  {
    id: 'prevoyance',
    label: 'Prévoyance',
    description: 'Protection familiale, maintien, invalidité, décès et régimes associés.',
  },
  {
    id: 'societe',
    label: 'Société',
    description: 'Organisation, comptabilité, trésorerie, valorisation et opérations société.',
  },
  {
    id: 'dirigeant',
    label: 'Dirigeant',
    description: 'Rémunération, protection sociale, retraite et sorties de capitaux du dirigeant.',
  },
  {
    id: 'transmission-entreprise',
    label: 'Transmission entreprise',
    description: 'Dutreil, transmission de titres, liquidité et opérations patrimoniales société.',
  },
] as const satisfies readonly MementoChapter[];
