/**
 * Tests for migrateV1toV2 + resolveRefs.
 *
 * Critical invariant: after migrate → resolve → extractFiscalParams,
 * the output MUST be identical to extractFiscalParams(v1, ps).
 */

import { describe, it, expect } from 'vitest';
import { migrateV1toV2, resolveRefs, REFS } from '../../utils/fiscalitySettingsMigrator';
import { extractFiscalParams } from '../../engine/placementEngine.js';
import fiscalityV1 from './fixtures/fiscalitySettingsV1.json';
import psV1 from './fixtures/psSettingsV1.json';
import taxV1 from './fixtures/taxSettingsV1.json';

// The golden snapshot from the baseline test
const EXPECTED_PARAMS = {
  pfuIR: 0.128,
  pfuPS: 0.172,
  pfuTotal: 0.3,
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

describe('migrateV1toV2', () => {
  it('converts V1 data to V2 structure', () => {
    const v2 = migrateV1toV2(fiscalityV1);
    expect(v2.schemaVersion).toBe(2);
    expect(v2.products).toHaveLength(4);
    expect(v2.products.map((p) => p.key)).toEqual([
      'assuranceVie', 'perIndividuel', 'cto', 'pea',
    ]);
    expect(v2.rulesetsByKey.assuranceVie).toBeDefined();
    expect(v2.rulesetsByKey.perIndividuel).toBeDefined();
    expect(v2.rulesetsByKey.cto).toBeDefined();
    expect(v2.rulesetsByKey.pea).toBeDefined();
  });

  it('preserves legacy toplevel keys for backward compat', () => {
    const v2 = migrateV1toV2(fiscalityV1);
    expect(v2.assuranceVie).toEqual(fiscalityV1.assuranceVie);
    expect(v2.perIndividuel).toEqual(fiscalityV1.perIndividuel);
    expect(v2.dividendes).toEqual(fiscalityV1.dividendes);
  });

  it('replaces PFU/PS values with $ref markers in rulesets', () => {
    const v2 = migrateV1toV2(fiscalityV1);
    const avRules = v2.rulesetsByKey.assuranceVie.rules as Record<string, any>;
    expect(avRules.retraitsCapital.psRatePercent).toBe(REFS.psPatrimoine);
    expect(avRules.retraitsCapital.depuis2017.moins8Ans.irRatePercent).toBe(REFS.pfuIR);

    const perRules = v2.rulesetsByKey.perIndividuel.rules as Record<string, any>;
    expect(perRules.sortieCapital.pfu.irRatePercent).toBe(REFS.pfuIR);
    expect(perRules.sortieCapital.pfu.psRatePercent).toBe(REFS.pfuPS);
  });

  it('is idempotent — re-migrating V2 returns same structure', () => {
    const v2 = migrateV1toV2(fiscalityV1);
    const v2Again = migrateV1toV2(v2);
    expect(v2Again).toEqual(v2);
  });

  it('handles null/undefined/empty gracefully', () => {
    expect(migrateV1toV2(null).schemaVersion).toBe(2);
    expect(migrateV1toV2(undefined).schemaVersion).toBe(2);
    expect(migrateV1toV2({}).schemaVersion).toBe(2);
  });
});

describe('resolveRefs', () => {
  it('resolves $ref:tax_settings paths', () => {
    const obj = { rate: REFS.pfuIR };
    const resolved = resolveRefs(obj, taxV1, psV1) as Record<string, unknown>;
    expect(resolved.rate).toBe(12.8);
  });

  it('resolves $ref:ps_settings paths', () => {
    const obj = { rate: REFS.psPatrimoine };
    const resolved = resolveRefs(obj, taxV1, psV1) as Record<string, unknown>;
    expect(resolved.rate).toBe(17.2);
  });

  it('resolves nested refs in arrays', () => {
    const obj = { items: [{ r: REFS.pfuIR }, { r: REFS.pfuPS }] };
    const resolved = resolveRefs(obj, taxV1, psV1) as any;
    expect(resolved.items[0].r).toBe(12.8);
    expect(resolved.items[1].r).toBe(17.2);
  });

  it('leaves non-ref values untouched', () => {
    const obj = { a: 42, b: 'hello', c: null, d: true };
    const resolved = resolveRefs(obj, taxV1, psV1);
    expect(resolved).toEqual(obj);
  });

  it('returns undefined for unresolvable refs', () => {
    const obj = { r: '$ref:tax_settings.does.not.exist' };
    const resolved = resolveRefs(obj, taxV1, psV1) as any;
    expect(resolved.r).toBeUndefined();
  });
});

describe('V2 round-trip: migrate → resolve → extractFiscalParams === V1 baseline', () => {
  it('snapshot diff = 0 via legacy fields (primary path)', () => {
    const v2 = migrateV1toV2(fiscalityV1);
    // extractFiscalParams reads the legacy toplevel keys, not rulesetsByKey
    const result = extractFiscalParams(v2, psV1);
    expect(result).toEqual(EXPECTED_PARAMS);
  });

  it('snapshot diff = 0 via resolved rulesets (future path)', () => {
    const v2 = migrateV1toV2(fiscalityV1);
    const resolvedRulesets = resolveRefs(v2.rulesetsByKey, taxV1, psV1) as Record<string, any>;
    // Build a "flat" object that looks like V1 for extractFiscalParams
    const flatForEngine = {
      assuranceVie: resolvedRulesets.assuranceVie?.rules,
      perIndividuel: resolvedRulesets.perIndividuel?.rules,
      dividendes: fiscalityV1.dividendes, // dividendes has no refs
    };
    const result = extractFiscalParams(flatForEngine, psV1);
    expect(result).toEqual(EXPECTED_PARAMS);
  });
});
