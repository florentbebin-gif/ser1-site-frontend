import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_ASSURANCE_VIE_RULES,
} from '@/constants/settingsDefaults';
import type { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
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
        ...DEFAULT_FISCALITY_SETTINGS,
        rulesetsByKey: {
          ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey,
          assuranceVie: {
            ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey.assuranceVie,
            rules: {
              ...DEFAULT_ASSURANCE_VIE_RULES,
              retraitsCapital: {
                ...DEFAULT_ASSURANCE_VIE_RULES.retraitsCapital,
                depuis2017: {},
              },
              deces: {
                ...DEFAULT_ASSURANCE_VIE_RULES.deces,
                primesApres1998: {},
                apres70ans: {},
              },
            },
          },
        },
      } as typeof DEFAULT_FISCALITY_SETTINGS,
    });

    expect(labels.pfu).toContain('PFU');
    expect(labels.ifiResidencePrincipaleAbattement).toContain('%');
    expect(labels.assuranceVie990IRates).not.toContain('à confirmer');
  });

  it("reprend l'abattement 990 I depuis les paramètres AV décès DMTG", () => {
    const labels = buildBaseContratFiscalLabels({
      _raw_fiscality: {
        ...DEFAULT_FISCALITY_SETTINGS,
        rulesetsByKey: {
          ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey,
          assuranceVie: {
            ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey.assuranceVie,
            rules: {
              ...DEFAULT_ASSURANCE_VIE_RULES,
              deces: {
                ...DEFAULT_ASSURANCE_VIE_RULES.deces,
                primesApres1998: {
                  ...DEFAULT_ASSURANCE_VIE_RULES.deces.primesApres1998,
                  allowancePerBeneficiary: 123456,
                },
              },
            },
          },
        },
      } as typeof DEFAULT_FISCALITY_SETTINGS,
    });

    expect(labels.assuranceVie990IAllowance.replace(/\u202f/g, ' ')).toBe(
      '123 456 € par bénéficiaire',
    );
  });

  it('AV rachat < 8 ans : PFU 30 % (12,8 % IR + 17,2 % PS), distinct du PFU générique 31,4 %', () => {
    const labels = buildBaseContratFiscalLabels();

    // Assurance-vie : taux PS propre (17,2 %) avant comme après 8 ans → total cohérent à 30 %.
    expect(labels.assuranceVieRachatMoins8Ans).toContain('PFU 30 %');
    expect(labels.assuranceVieRachatMoins8Ans).toContain('12,8 % IR');
    expect(labels.assuranceVieRachatMoins8Ans).toContain('17,2 % prélèvements sociaux');
    expect(labels.assuranceVieRachatMoins8Ans).not.toContain('31,4');
    expect(labels.assuranceVieRetraitsPs).toContain('17,2 %');

    // Le PFU générique (CTO/RCM) reste au taux général 2026 (18,6 % PS → 31,4 %).
    expect(labels.pfu).toContain('31,4 %');
  });
});
