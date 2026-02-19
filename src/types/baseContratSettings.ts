/**
 * Types for base_contrat_settings — Référentiel contrats V3
 *
 * Convention : camelCase partout (aligné avec le repo).
 * $ref format : "$ref:tax_settings.pfu.current.rateIR" (format repo existant).
 * Versioning : product.rulesets[] trié effectiveDate DESC ; rulesets[0] = version active.
 *
 * schemaVersion 1 → 2 : ajout métadonnées obligatoires (grandeFamille, nature, detensiblePP,
 * eligiblePM, souscriptionOuverte). Migration lazy dans getBaseContratSettings().
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

/** V2 — 13 grandes familles métier */
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

/** V2 — Nature du produit */
export type ProductNature =
  | 'Actif / instrument'
  | 'Contrat / compte / enveloppe'
  | 'Dispositif fiscal immobilier';

/** V2 — Éligibilité personnes morales */
export type EligiblePM = 'oui' | 'non' | 'parException';

/** V2 — Souscription ouverte en 2026 */
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

  // ── Métadonnées V2 (obligatoires à la création) ──
  grandeFamille: GrandeFamille;
  nature: ProductNature;
  /** Détenable en direct par une personne physique */
  detensiblePP: boolean;
  /** Éligibilité personnes morales */
  eligiblePM: EligiblePM;
  /** Obligatoire si eligiblePM === 'parException' */
  eligiblePMPrecision: string | null;
  /** Souscription ouverte en 2026 */
  souscriptionOuverte: SouscriptionOuverte;
  /** Commentaire libre de qualification (optionnel) */
  commentaireQualification: string | null;

  // ── Champs legacy conservés pour compatibilité baseContratAdapter.ts ──
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
  /** 1 = V1 (legacy), 2 = V2 (métadonnées obligatoires). Migration lazy dans getBaseContratSettings(). */
  schemaVersion: 1 | 2;
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
  // V2 métadonnées
  grandeFamille: 'Assurance',
  nature: 'Contrat / compte / enveloppe',
  detensiblePP: true,
  eligiblePM: 'non',
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
