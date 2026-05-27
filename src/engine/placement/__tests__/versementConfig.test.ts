import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VERSEMENT_CONFIG,
  normalizeVersementConfig,
  type VersementConfigInput,
} from '../versementConfig';

describe('normalizeVersementConfig', () => {
  it('conserve la stratégie métier appréhender depuis distribution.strategie', () => {
    const config = normalizeVersementConfig({
      distribution: {
        strategie: 'apprehender',
      },
    });

    expect(config.distribution.strategie).toBe('apprehender');
  });

  it('conserve la stratégie métier réinvestissement depuis distribution.strategie', () => {
    const config = normalizeVersementConfig({
      distribution: {
        strategie: 'reinvestir_capi',
      },
    });

    expect(config.distribution.strategie).toBe('reinvestir_capi');
  });

  it('ignore les anciens champs initial.strategie et initial.reinvestirVers', () => {
    const legacyInput = {
      initial: {
        strategie: 'apprehender',
        reinvestirVers: 'distribution',
      },
    } as unknown as VersementConfigInput;

    const config = normalizeVersementConfig(legacyInput);

    expect(config.distribution.strategie).toBe(DEFAULT_VERSEMENT_CONFIG.distribution.strategie);
    expect(config.distribution.reinvestirVersAuTerme).toBe(
      DEFAULT_VERSEMENT_CONFIG.distribution.reinvestirVersAuTerme,
    );
  });
});
