/**
 * fiscalitySettings.ts — Types for the V2 fiscality settings schema.
 *
 * Design rules:
 * - PFU / PS rates are NEVER stored here. They live in tax_settings and
 *   ps_settings respectively. Fields that previously duplicated those values
 *   now carry a `$ref` string pointing to the canonical table + path.
 * - The `schemaVersion` field distinguishes V1 (legacy flat) from V2.
 * - `sources` are stored per-ruleset but NOT displayed to standard users.
 */

// ---------------------------------------------------------------------------
// Ref marker — a string like "$ref:tax_settings.pfu.current.rateIR"
// Resolved at runtime by the resolver before consumption by engines.
// ---------------------------------------------------------------------------
export type SettingsRef = `$ref:${'tax_settings' | 'ps_settings'}.${string}`;

// ---------------------------------------------------------------------------
// Source (official reference, admin-only visibility)
// ---------------------------------------------------------------------------
export interface OfficialSource {
  label: string;           // e.g. "CGI Art. 125-0 A"
  url?: string;            // e.g. legifrance URL
  note?: string;           // free text
}

// ---------------------------------------------------------------------------
// Product catalogue entry
// ---------------------------------------------------------------------------
export type ProductHolders = 'PP' | 'PM' | 'PP+PM';
export type ProductNature =
  | 'Assurance'
  | 'Bancaire'
  | 'Titres'
  | 'Immobilier'
  | 'D\u00e9fiscalisation'
  | 'Autres';

export interface Product {
  key: string;             // stable slug, e.g. "assuranceVie" — immutable after creation
  label: string;           // display label, e.g. "Assurance-vie"
  holders: ProductHolders; // PP = personne physique, PM = personne morale
  nature: ProductNature;   // catégorie fonctionnelle
  isActive: boolean;
  sortOrder: number;
  closedDate?: string;     // ISO date — set when product is closed
  /** @deprecated kept for backward compat with existing data */
  category?: 'PP' | 'PM';
}

// ---------------------------------------------------------------------------
// Ruleset per product
// ---------------------------------------------------------------------------
export interface Ruleset {
  effectiveDate: string;   // ISO date, e.g. "2025-01-01"
  rules: Record<string, unknown>;  // product-specific rule tree
  sources: OfficialSource[];
}

// ---------------------------------------------------------------------------
// History entry (auto-generated on save)
// ---------------------------------------------------------------------------
export interface HistoryEntry {
  savedAt: string;         // ISO timestamp
  savedBy: string;         // email or user id
  diff?: string;           // human-readable diff summary
}

// ---------------------------------------------------------------------------
// Top-level V2 schema stored in fiscality_settings.data
// ---------------------------------------------------------------------------
export interface FiscalitySettingsV2 {
  schemaVersion: 2;
  products: Product[];
  rulesetsByKey: Record<string, Ruleset>;
  _history?: HistoryEntry[];

  // Legacy fields kept during transition so extractFiscalParams still works
  // until the adapter is fully wired. They will be populated by the migrator.
  assuranceVie?: Record<string, unknown>;
  perIndividuel?: Record<string, unknown>;
  dividendes?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// V1 schema (current production shape in fiscality_settings.data)
// ---------------------------------------------------------------------------
export interface FiscalitySettingsV1 {
  schemaVersion?: undefined | 1;
  assuranceVie?: Record<string, unknown>;
  perIndividuel?: Record<string, unknown>;
  dividendes?: Record<string, unknown>;
  [key: string]: unknown;
}

export type FiscalitySettings = FiscalitySettingsV1 | FiscalitySettingsV2;
