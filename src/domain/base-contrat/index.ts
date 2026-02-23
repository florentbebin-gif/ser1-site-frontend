/**
 * domain/base-contrat/index.ts
 *
 * Point d'entrée public du domaine base-contrat.
 * PR1 — 100% additive.
 */

export type {
  ProductFamily,
  GrandeFamille,
  ProductNature,
  CatalogKind,
  EligiblePM,
  SouscriptionOuverte,
  Holders,
  ConfidenceLevel,
  BlockKind,
  FieldType,
  OfficialSource,
  FieldDef,
  Block,
  Phase,
  Phases,
  VersionedRuleset,
  BaseContratProduct,
  ProductTest,
  BaseContratSettings,
} from './types';

export {
  EMPTY_PHASE,
  EMPTY_PHASES,
  EMPTY_RULESET,
  EMPTY_PRODUCT,
} from './types';

export type { CatalogProduct } from './catalog';
export { CATALOG, CATALOG_BY_ID, getCatalogProduct } from './catalog';

export type { BaseContratOverride, OverrideMap } from './overrides';
export { isProductClosed } from './overrides';
