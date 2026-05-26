import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ASSURANCE_VIE_RULES,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import {
  normalizeDmtgTaxSettingsForLoad,
  validateDmtgFiscalityPayload,
  validateDmtgTaxPayload,
} from '../dmtgSettingsSchema';

describe('schéma DMTG settings', () => {
  it('normalise le format legacy abattementLigneDirecte + scale', () => {
    const legacyScale = [{ from: 0, to: null, rate: 20 }];
    const result = normalizeDmtgTaxSettingsForLoad({
      dmtg: {
        abattementLigneDirecte: 120_000,
        scale: legacyScale,
      },
      donation: DEFAULT_TAX_SETTINGS.donation,
    });

    expect(result?.dmtg).toEqual({
      ligneDirecte: {
        abattement: 120_000,
        scale: legacyScale,
      },
      frereSoeur: DEFAULT_TAX_SETTINGS.dmtg.frereSoeur,
      neveuNiece: DEFAULT_TAX_SETTINGS.dmtg.neveuNiece,
      autre: DEFAULT_TAX_SETTINGS.dmtg.autre,
    });
    expect(result?.dmtg).not.toHaveProperty('abattementLigneDirecte');
    expect(result?.dmtg).not.toHaveProperty('scale');
  });

  it('complète les catégories manquantes d’un format courant partiel', () => {
    const result = normalizeDmtgTaxSettingsForLoad({
      dmtg: {
        ligneDirecte: DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte,
      },
    });

    expect(result?.dmtg?.ligneDirecte).toEqual(DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte);
    expect(result?.dmtg?.frereSoeur).toEqual(DEFAULT_TAX_SETTINGS.dmtg.frereSoeur);
    expect(result?.dmtg?.neveuNiece).toEqual(DEFAULT_TAX_SETTINGS.dmtg.neveuNiece);
    expect(result?.dmtg?.autre).toEqual(DEFAULT_TAX_SETTINGS.dmtg.autre);
  });

  it('refuse un payload tax_settings DMTG non canonique à l’écriture', () => {
    const payload = {
      ...DEFAULT_TAX_SETTINGS,
      dmtg: {
        ...DEFAULT_TAX_SETTINGS.dmtg,
        ligneDirecte: {
          ...DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte,
          abattement: null,
        },
      },
    };

    const result = validateDmtgTaxPayload(payload);

    expect(result.success).toBe(false);
  });

  it('refuse un payload fiscality_settings assurance-vie décès non canonique à l’écriture', () => {
    const payload = {
      ...DEFAULT_FISCALITY_SETTINGS,
      rulesetsByKey: {
        ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey,
        assuranceVie: {
          ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey.assuranceVie,
          rules: {
            ...DEFAULT_ASSURANCE_VIE_RULES,
            deces: {
              ...DEFAULT_ASSURANCE_VIE_RULES.deces,
              apres70ans: {
                ...DEFAULT_ASSURANCE_VIE_RULES.deces.apres70ans,
                globalAllowance: null,
              },
            },
          },
        },
      },
    };

    const result = validateDmtgFiscalityPayload(payload);

    expect(result.success).toBe(false);
  });
});
