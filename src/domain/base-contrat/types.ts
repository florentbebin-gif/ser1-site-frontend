/**
 * domain/base-contrat/types.ts
 *
 * Point d'entrée unique pour les types Base-Contrat dans le domain/.
 * Re-exporte les types canoniques depuis src/types/baseContratSettings.ts
 * sans créer de modèle parallèle divergent.
 *
 * Garde-fou PR1 : 100% additive, aucun type nouveau ici.
 * Les types seront simplifiés en PR2/PR3 une fois l'UI migrée.
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
} from '@/types/baseContratSettings';

export {
  EMPTY_PHASE,
  EMPTY_PHASES,
  EMPTY_RULESET,
  EMPTY_PRODUCT,
} from '@/types/baseContratSettings';
