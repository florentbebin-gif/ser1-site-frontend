import { describe, expect, it } from 'vitest';
import type { FiscalContext } from '@/hooks/useFiscalContext';
import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from './cache/fiscalSettingsCache';
import { buildFiscalIdentityCurrent } from './fiscalSettingsFingerprints';

function fiscalContextWithPass(passHistoryByYear: Record<number, number>): FiscalContext {
  return {
    _raw_tax: DEFAULT_TAX_SETTINGS,
    _raw_ps: DEFAULT_PS_SETTINGS,
    _raw_fiscality: DEFAULT_FISCALITY_SETTINGS,
    passHistoryByYear,
  } as unknown as FiscalContext;
}

const META = {
  taxUpdatedAt: '2026-01-01T00:00:00.000Z',
  psUpdatedAt: '2026-01-02T00:00:00.000Z',
  fiscalityUpdatedAt: '2026-01-03T00:00:00.000Z',
  passUpdatedAt: '2026-01-04T00:00:00.000Z',
};

describe('buildFiscalIdentityCurrent', () => {
  it("inclut l'historique PASS dans l'identité fiscale sans modifier les autres hashes", () => {
    const identityA = buildFiscalIdentityCurrent(fiscalContextWithPass({ 2025: 47_100 }), META);
    const identityB = buildFiscalIdentityCurrent(fiscalContextWithPass({ 2025: 48_000 }), META);

    expect(identityA.tax).toEqual(identityB.tax);
    expect(identityA.ps).toEqual(identityB.ps);
    expect(identityA.fiscality).toEqual(identityB.fiscality);
    expect(identityA.pass.updatedAt).toBe('2026-01-04T00:00:00.000Z');
    expect(identityA.pass.hash).not.toBe(identityB.pass.hash);
  });
});
