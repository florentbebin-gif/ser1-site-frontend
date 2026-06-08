import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import { buildFiscalContext } from '@/hooks/useFiscalContext';
import { buildTresoFiscalParamsFromContext } from './tresorerieFiscalParams';

describe('buildTresoFiscalParamsFromContext', () => {
  it('alimente l’assiette sociale des dividendes TNS depuis socialDirigeant', () => {
    const taxSettings = {
      ...DEFAULT_TAX_SETTINGS,
      corporateTax: {
        ...DEFAULT_TAX_SETTINGS.corporateTax,
        current: {
          ...DEFAULT_TAX_SETTINGS.corporateTax.current,
          tnsDividendBasePct: 99,
        },
      },
    };
    const psSettings = structuredClone(DEFAULT_PS_SETTINGS);
    psSettings.socialDirigeant.current.dividends.tnsSocialBasePct = 12;

    const context = buildFiscalContext(taxSettings, psSettings, DEFAULT_FISCALITY_SETTINGS);
    const fiscalParams = buildTresoFiscalParamsFromContext(context);

    expect(fiscalParams.tnsDividendBasePct).toBeCloseTo(0.12);
  });
});
