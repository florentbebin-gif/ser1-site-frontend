import type {
  DEFAULT_ASSURANCE_VIE_RULES,
  DEFAULT_CTO_RULES,
  DEFAULT_PEA_RULES,
  DEFAULT_PER_INDIVIDUEL_RULES} from '../../constants/settingsDefaults';
import {
  DEFAULT_FISCALITY_SETTINGS
} from '../../constants/settingsDefaults';
import type { FiscalitySettingsV2, Product, Ruleset, SettingsRef } from './fiscalitySettings';

export type FiscalityProductKey = 'assuranceVie' | 'perIndividuel' | 'cto' | 'pea';

type FiscalityRuleByKey = {
  assuranceVie: typeof DEFAULT_ASSURANCE_VIE_RULES;
  perIndividuel: typeof DEFAULT_PER_INDIVIDUEL_RULES;
  cto: typeof DEFAULT_CTO_RULES;
  pea: typeof DEFAULT_PEA_RULES;
};

export const REFS = {
  pfuIR: '$ref:tax_settings.pfu.current.rateIR' as SettingsRef,
  pfuPS: '$ref:ps_settings.patrimony.current.generalRate' as SettingsRef,
  psGeneral: '$ref:ps_settings.patrimony.current.generalRate' as SettingsRef,
  psException: '$ref:ps_settings.patrimony.current.exceptionRate' as SettingsRef,
} as const;

const DEFAULT_FISCALITY_V2 = DEFAULT_FISCALITY_SETTINGS as FiscalitySettingsV2;
const FALLBACK_PRODUCT: Product = {
  key: 'assuranceVie',
  label: 'Assurance-vie',
  holders: 'PP',
  nature: 'Assurance',
  isActive: true,
  sortOrder: 1,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeProduct(value: unknown, fallback: Product): Product {
  if (!isRecord(value)) return fallback;
  const product: Product = {
    key: asString(value.key, fallback.key),
    label: asString(value.label, fallback.label),
    holders: asString(value.holders, fallback.holders) as Product['holders'],
    nature: asString(value.nature, fallback.nature) as Product['nature'],
    isActive: asBoolean(value.isActive, fallback.isActive),
    sortOrder: asNumber(value.sortOrder, fallback.sortOrder),
  };
  const closedDate = typeof value.closedDate === 'string' ? value.closedDate : fallback.closedDate;
  if (closedDate) product.closedDate = closedDate;
  return product;
}

function normalizeProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) return DEFAULT_FISCALITY_V2.products;
  const products = value.map((item, index) =>
    normalizeProduct(item, DEFAULT_FISCALITY_V2.products[index] ?? FALLBACK_PRODUCT),
  );
  return products.length > 0 ? products : DEFAULT_FISCALITY_V2.products;
}

function normalizeRuleset(value: unknown, fallback: Ruleset): Ruleset {
  if (!isRecord(value)) return fallback;
  return {
    effectiveDate: asString(value.effectiveDate, fallback.effectiveDate),
    rules: isRecord(value.rules) ? value.rules : fallback.rules,
    sources: Array.isArray(value.sources) ? value.sources : fallback.sources,
  };
}

function normalizeRulesets(value: unknown): Record<string, Ruleset> {
  const defaults = DEFAULT_FISCALITY_V2.rulesetsByKey;
  if (!isRecord(value)) return defaults;

  const normalized: Record<string, Ruleset> = { ...defaults };
  for (const [key, fallback] of Object.entries(defaults)) {
    normalized[key] = normalizeRuleset(value[key], fallback);
  }
  return normalized;
}

export function toFiscalitySettingsV2(data: unknown): FiscalitySettingsV2 {
  if (data === DEFAULT_FISCALITY_SETTINGS) {
    return DEFAULT_FISCALITY_V2;
  }
  if (!isRecord(data) || data.schemaVersion !== 2) {
    return DEFAULT_FISCALITY_V2;
  }

  return {
    schemaVersion: 2,
    products: normalizeProducts(data.products),
    rulesetsByKey: normalizeRulesets(data.rulesetsByKey),
    _history: Array.isArray(data._history) ? data._history : [],
  };
}

export function getFiscalityRules<K extends FiscalityProductKey>(
  fiscality: FiscalitySettingsV2 | null | undefined,
  key: K,
): FiscalityRuleByKey[K] {
  const fallback = DEFAULT_FISCALITY_V2.rulesetsByKey[key]?.rules as FiscalityRuleByKey[K];
  const rules = fiscality?.rulesetsByKey?.[key]?.rules;
  return isRecord(rules) ? (rules as FiscalityRuleByKey[K]) : fallback;
}

export function buildFiscalityEngineSettings(
  fiscality: FiscalitySettingsV2 | null | undefined,
  taxSettings: Record<string, unknown> | null,
  psSettings: Record<string, unknown> | null,
) {
  return {
    assuranceVie: resolveRefs(
      getFiscalityRules(fiscality, 'assuranceVie'),
      taxSettings,
      psSettings,
    ),
    perIndividuel: resolveRefs(
      getFiscalityRules(fiscality, 'perIndividuel'),
      taxSettings,
      psSettings,
    ),
    dividendes: getFiscalityRules(fiscality, 'cto').dividendes,
    pea: resolveRefs(getFiscalityRules(fiscality, 'pea'), taxSettings, psSettings),
  };
}

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

function resolveOneRef(
  ref: SettingsRef,
  taxSettings: Record<string, unknown> | null,
  psSettings: Record<string, unknown> | null,
): unknown {
  const withoutPrefix = ref.slice(5);
  const dotIndex = withoutPrefix.indexOf('.');
  if (dotIndex === -1) return undefined;

  const table = withoutPrefix.slice(0, dotIndex);
  const path = withoutPrefix.slice(dotIndex + 1);
  const source =
    table === 'tax_settings' ? taxSettings : table === 'ps_settings' ? psSettings : null;

  return source ? getByPath(source, path) : undefined;
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
