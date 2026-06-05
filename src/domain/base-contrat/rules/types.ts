/**
 * domain/base-contrat/rules/types.ts
 *
 * Types pour le référentiel des règles fiscales par produit.
 * 3 phases : constitution, sortie/rachat, décès/transmission.
 *
 * Les `tags` sont techniques (moteur futur) et jamais affichés en UI.
 * `confidence`, `sources` et `dependencies` sont affichés en UI admin pour la veille juridique.
 *
 * Règle d'écriture :
 *   - confidence 'elevee'  → règle vérifiée, sourcée, sans bullet "À confirmer"
 *   - confidence 'moyenne' → au moins 1 bullet "À confirmer selon …" + dependencies non vide
 *   - confidence 'faible'  → idem + source obligatoire
 */

import type { LegalReferenceId } from '@/domain/legal-references';

export type Confidence = 'elevee' | 'moyenne' | 'faible';

export interface RuleSource {
  label: string;
  url?: string;
  refId?: LegalReferenceId;
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

export interface BaseContratFiscalLabels {
  pfu: string;
  pfuIr: string;
  psGeneral: string;
  psException: string;
  dmtgLigneDirecteAbattement: string;
  assuranceVie990IAllowance: string;
  assuranceVie757BAllowance: string;
  assuranceVie990IRates: string;
  assuranceVieRachatMoins8Ans: string;
  assuranceVieRachatPlus8Ans: string;
  assuranceVieRetraitsPs: string;
  capitalGainIr: string;
  malrauxReductionRates: string;
  microFoncierAbattement: string;
  peaVersementCeilings: string;
  peaPmeVersementCeilings: string;
  preciousMetalsFlatTax: string;
  rvtoTaxableFractions: string;
  soficaReductionRates: string;
  ifiResidencePrincipaleAbattement?: string;
}

export interface RuleRenderContext {
  fiscalLabels: BaseContratFiscalLabels;
}
