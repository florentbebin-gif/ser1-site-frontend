/**
 * domain/base-contrat/rules/index.ts
 *
 * Point d'entrée du référentiel des règles fiscales par produit.
 *
 * Exports publics :
 *   getRules(productId, audience, context?) → ProductRules  (jamais null/undefined)
 *   getRulesForProduct(product, audience, context?) → ProductRules
 *   hasSocleRules(productId) → boolean  (false = pas de règles)
 */

import type { Audience, ProductRules, RuleBlock, RuleRenderContext } from './types';
import type { CatalogProduct } from '../catalog';
import { CATALOG_PP_PM_SPLIT_MAP } from '../catalog';
import { DEFAULT_RULE_RENDER_CONTEXT } from './fiscalLabels';

import { getAssuranceEpargneRules } from './library/assurance-epargne';
import { getEpargneBancaireRules } from './library/epargne-bancaire';
import { getRetraiteRules } from './library/retraite';
import { getImmobilierRules } from './library/immobilier';
import { getPrevoyanceRules } from './library/prevoyance';
import { getValeursMobilieresRules } from './library/valeurs-mobilieres';
import { getAutresRules } from './library/autres';
import { getFiscauxImmobilierRules } from './library/fiscaux-immobilier';

export type {
  BaseContratFiscalLabels,
  ProductRules,
  RuleBlock,
  RuleRenderContext,
  Audience,
  Confidence,
  RuleSource,
} from './types';
export {
  buildBaseContratFiscalLabels,
  DEFAULT_RULE_RENDER_CONTEXT,
} from './fiscalLabels';
export type { EnvelopeCode, FiscalProfile } from './fiscalProfile';
export {
  getEnvelopeCatalogId,
  buildFiscalProfile,
  emptyFiscalProfile,
} from './fiscalProfile';

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

const LEGACY_SPLIT_IDS = new Set<string>(Object.keys(CATALOG_PP_PM_SPLIT_MAP));
const WARNED_LEGACY_IDS = new Set<string>();

function renderRuleText(text: string, context: RuleRenderContext): string {
  return text.replace(/\{([a-zA-Z0-9]+)\}/g, (match, key: string) => {
    const labelKey = key as keyof RuleRenderContext['fiscalLabels'];
    return context.fiscalLabels[labelKey] ?? match;
  });
}

function renderRules(
  rules: ProductRules,
  context: RuleRenderContext = DEFAULT_RULE_RENDER_CONTEXT,
): ProductRules {
  const renderBlock = (block: RuleBlock) => ({
    ...block,
    title: renderRuleText(block.title, context),
    bullets: block.bullets.map((bullet) => renderRuleText(bullet, context)),
  });

  return {
    constitution: rules.constitution.map(renderBlock),
    sortie: rules.sortie.map(renderBlock),
    deces: rules.deces.map(renderBlock),
  };
}

function isDevRuntime(): boolean {
  const nodeEnv = (
    globalThis as { process?: { env?: { NODE_ENV?: string } } }
  ).process?.env?.NODE_ENV;
  return nodeEnv !== 'production';
}

function warnLegacySplitId(productId: string): void {
  if (!isDevRuntime()) return;
  if (!LEGACY_SPLIT_IDS.has(productId)) return;
  if (WARNED_LEGACY_IDS.has(productId)) return;

  WARNED_LEGACY_IDS.add(productId);
  const split = CATALOG_PP_PM_SPLIT_MAP[productId as keyof typeof CATALOG_PP_PM_SPLIT_MAP];
  // Conserve l'alerte root-id legacy pour les anciens appels et fixtures.
  console.warn(
    `[base-contrat/rules] Legacy productId "${productId}" is deprecated. Use "${split.ppId}" or "${split.pmId}".`,
  );
}

/**
 * Retourne les règles fiscales pour un produit donné et une audience.
 * Garantit toujours un résultat non-null. S'il n'y a pas de règles, retourne un objet vide mais bien formé.
 */
export function getRules(
  productId: string,
  audience: Audience,
  context: RuleRenderContext = DEFAULT_RULE_RENDER_CONTEXT,
): ProductRules {
  warnLegacySplitId(productId);

  for (const resolver of RESOLVERS) {
    const rules = resolver(productId, audience);
    if (rules) {
      return renderRules(rules, context);
    }
  }
  return {
    constitution: [],
    sortie: [],
    deces: [],
  };
}

/**
 * Variante typée acceptant un CatalogProduct directement.
 */
export function getRulesForProduct(
  product: CatalogProduct,
  audience: Audience,
  context: RuleRenderContext = DEFAULT_RULE_RENDER_CONTEXT,
): ProductRules {
  return getRules(product.id, audience, context);
}

/**
 * true = le produit dispose de règles réelles.
 */
export function hasSocleRules(productId: string): boolean {
  for (const resolve of RESOLVERS) {
    const rules = resolve(productId, 'pp') ?? resolve(productId, 'pm');
    if (rules) return true;
  }
  return false;
}
