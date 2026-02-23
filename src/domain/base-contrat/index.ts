/**
 * domain/base-contrat/index.ts
 *
 * Point d'entrée public du domaine base-contrat.
 * PR1 — 100% additive.
 */

export type {
  CatalogKind,
  GrandeFamille,
} from './types';

export type { CatalogProduct } from './catalog';
export { CATALOG, CATALOG_BY_ID, getCatalogProduct } from './catalog';

export type { BaseContratOverride, OverrideMap } from './overrides';
export { isProductClosed } from './overrides';
