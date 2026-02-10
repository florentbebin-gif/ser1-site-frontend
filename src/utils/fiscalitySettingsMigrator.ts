/**
 * fiscalitySettingsMigrator.ts
 *
 * Converts V1 fiscality_settings.data → V2 structure, and provides a resolver
 * that replaces $ref markers with actual values from tax_settings / ps_settings.
 *
 * Design rules:
 * - PFU / PS rates are NEVER stored in fiscality V2 rulesets.
 *   Instead, fields that used to carry those values now hold a $ref string
 *   (e.g. "$ref:tax_settings.pfu.current.rateIR").
 * - The resolver hydrates refs at read-time so extractFiscalParams sees
 *   plain numeric values, identical to V1.
 * - Legacy toplevel keys (assuranceVie, perIndividuel, dividendes) are
 *   preserved so extractFiscalParams continues to work unchanged.
 */

import type {
  FiscalitySettingsV1,
  FiscalitySettingsV2,
  Product,
  Ruleset,
  SettingsRef,
} from '../types/fiscalitySettings';

// ---------------------------------------------------------------------------
// Default product catalogue
// ---------------------------------------------------------------------------
const DEFAULT_PRODUCTS: Product[] = [
  { key: 'assuranceVie', label: 'Assurance-vie', category: 'PP', isActive: true, sortOrder: 1 },
  { key: 'perIndividuel', label: 'PER Individuel', category: 'PP', isActive: true, sortOrder: 2 },
  { key: 'cto', label: 'Compte-titres ordinaire', category: 'PP', isActive: true, sortOrder: 3 },
  { key: 'pea', label: "Plan d'Épargne en Actions", category: 'PP', isActive: true, sortOrder: 4 },
];

// ---------------------------------------------------------------------------
// $ref constants — canonical paths into tax_settings / ps_settings
// ---------------------------------------------------------------------------
export const REFS = {
  pfuIR: '$ref:tax_settings.pfu.current.rateIR' as SettingsRef,
  pfuPS: '$ref:tax_settings.pfu.current.rateSocial' as SettingsRef,
  psPatrimoine: '$ref:ps_settings.patrimony.current.totalRate' as SettingsRef,
} as const;

// ---------------------------------------------------------------------------
// migrateV1toV2
// ---------------------------------------------------------------------------

/**
 * Migrates a V1 fiscality_settings blob to V2 structure.
 * If already V2, returns as-is.
 * Pure function — does not mutate the input.
 */
export function migrateV1toV2(data: unknown): FiscalitySettingsV2 {
  if (!data || typeof data !== 'object') {
    return buildEmptyV2();
  }

  const obj = data as Record<string, unknown>;

  // Already V2 — pass through
  if (obj.schemaVersion === 2) {
    return data as FiscalitySettingsV2;
  }

  const v1 = data as FiscalitySettingsV1;

  // Build AV ruleset from V1 assuranceVie (strip PFU/PS, replace with refs)
  const avRules = buildAvRules(v1.assuranceVie);
  const perRules = buildPerRules(v1.perIndividuel);
  const ctoRules = buildCtoRules();
  const peaRules = buildPeaRules();

  const rulesetsByKey: Record<string, Ruleset> = {
    assuranceVie: { effectiveDate: '2025-01-01', rules: avRules, sources: [] },
    perIndividuel: { effectiveDate: '2025-01-01', rules: perRules, sources: [] },
    cto: { effectiveDate: '2025-01-01', rules: ctoRules, sources: [] },
    pea: { effectiveDate: '2025-01-01', rules: peaRules, sources: [] },
  };

  return {
    schemaVersion: 2,
    products: [...DEFAULT_PRODUCTS],
    rulesetsByKey,
    _history: [],
    // Legacy fields preserved for extractFiscalParams compatibility
    assuranceVie: v1.assuranceVie as Record<string, unknown> | undefined,
    perIndividuel: v1.perIndividuel as Record<string, unknown> | undefined,
    dividendes: v1.dividendes as Record<string, unknown> | undefined,
  };
}

// ---------------------------------------------------------------------------
// resolveRefs — hydrate $ref markers with real values
// ---------------------------------------------------------------------------

/**
 * Deep-walks an object and replaces any string value matching "$ref:..."
 * with the resolved value from taxSettings or psSettings.
 * Returns a new object (no mutation).
 */
export function resolveRefs(
  obj: unknown,
  taxSettings: Record<string, unknown> | null,
  psSettings: Record<string, unknown> | null,
): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' && obj.startsWith('$ref:')) {
    return resolveOneRef(obj as SettingsRef, taxSettings, psSettings);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveRefs(item, taxSettings, psSettings));
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveRefs(val, taxSettings, psSettings);
    }
    return result;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveOneRef(
  ref: SettingsRef,
  taxSettings: Record<string, unknown> | null,
  psSettings: Record<string, unknown> | null,
): unknown {
  // "$ref:tax_settings.pfu.current.rateIR" → table="tax_settings", path="pfu.current.rateIR"
  const withoutPrefix = ref.slice(5); // strip "$ref:"
  const dotIndex = withoutPrefix.indexOf('.');
  if (dotIndex === -1) return undefined;

  const table = withoutPrefix.slice(0, dotIndex);
  const path = withoutPrefix.slice(dotIndex + 1);

  const source = table === 'tax_settings' ? taxSettings : table === 'ps_settings' ? psSettings : null;
  if (!source) return undefined;

  return getByPath(source, path);
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function buildEmptyV2(): FiscalitySettingsV2 {
  return {
    schemaVersion: 2,
    products: [...DEFAULT_PRODUCTS],
    rulesetsByKey: {},
    _history: [],
  };
}

function buildAvRules(av: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!av) return {};
  const rules = deepClone(av);
  // Replace PFU/PS rate values with refs
  setByPath(rules, 'retraitsCapital.psRatePercent', REFS.psPatrimoine);
  setByPath(rules, 'retraitsCapital.depuis2017.moins8Ans.irRatePercent', REFS.pfuIR);
  setByPath(rules, 'retraitsCapital.depuis2017.plus8Ans.irRateOverThresholdPercent', REFS.pfuIR);
  return rules;
}

function buildPerRules(per: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!per) return {};
  const rules = deepClone(per);
  // Replace PFU rates with refs
  setByPath(rules, 'sortieCapital.pfu.irRatePercent', REFS.pfuIR);
  setByPath(rules, 'sortieCapital.pfu.psRatePercent', REFS.pfuPS);
  return rules;
}

function buildCtoRules(): Record<string, unknown> {
  return {
    pfu: {
      irRatePercent: REFS.pfuIR,
      psRatePercent: REFS.pfuPS,
    },
  };
}

function buildPeaRules(): Record<string, unknown> {
  return {
    ancienneteMinAns: 5,
    exonerationIRApresAnciennete: true,
    psRatePercent: REFS.psPatrimoine,
  };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
      return; // path does not exist — do not create it
    }
    current = current[part] as Record<string, unknown>;
  }
  const lastPart = parts[parts.length - 1];
  if (lastPart in current) {
    current[lastPart] = value;
  }
}
