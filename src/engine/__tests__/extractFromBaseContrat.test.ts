/**
 * Golden snapshot test for extractFromBaseContrat adapter.
 *
 * MUST produce the exact same 16 values as extractFiscalParams.test.ts
 * when fed with the AV template + fixture tax/ps settings.
 * This guarantees zero regression when switching from legacy V1 to base_contrat V3.
 */

import { describe, it, expect } from 'vitest';
import { extractFromBaseContrat } from '../../utils/baseContratAdapter';
import { buildTemplateRuleset } from '../../constants/baseContratTemplates';
import type { BaseContratSettings } from '../../types/baseContratSettings';
import taxV1 from './fixtures/taxSettingsV1.json';
import psV1 from './fixtures/psSettingsV1.json';

// Same expected values as extractFiscalParams.test.ts EXPECTED_SNAPSHOT
const EXPECTED_SNAPSHOT = {
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

const V2_DEFAULTS = {
  grandeFamille: 'Assurance' as const,
  nature: 'Contrat / compte / enveloppe' as const,
  detensiblePP: true,
  eligiblePM: 'non' as const,
  eligiblePMPrecision: null,
  souscriptionOuverte: 'oui' as const,
  commentaireQualification: null,

  // V3 required fields (kept even when schemaVersion=2 for compatibility tests)
  catalogKind: 'wrapper' as const,
  directHoldable: true,
  corporateHoldable: false,
  allowedWrappers: [],
};

function buildTestSettings(): BaseContratSettings {
  const date = '2025-01-01';
  return {
    schemaVersion: 2,
    products: [
      {
        ...V2_DEFAULTS,
        id: 'assuranceVie',
        label: 'Assurance-vie',
        grandeFamille: 'Assurance',
        family: 'Assurance',
        envelopeType: 'assurance-vie',
        holders: 'PP',
        open2026: true,
        sortOrder: 1,
        isActive: true,
        closedDate: null,
        templateKey: 'assurance-vie',
        confidenceLevel: 'confirmed',
        todoToConfirm: [],
        references: [],
        rulesets: [buildTemplateRuleset('assurance-vie', date)],
      },
      {
        ...V2_DEFAULTS,
        id: 'cto',
        label: 'CTO',
        grandeFamille: 'Titres vifs',
        family: 'Titres',
        envelopeType: 'cto',
        holders: 'PP',
        open2026: true,
        sortOrder: 2,
        isActive: true,
        closedDate: null,
        templateKey: 'cto',
        confidenceLevel: 'confirmed',
        todoToConfirm: [],
        references: [],
        rulesets: [buildTemplateRuleset('cto', date)],
      },
      {
        ...V2_DEFAULTS,
        id: 'pea',
        label: 'PEA',
        grandeFamille: 'Titres vifs',
        family: 'Titres',
        envelopeType: 'pea',
        holders: 'PP',
        open2026: true,
        sortOrder: 3,
        isActive: true,
        closedDate: null,
        templateKey: 'pea',
        confidenceLevel: 'confirmed',
        todoToConfirm: [],
        references: [],
        rulesets: [buildTemplateRuleset('pea', date)],
      },
      {
        ...V2_DEFAULTS,
        id: 'perIndividuel',
        label: 'PER individuel',
        grandeFamille: 'Retraite & épargne salariale',
        family: 'Assurance',
        envelopeType: 'per-individuel-assurance',
        holders: 'PP',
        open2026: true,
        sortOrder: 4,
        isActive: true,
        closedDate: null,
        templateKey: 'per-individuel-assurance',
        confidenceLevel: 'confirmed',
        todoToConfirm: [],
        references: [],
        rulesets: [buildTemplateRuleset('per-individuel-assurance', date)],
      },
    ],
  };
}

describe('extractFromBaseContrat — golden snapshot', () => {
  it('produces identical params to extractFiscalParams with fixture tax/ps', () => {
    const baseContrat = buildTestSettings();
    const result = extractFromBaseContrat(
      baseContrat,
      taxV1 as unknown as Record<string, unknown>,
      psV1 as unknown as Record<string, unknown>,
    );
    expect(result).toEqual(EXPECTED_SNAPSHOT);
  });

  it('returns defaults when base_contrat has no products', () => {
    const empty: BaseContratSettings = { schemaVersion: 1, products: [] };
    const result = extractFromBaseContrat(empty, null, null);
    expect(result).toEqual(EXPECTED_SNAPSHOT);
  });

  it('resolves $ref fields from tax/ps settings', () => {
    const baseContrat = buildTestSettings();
    const result = extractFromBaseContrat(
      baseContrat,
      taxV1 as unknown as Record<string, unknown>,
      psV1 as unknown as Record<string, unknown>,
    );
    // PFU IR comes from $ref:tax_settings.pfu.current.rateIR = 12.8 → 0.128
    expect(result.pfuIR).toBe(0.128);
    // PS patrimoine comes from $ref:ps_settings.patrimony.current.totalRate = 17.2 → 0.172
    expect(result.psPatrimoine).toBe(0.172);
  });
});
