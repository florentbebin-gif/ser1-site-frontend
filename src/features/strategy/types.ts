/**
 * Types pour la Stratégie Patrimoniale
 */

import type { ObjectifClient } from '../audit/types';

// Types de produits disponibles (MVP)
export type ProduitType = 
  | 'per'
  | 'assurance_vie'
  | 'cto'
  | 'pea'
  | 'scpi'
  | 'immobilier_locatif'
  | 'donation';

export interface ProduitConfig {
  id: string;
  type: ProduitType;
  libelle: string;
  montantInitial?: number;
  versementsProgrammes?: number; // Mensuel
  dureeAnnees?: number;
  tauxRendementEstime?: number;
  fiscaliteEntree?: 'ir' | 'ifi' | 'aucune';
  fiscaliteSortie?: 'ir' | 'ps' | 'pfu' | 'bareme';
  notes?: string;
}

// Recommandation générée par le moteur
export interface Recommandation {
  id: string;
  titre: string;
  description: string;
  objectifsCibles: ObjectifClient[];
  priorite: 'haute' | 'moyenne' | 'basse';
  produitsAssocies: ProduitType[];
  metriquesImpactees: string[];
  warnings?: string[];
}

// Stratégie complète
export interface Strategie {
  id: string;
  dossierAuditId: string;
  dateCreation: string;
  dateModification: string;
  recommandations: Recommandation[];
  produitsSelectionnes: ProduitConfig[];
  notes?: string;
}

// Projection financière
export interface Projection {
  annee: number;
  patrimoineTotal: number;
  actifs: number;
  passifs: number;
  revenusAnnuels: number;
  impotRevenu: number;
  ifi?: number;
  droitsSuccessionEstimes?: number;
}

export interface Scenario {
  id: string;
  nom: string;
  description: string;
  projections: Projection[];
  hypotheses: string[];
}

export interface ComparaisonScenarios {
  baseline: Scenario;
  strategie: Scenario;
  ecarts: {
    patrimoineTotal: number;
    economieImpots: number;
    economieSuccession: number;
  };
}

// État initial vide
export function createEmptyStrategie(dossierAuditId: string): Strategie {
  return {
    id: crypto.randomUUID(),
    dossierAuditId,
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString(),
    recommandations: [],
    produitsSelectionnes: [],
  };
}

// Labels produits
export const PRODUIT_LABELS: Record<ProduitType, string> = {
  per: 'Plan Épargne Retraite (PER)',
  assurance_vie: 'Assurance-Vie',
  cto: 'Compte-Titres Ordinaire (CTO)',
  pea: 'Plan Épargne Actions (PEA)',
  scpi: 'SCPI',
  immobilier_locatif: 'Immobilier locatif',
  donation: 'Donation',
};
