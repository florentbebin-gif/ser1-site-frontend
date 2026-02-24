/**
 * domain/base-contrat/rules/index.ts
 *
 * Point d'entrée du référentiel des règles fiscales par produit (PR5).
 *
 * Exports publics :
 *   getRules(productId, audience) → ProductRules  (jamais null/undefined)
 *   getRulesForProduct(product, audience) → ProductRules
 *   hasSocleRules(productId) → boolean  (false = placeholder)
 */

import type { Audience, ProductRules } from './types';
import type { CatalogProduct } from '../catalog';

import { getAssuranceEpargneRules } from './library/assurance-epargne';
import { getEpargneBancaireRules } from './library/epargne-bancaire';
import { getRetraiteRules } from './library/retraite';
import { getImmobilierRules } from './library/immobilier';
import { getPrevoyanceRules } from './library/prevoyance';
import { getValeursMobilieresRules } from './library/valeurs-mobilieres';
import { getAutresRules } from './library/autres';
import { getFiscauxImmobilierRules } from './library/fiscaux-immobilier';
import { PLACEHOLDER_RULES } from './library/placeholder';

export type { ProductRules, RuleBlock, Audience } from './types';

const RESOLVERS: Array<(_id: string, _audience: Audience) => ProductRules | undefined> = [
  getAssuranceEpargneRules,
  getEpargneBancaireRules,
  getRetraiteRules,
  getImmobilierRules,
  getPrevoyanceRules,
  getValeursMobilieresRules,
  getAutresRules,
  getFiscauxImmobilierRules,
];

/**
 * Retourne les règles fiscales pour un produit donné et une audience.
 * Garantit toujours un résultat non-null (PLACEHOLDER_RULES en dernier recours).
 */
export function getRules(productId: string, audience: Audience): ProductRules {
  for (const resolver of RESOLVERS) {
    const rules = resolver(productId, audience);
    if (rules) return rules;
  }
  return PLACEHOLDER_RULES;
}

/**
 * Variante typée acceptant un CatalogProduct directement.
 */
export function getRulesForProduct(
  product: CatalogProduct,
  audience: Audience,
): ProductRules {
  return getRules(product.id, audience);
}

/**
 * true = le produit dispose de règles réelles (non placeholder).
 */
export function hasSocleRules(productId: string): boolean {
  for (const resolve of RESOLVERS) {
    const rules = resolve(productId, 'pp') ?? resolve(productId, 'pm');
    if (rules && !rules.isPlaceholder) return true;
  }
  return false;
}
