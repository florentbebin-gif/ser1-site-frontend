/**
 * Snapshot baseline test for extractFiscalParams.
 *
 * This golden snapshot captures the exact output of extractFiscalParams()
 * when fed with the V1 fixtures (fiscalitySettings + psSettings).
 * Any future refactor (V2 migration, refs resolver, etc.) MUST produce
 * the same output to guarantee zero regression.
 */

import { describe, it, expect } from 'vitest';
import { extractFiscalParams } from '../../engine/placementEngine.js';
import fiscalityV1 from './fixtures/fiscalitySettingsV1.json';
import psV1 from './fixtures/psSettingsV1.json';

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

describe('extractFiscalParams â€” golden snapshot', () => {
  it('returns the expected params from V1 fixtures', () => {
    const result = extractFiscalParams(fiscalityV1, psV1);
    expect(result).toEqual(EXPECTED_SNAPSHOT);
  });

  it('returns defaults when both inputs are null', () => {
    const result = extractFiscalParams(null, null);
    expect(result).toEqual(EXPECTED_SNAPSHOT);
  });

  it('returns defaults when both inputs are empty objects', () => {
    const result = extractFiscalParams({}, {});
    expect(result).toEqual(EXPECTED_SNAPSHOT);
  });
});
