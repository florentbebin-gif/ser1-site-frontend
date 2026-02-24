/**
 * domain/base-contrat/rules/types.ts
 *
 * Types pour le référentiel des règles fiscales par produit (PR5).
 * 3 phases : constitution, sortie/rachat, décès/transmission.
 *
 * Les `tags` sont techniques (moteur futur) et jamais affichés en UI.
 */

export interface RuleBlock {
  title: string;
  bullets: string[];
  tags?: string[];
}

export interface ProductRules {
  constitution: RuleBlock[];
  sortie: RuleBlock[];
  deces: RuleBlock[];
}

export type Audience = 'pp' | 'pm';
