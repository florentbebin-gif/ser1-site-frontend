/**
 * Types for base_contrat_settings — Référentiel contrats V3
 *
 * Convention : camelCase partout (aligné avec le repo).
 * $ref format : "$ref:tax_settings.pfu.current.rateIR" (format repo existant).
 * Versioning : product.rulesets[] trié effectiveDate DESC ; rulesets[0] = version active.
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
  family: ProductFamily;
  envelopeType: string;
  holders: Holders;
  open2026: boolean;
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
// Top-level schema stored in base_contrat_settings.data
// ---------------------------------------------------------------------------

export interface BaseContratSettings {
  schemaVersion: 1;
  products: BaseContratProduct[];
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
