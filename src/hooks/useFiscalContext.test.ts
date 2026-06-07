import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import { buildFiscalContext } from './useFiscalContext';

describe('buildFiscalContext', () => {
  it('normalise IFI et CDHR depuis tax_settings', () => {
    const ifiScale = [
      { from: 0, to: 1_300_000, rate: 0 },
      { from: 1_300_000, to: null, rate: 0.7 },
    ];
    const taxSettings = {
      ...DEFAULT_TAX_SETTINGS,
      ifi: {
        current: {
          ...DEFAULT_TAX_SETTINGS.ifi.current,
          threshold: 1_450_000,
          residencePrincipaleAbattementRate: 25,
          scale: ifiScale,
        },
      },
      cdhr: {
        current: {
          ...DEFAULT_TAX_SETTINGS.cdhr.current,
          minEffectiveRate: 21,
          thresholdSingle: 270_000,
          thresholdCouple: 520_000,
        },
        previous: {
          ...DEFAULT_TAX_SETTINGS.cdhr.previous,
          minEffectiveRate: 20,
        },
      },
    };

    const context = buildFiscalContext(
      taxSettings,
      DEFAULT_PS_SETTINGS,
      DEFAULT_FISCALITY_SETTINGS,
    );

    expect(context.ifi.current.threshold).toBe(1_450_000);
    expect(context.ifi.current.residencePrincipaleAbattementRate).toBe(25);
    expect(context.ifi.current.scale).toEqual(ifiScale);
    expect(context.cdhr.current).toEqual(
      expect.objectContaining({
        minEffectiveRate: 21,
        thresholdSingle: 270_000,
        thresholdCouple: 520_000,
      }),
    );
    expect(context.cdhr.previous.minEffectiveRate).toBe(20);
  });

  it('conserve les fallbacks IFI et CDHR si le blob Supabase est partiel', () => {
    const taxSettings = {
      ...DEFAULT_TAX_SETTINGS,
      ifi: {
        current: {
          threshold: 1_500_000,
        },
      },
      cdhr: {
        current: {
          thresholdSingle: 260_000,
        },
      },
    } as unknown as typeof DEFAULT_TAX_SETTINGS;

    const context = buildFiscalContext(
      taxSettings,
      DEFAULT_PS_SETTINGS,
      DEFAULT_FISCALITY_SETTINGS,
    );

    expect(context.ifi.current.threshold).toBe(1_500_000);
    expect(context.ifi.current.scale).toBe(DEFAULT_TAX_SETTINGS.ifi.current.scale);
    expect(context.cdhr.current.thresholdSingle).toBe(260_000);
    expect(context.cdhr.current.minEffectiveRate).toBe(
      DEFAULT_TAX_SETTINGS.cdhr.current.minEffectiveRate,
    );
    expect(context.cdhr.previous).toEqual(DEFAULT_TAX_SETTINGS.cdhr.previous);
  });
});
