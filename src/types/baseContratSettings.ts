/**
 * Types for base_contrat_settings — Référentiel contrats V3
 *
 * Convention : camelCase partout (aligné avec le repo).
 * $ref format : "$ref:tax_settings.pfu.current.rateIR" (format repo existant).
 * Versioning : product.rulesets[] trié effectiveDate DESC ; rulesets[0] = version active.
 *
 * schemaVersion 1 → 2 : ajout métadonnées obligatoires (grandeFamille, nature, detensiblePP,
 * eligiblePM, souscriptionOuverte). Migration lazy dans getBaseContratSettings().
 *
 * schemaVersion 2 → 3 : passage à la taxonomie relationnelle SaaS.
 * Remplacement de nature par catalogKind, detensiblePP par directHoldable, eligiblePM par corporateHoldable.
 * Ajout de allowedWrappers.
 */

// ---------------------------------------------------------------------------
// Enums / unions
// ---------------------------------------------------------------------------

export type ProductFamily =
  | 'Assurance'
  | 'Bancaire'
  | 'Titres'
  | 'Immobilier'
  | 'Défiscalisation'
  | 'Autres';

/** V2/V3 — 13 grandes familles métier */
export type GrandeFamille =
  | 'Assurance'
  | 'Épargne bancaire'
  | 'Titres vifs'
  | 'Fonds/OPC'
  | 'Immobilier direct'
  | 'Immobilier indirect'
  | 'Crypto-actifs'
  | 'Non coté/PE'
  | 'Produits structurés'
  | 'Créances/Droits'
  | 'Dispositifs fiscaux immo'
  | 'Métaux précieux'
  | 'Retraite & épargne salariale';

/** V2 — Nature du produit (deprecated en V3, remplacé par CatalogKind) */
export type ProductNature =
  | 'Actif / instrument'
  | 'Contrat / compte / enveloppe'
  | 'Dispositif fiscal immobilier';

/** V3 — Taxonomie relationnelle (5 catégories strictes) */
export type CatalogKind =
  | 'wrapper'      // Enveloppes/Supports fiscaux (Assurance-vie, PEA, CTO)
  | 'asset'        // Actifs détenables en direct (Immo locatif, Titres vifs)
  | 'liability'    // Passif/Dettes (Crédit amortissable, in fine)
  | 'tax_overlay'  // Surcouches fiscales (Pinel, Malraux)
  | 'protection';  // Prévoyance/Assurances calculables

/** V2 — Éligibilité personnes morales (deprecated en V3, remplacé par corporateHoldable) */
export type EligiblePM = 'oui' | 'non' | 'parException';

/** V2/V3 — Souscription ouverte en 2026 */
export type SouscriptionOuverte = 'oui' | 'non' | 'na';

export type Holders = 'PP' | 'PM' | 'PP+PM';

export type ConfidenceLevel = 'confirmed' | 'provisional' | 'toVerify';

export type BlockKind = 'data' | 'note' | 'ref';

export type FieldType =
  | 'number'
  | 'boolean'
  | 'enum'
  | 'date'
  | 'string'
  | 'ref'
  | 'brackets';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface OfficialSource {
  label: string;
  url?: string | null;
  note?: string | null;
}

// ---------------------------------------------------------------------------
// Field definition inside a block payload
// ---------------------------------------------------------------------------

export interface FieldDef {
  type: FieldType;
  value: unknown;
  unit?: string;
  /** true if this field is consumed by a calculator */
  calc?: boolean;
  /** For type 'enum' — allowed values */
  options?: string[];
}

// ---------------------------------------------------------------------------
// Block (smallest UI unit inside a phase)
// ---------------------------------------------------------------------------

export interface Block {
  blockId: string;
  blockKind: BlockKind;
  uiTitle: string;
  audience: 'PP' | 'PM' | 'all';
  payload: Record<string, FieldDef>;
  dependencies?: string[];
  notes?: string | null;
  /** Ordre d'affichage dans la phase. Incrémental à la création (P1-03g). */
  sortOrder?: number;
}

// ---------------------------------------------------------------------------
// Phase (constitution / sortie / deces)
// ---------------------------------------------------------------------------

export interface Phase {
  applicable: boolean;
  blocks: Block[];
}

export interface Phases {
  constitution: Phase;
  sortie: Phase;
  deces: Phase;
}

// ---------------------------------------------------------------------------
// Versioned ruleset (one per effectiveDate)
// ---------------------------------------------------------------------------

export interface VersionedRuleset {
  effectiveDate: string; // ISO date "YYYY-MM-DD"
  phases: Phases;
  sources: OfficialSource[];
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export interface BaseContratProduct {
  id: string;
  label: string;

  // ── Métadonnées V3 (Obligatoires) ──
  grandeFamille: GrandeFamille;
  /** Taxonomie stricte (remplace nature) */
  catalogKind: CatalogKind;
  /** Détenable en direct par une personne physique (remplace detensiblePP) */
  directHoldable: boolean;
  /** Détenable par une personne morale (remplace eligiblePM) */
  corporateHoldable: boolean;
  /** Enveloppes autorisées si ce n'est pas un wrapper. Vide = direct uniquement. */
  allowedWrappers: string[];

  /** Souscription ouverte en 2026 */
  souscriptionOuverte: SouscriptionOuverte;
  /** Obligatoire si corporateHoldable === true par exception (legacy) */
  eligiblePMPrecision: string | null;
  /** Commentaire libre de qualification (optionnel) */
  commentaireQualification: string | null;

  // ── Champs legacy conservés pour compatibilité (V1/V2) ──
  /** @deprecated V2 — remplacé par catalogKind. Conserver pour la migration. */
  nature?: ProductNature;
  /** @deprecated V2 — remplacé par directHoldable. Conserver pour la migration. */
  detensiblePP?: boolean;
  /** @deprecated V2 — remplacé par corporateHoldable. Conserver pour la migration. */
  eligiblePM?: EligiblePM;
  /** @deprecated V1 — dérivé de grandeFamille. Conserver pour l'adapter. */
  family: ProductFamily;
  /** @deprecated V1 — dérivé de detensiblePP + eligiblePM. Conserver pour l'adapter. */
  holders: Holders;
  /** @deprecated V1 — dérivé de souscriptionOuverte. Conserver pour l'adapter. */
  open2026: boolean;

  envelopeType: string;
  sortOrder: number;
  isActive: boolean;
  closedDate: string | null;
  templateKey: string | null;
  confidenceLevel: ConfidenceLevel;
  todoToConfirm: string[];
  references: OfficialSource[];
  /** Sorted by effectiveDate DESC. rulesets[0] = version active. */
  rulesets: VersionedRuleset[];
}

// ---------------------------------------------------------------------------
// Product Test (Gate P0-10) — Imported JSON test cases
// ---------------------------------------------------------------------------

export interface ProductTest {
  id: string;
  productId: string;
  description: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  importedAt: string;
  importedBy: string;
}

// ---------------------------------------------------------------------------
// Top-level schema stored in base_contrat_settings.data
// ---------------------------------------------------------------------------

export interface BaseContratSettings {
  /** 1 = V1 (legacy), 2 = V2, 3 = V3 (Taxonomie relationnelle). Migration lazy dans getBaseContratSettings(). */
  schemaVersion: 1 | 2 | 3;
  products: BaseContratProduct[];
  /** Gate P0-10: imported tests — publication blocked if empty */
  tests?: ProductTest[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const EMPTY_PHASE: Phase = { applicable: false, blocks: [] };

export const EMPTY_PHASES: Phases = {
  constitution: { ...EMPTY_PHASE },
  sortie: { ...EMPTY_PHASE },
  deces: { ...EMPTY_PHASE },
};

export const EMPTY_RULESET: VersionedRuleset = {
  effectiveDate: new Date().toISOString().slice(0, 10),
  phases: {
    constitution: { applicable: false, blocks: [] },
    sortie: { applicable: false, blocks: [] },
    deces: { applicable: false, blocks: [] },
  },
  sources: [],
};

export const EMPTY_PRODUCT: Omit<BaseContratProduct, 'sortOrder'> = {
  id: '',
  label: '',
  // V3 métadonnées
  grandeFamille: 'Assurance',
  catalogKind: 'wrapper',
  directHoldable: true,
  corporateHoldable: false,
  allowedWrappers: [],
  eligiblePMPrecision: null,
  souscriptionOuverte: 'oui',
  commentaireQualification: null,
  // Legacy
  family: 'Autres',
  envelopeType: '',
  holders: 'PP',
  open2026: true,
  isActive: true,
  closedDate: null,
  templateKey: null,
  confidenceLevel: 'toVerify',
  todoToConfirm: [],
  references: [],
  rulesets: [],
};
