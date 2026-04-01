/**
 * domain/base-contrat/rules/index.ts
 *
 * Point d'entrée du référentiel des règles fiscales par produit (PR5).
 *
 * Exports publics :
 *   getRules(productId, audience) → ProductRules  (jamais null/undefined)
 *   getRulesForProduct(product, audience) → ProductRules
 *   hasSocleRules(productId) → boolean  (false = pas de règles)
 */

import type { Audience, ProductRules } from './types';
import type { CatalogProduct } from '../catalog';
import { CATALOG_PP_PM_SPLIT_MAP } from '../catalog';

import { getAssuranceEpargneRules } from './library/assurance-epargne';
import { getEpargneBancaireRules } from './library/epargne-bancaire';
import { getRetraiteRules } from './library/retraite';
import { getImmobilierRules } from './library/immobilier';
import { getPrevoyanceRules } from './library/prevoyance';
import { getValeursMobilieresRules } from './library/valeurs-mobilieres';
import { getAutresRules } from './library/autres';
import { getFiscauxImmobilierRules } from './library/fiscaux-immobilier';

export type { ProductRules, RuleBlock, Audience, Confidence, RuleSource } from './types';
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

function sanitizeRuleText(text: string): string {
  let next = text;

  const replacements: Array<[RegExp, string]> = [
    [/PFU\s*\d+(?:[,.]\d+)?\s*%(?:\s*\([^)]*\))?/gi, 'PFU'],
    [/flat tax\s*\d+(?:[,.]\d+)?\s*%/gi, 'PFU'],
    [/prélèvements sociaux\s*:?\s*\d+(?:[,.]\d+)?\s*%/gi, 'prélèvements sociaux'],
    [/PS\s*\d+(?:[,.]\d+)?\s*%/gi, 'prélèvements sociaux'],
    [/abattement de\s*\d+(?:[,.]\d+)?\s*%/gi, 'abattement legal'],
    [/abattement forfaitaire de\s*\d+(?:[,.]\d+)?\s*%/gi, 'abattement forfaitaire'],
    [/réduction d'IR de\s*\d+(?:[,.]\d+)?\s*%/gi, "reduction d'IR"],
    [/exonération de\s*\d+(?:[,.]\d+)?\s*%/gi, 'exoneration partielle'],
    [/taxe de\s*\d+(?:[,.]\d+)?\s*%/gi, 'taxe forfaitaire'],
    [/taux IR réduit à\s*\d+(?:[,.]\d+)?\s*%/gi, 'taux IR reduit'],
    [/taux IR de\s*\d+(?:[,.]\d+)?\s*%/gi, 'taux IR'],
    [/IR\s*\d+(?:[,.]\d+)?\s*%\s*\+\s*prélèvements sociaux\s*\d+(?:[,.]\d+)?\s*%/gi, 'IR + prelevements sociaux'],
    [/\d+(?:[,.]\d+)?\s*%/g, ''],
  ];

  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }

  return next
    .replace(/\s{2,}/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.')
    .replace(/\s+:/g, ':')
    .replace(/ :/g, ':')
    .trim();
}

function sanitizeRules(rules: ProductRules): ProductRules {
  const sanitizeBlock = (block: ProductRules['constitution'][number]) => ({
    ...block,
    title: sanitizeRuleText(block.title),
    bullets: block.bullets.map(sanitizeRuleText),
  });

  return {
    constitution: rules.constitution.map(sanitizeBlock),
    sortie: rules.sortie.map(sanitizeBlock),
    deces: rules.deces.map(sanitizeBlock),
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
  // Keep the legacy root-id warning path for backward compatibility with older callers and fixtures.
  console.warn(
    `[base-contrat/rules] Legacy productId "${productId}" is deprecated. Use "${split.ppId}" or "${split.pmId}".`,
  );
}

/**
 * Retourne les règles fiscales pour un produit donné et une audience.
 * Garantit toujours un résultat non-null. S'il n'y a pas de règles, retourne un objet vide mais bien formé.
 */
export function getRules(productId: string, audience: Audience): ProductRules {
  warnLegacySplitId(productId);

  for (const resolver of RESOLVERS) {
    const rules = resolver(productId, audience);
    if (rules) {
      return sanitizeRules(rules);
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
): ProductRules {
  return getRules(product.id, audience);
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
