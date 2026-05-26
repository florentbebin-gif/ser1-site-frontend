import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../../constants/settingsDefaults';
import { extractFiscalParams } from '../../engine/placement';
import {
  REFS,
  resolveRefs,
  toFiscalitySettingsV2,
} from '../../utils/cache/fiscalitySettingsAccess';
import psFixture from './fixtures/psSettingsV1.json';
import taxFixture from './fixtures/taxSettingsV1.json';

const EXPECTED_PARAMS = {
  pfuIR: 0.128,
  pfuPS: 0.186,
  pfuTotal: 0.314,
  psGeneral: 0.186,
  psException: 0.172,
  avAbattement8ansSingle: 4600,
  avAbattement8ansCouple: 9200,
  avSeuilPrimes150k: 150000,
  avTauxSousSeuil8ans: 0.075,
  avTauxSurSeuil8ans: 0.128,
  av990IAbattement: 152500,
  av990ITranche1Taux: 0.2,
  av990ITranche1Plafond: 700000,
  av990ITranche2Taux: 0.3125,
  av757BAbattement: 30500,
  peaAncienneteMin: 5,
  dividendesAbattementPercent: 0.4,
};

describe('fiscalitySettingsAccess', () => {
  it('conserve uniquement la structure V2 utile au runtime', () => {
    const withPersistedTransitionKeys = {
      ...DEFAULT_FISCALITY_SETTINGS,
      assuranceVie: { transition: true },
      perIndividuel: { transition: true },
      dividendes: { transition: true },
    };

    const normalized = toFiscalitySettingsV2(withPersistedTransitionKeys);

    expect(normalized.schemaVersion).toBe(2);
    expect(normalized.rulesetsByKey.assuranceVie).toBeDefined();
    expect(normalized.rulesetsByKey.perIndividuel).toBeDefined();
    expect(normalized).not.toHaveProperty('assuranceVie');
    expect(normalized).not.toHaveProperty('perIndividuel');
    expect(normalized).not.toHaveProperty('dividendes');
  });

  it('retombe sur le défaut V2 uniquement en absence de payload', () => {
    expect(toFiscalitySettingsV2(null)).toEqual(DEFAULT_FISCALITY_SETTINGS);
  });

  it('refuse explicitement un payload persisté non-V2', () => {
    expect(() => toFiscalitySettingsV2({})).toThrow(/schemaVersion 2/);
    expect(() => toFiscalitySettingsV2({ schemaVersion: 1 })).toThrow(/schemaVersion 2/);
  });

  it('résout les refs tax_settings et ps_settings', () => {
    const resolved = resolveRefs(
      { ir: REFS.pfuIR, ps: REFS.psGeneral, nested: [{ ps: REFS.pfuPS }] },
      taxFixture,
      psFixture,
    ) as Record<string, unknown>;

    expect(resolved.ir).toBe(12.8);
    expect(resolved.ps).toBe(18.6);
    expect(resolved.nested).toEqual([{ ps: 18.6 }]);
  });

  it('alimente extractFiscalParams depuis rulesetsByKey sans champs top-level historiques', () => {
    const normalized = toFiscalitySettingsV2(DEFAULT_FISCALITY_SETTINGS);
    const result = extractFiscalParams(normalized, psFixture, taxFixture);

    expect(result).toEqual(EXPECTED_PARAMS);
  });

  it('garde les paramètres courants avec les defaults runtime', () => {
    const result = extractFiscalParams(
      DEFAULT_FISCALITY_SETTINGS,
      DEFAULT_PS_SETTINGS,
      DEFAULT_TAX_SETTINGS,
    );

    expect(result.pfuIR).toBe(DEFAULT_TAX_SETTINGS.pfu.current.rateIR / 100);
    expect(result.psGeneral).toBeCloseTo(DEFAULT_PS_SETTINGS.patrimony.current.generalRate / 100);
  });
});
