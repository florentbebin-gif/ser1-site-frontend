/**
 * Adapter: extracts the same 16 fiscal params from base_contrat_settings
 * that extractFiscalParams() produces from legacy V1 fiscality_settings.
 *
 * Golden snapshot contract: extractFromBaseContrat() MUST produce identical
 * output to extractFiscalParams() for the same underlying data.
 *
 * $ref resolution: refs like "$ref:tax_settings.pfu.current.rateIR" are
 * resolved against the provided taxSettings / psSettings objects.
 */

import type { BaseContratSettings, BaseContratProduct, VersionedRuleset, Block } from '../types/baseContratSettings';

// ---------------------------------------------------------------------------
// Default params (identical to placementEngine.js DEFAULT_FISCAL_PARAMS)
// ---------------------------------------------------------------------------

const DEFAULT_FISCAL_PARAMS = {
  pfuIR: 0.128,
  pfuPS: 0.172,
  pfuTotal: 0.30,
  psPatrimoine: 0.172,
  avAbattement8ansSingle: 4600,
  avAbattement8ansCouple: 9200,
  avSeuilPrimes150k: 150000,
  avTauxSousSeuil8ans: 0.075,
  avTauxSurSeuil8ans: 0.128,
  av990IAbattement: 152500,
  av990ITranche1Taux: 0.20,
  av990ITranche1Plafond: 700000,
  av990ITranche2Taux: 0.3125,
  av757BAbattement: 30500,
  peaAncienneteMin: 5,
  dividendesAbattementPercent: 0.40,
};

export type FiscalParams = typeof DEFAULT_FISCAL_PARAMS;

// ---------------------------------------------------------------------------
// $ref resolver (same logic as fiscalitySettingsMigrator.ts resolveOneRef)
// ---------------------------------------------------------------------------

function resolveRef(
  ref: string,
  taxSettings: Record<string, unknown> | null,
  psSettings: Record<string, unknown> | null,
): unknown {
  if (!ref.startsWith('$ref:')) return undefined;
  const withoutPrefix = ref.slice(5); // strip "$ref:"
  const dotIndex = withoutPrefix.indexOf('.');
  if (dotIndex === -1) return undefined;

  const table = withoutPrefix.slice(0, dotIndex);
  const path = withoutPrefix.slice(dotIndex + 1);

  let source: Record<string, unknown> | null = null;
  if (table === 'tax_settings') source = taxSettings;
  else if (table === 'ps_settings') source = psSettings;
  if (!source) return undefined;

  return getByPath(source, path);
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findProduct(settings: BaseContratSettings, productId: string): BaseContratProduct | undefined {
  return settings.products.find((p) => p.id === productId && p.isActive);
}

function getActiveRuleset(product: BaseContratProduct, _targetDate?: string): VersionedRuleset | null {
  if (!product.rulesets.length) return null;
  if (!_targetDate) return product.rulesets[0];
  return product.rulesets.find((r) => r.effectiveDate <= _targetDate) ?? null;
}

function findBlock(ruleset: VersionedRuleset, phaseKey: string, blockId: string): Block | undefined {
  const phase = (ruleset.phases as unknown as Record<string, { blocks: Block[] }>)[phaseKey];
  if (!phase) return undefined;
  return phase.blocks.find((b) => b.blockId === blockId);
}

function resolveFieldValue(
  block: Block | undefined,
  fieldKey: string,
  taxSettings: Record<string, unknown> | null,
  psSettings: Record<string, unknown> | null,
): unknown {
  if (!block) return undefined;
  const field = block.payload[fieldKey];
  if (!field) return undefined;
  if (field.type === 'ref' && typeof field.value === 'string') {
    return resolveRef(field.value, taxSettings, psSettings);
  }
  return field.value;
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  return undefined;
}

// ---------------------------------------------------------------------------
// Main adapter
// ---------------------------------------------------------------------------

export function extractFromBaseContrat(
  baseContrat: BaseContratSettings,
  taxSettings: Record<string, unknown> | null,
  psSettings: Record<string, unknown> | null,
  targetDate?: string,
): FiscalParams {
  const params = { ...DEFAULT_FISCAL_PARAMS };

  // PS patrimoine (external)
  const psRate = num(getByPath(psSettings ?? {}, 'patrimony.current.totalRate'));
  if (psRate != null) {
    params.psPatrimoine = psRate / 100;
    params.pfuPS = params.psPatrimoine;
  }

  // PFU IR (external)
  const pfuIrRate = num(getByPath(taxSettings ?? {}, 'pfu.current.rateIR'));
  if (pfuIrRate != null) {
    params.pfuIR = pfuIrRate / 100;
  }

  params.pfuTotal = params.pfuIR + params.pfuPS;

  // ── Assurance-vie ──
  const av = findProduct(baseContrat, 'assuranceVie');
  if (av) {
    const rs = getActiveRuleset(av, targetDate);
    if (rs) {
      // Sortie post-2017 ≥ 8 ans
      const gte8 = findBlock(rs, 'sortie', 'av-sortie-rachats-post2017-gte8');
      if (gte8) {
        const s = num(resolveFieldValue(gte8, 'abattementAnnuelSingle', taxSettings, psSettings));
        if (s != null) params.avAbattement8ansSingle = s;
        const c = num(resolveFieldValue(gte8, 'abattementAnnuelCouple', taxSettings, psSettings));
        if (c != null) params.avAbattement8ansCouple = c;
        const seuil = num(resolveFieldValue(gte8, 'seuilPrimesNettes', taxSettings, psSettings));
        if (seuil != null) params.avSeuilPrimes150k = seuil;
        const sous = num(resolveFieldValue(gte8, 'irRateUnderThresholdPercent', taxSettings, psSettings));
        if (sous != null) params.avTauxSousSeuil8ans = sous / 100;
        const sur = num(resolveFieldValue(gte8, 'irRateOverThresholdPercent', taxSettings, psSettings));
        if (sur != null) params.avTauxSurSeuil8ans = sur / 100;
      }

      // Décès 990 I
      const d990 = findBlock(rs, 'deces', 'av-deces-990I');
      if (d990) {
        const abat = num(resolveFieldValue(d990, 'abattementParBeneficiaire', taxSettings, psSettings));
        if (abat != null) params.av990IAbattement = abat;

        const brackets = resolveFieldValue(d990, 'brackets', taxSettings, psSettings);
        if (Array.isArray(brackets)) {
          if (brackets[0]?.ratePercent != null) {
            params.av990ITranche1Taux = brackets[0].ratePercent / 100;
            if (brackets[0].upTo != null) {
              params.av990ITranche1Plafond = brackets[0].upTo - params.av990IAbattement;
            }
          }
          if (brackets[1]?.ratePercent != null) {
            params.av990ITranche2Taux = brackets[1].ratePercent / 100;
          }
        }
      }

      // Décès 757 B
      const d757 = findBlock(rs, 'deces', 'av-deces-757B');
      if (d757) {
        const abat = num(resolveFieldValue(d757, 'abattementGlobal', taxSettings, psSettings));
        if (abat != null) params.av757BAbattement = abat;
      }
    }
  }

  // ── PEA ──
  const pea = findProduct(baseContrat, 'pea');
  if (pea) {
    const rs = getActiveRuleset(pea, targetDate);
    if (rs) {
      const anc = findBlock(rs, 'sortie', 'pea-sortie-anciennete');
      if (anc) {
        const v = num(resolveFieldValue(anc, 'ancienneteMinAns', taxSettings, psSettings));
        if (v != null) params.peaAncienneteMin = v;
      }
    }
  }

  // ── CTO ──
  const cto = findProduct(baseContrat, 'cto');
  if (cto) {
    const rs = getActiveRuleset(cto, targetDate);
    if (rs) {
      const div = findBlock(rs, 'sortie', 'cto-sortie-dividendes');
      if (div) {
        const v = num(resolveFieldValue(div, 'abattementBaremePercent', taxSettings, psSettings));
        if (v != null) params.dividendesAbattementPercent = v / 100;
      }
    }
  }

  return params;
}
