import { describe, expect, it } from 'vitest';
import type {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../../../constants/settingsDefaults';
import { buildBaseContratFiscalLabels } from '../rules';

describe('buildBaseContratFiscalLabels', () => {
  it('supporte les bruts Supabase partiels sans planter', () => {
    const labels = buildBaseContratFiscalLabels({
      _raw_tax: {
        pfu: {},
        dmtg: {},
      } as typeof DEFAULT_TAX_SETTINGS,
      _raw_ps: {
        patrimony: {},
      } as typeof DEFAULT_PS_SETTINGS,
      _raw_fiscality: {
        assuranceVie: {
          retraitsCapital: {
            depuis2017: {},
          },
          deces: {
            primesApres1998: {},
            apres70ans: {},
          },
        },
      } as typeof DEFAULT_FISCALITY_SETTINGS,
    });

    expect(labels.pfu).toContain('PFU');
    expect(labels.ifiResidencePrincipaleAbattement).toContain('%');
    expect(labels.assuranceVie990IRates).not.toContain('à confirmer');
  });
});
