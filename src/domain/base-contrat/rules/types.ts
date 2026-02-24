/**
 * domain/base-contrat/rules/types.ts
 *
 * Types pour le référentiel des règles fiscales par produit (PR5).
 * 3 phases : constitution, sortie/rachat, décès/transmission.
 *
 * Les `tags` sont techniques (moteur futur) et jamais affichés en UI.
 * `confidence`, `sources` et `dependencies` sont internes (non affichés en UI).
 *
 * Règle d'écriture :
 *   - confidence 'elevee'  → règle fiable et sourcée
 *   - confidence 'moyenne' → au moins 1 bullet "À confirmer selon …" + dependencies non vide
 *   - confidence 'faible'  → idem + source obligatoire
 */

export type Confidence = 'elevee' | 'moyenne' | 'faible';

export interface RuleSource {
  label: string;
  url: string;
}

export interface RuleBlock {
  title: string;
  bullets: string[];
  tags?: string[];
  confidence: Confidence;
  sources?: RuleSource[];
  dependencies?: string[];
}

export interface ProductRules {
  constitution: RuleBlock[];
  sortie: RuleBlock[];
  deces: RuleBlock[];
}

export type Audience = 'pp' | 'pm';
