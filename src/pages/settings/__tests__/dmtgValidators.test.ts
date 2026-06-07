import { describe, expect, it } from 'vitest';
import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import { validateCorporateTaxSettings, validateImpotsSettings } from '../validators/dmtgValidators';

describe('validateImpotsSettings', () => {
  it('bloque les seuils CDHR et IFI invalides', () => {
    const settings = {
      ...DEFAULT_TAX_SETTINGS,
      cdhr: {
        ...DEFAULT_TAX_SETTINGS.cdhr,
        current: {
          ...DEFAULT_TAX_SETTINGS.cdhr.current,
          thresholdSingle: -1,
          thresholdCouple: -2,
        },
      },
      ifi: {
        current: {
          ...DEFAULT_TAX_SETTINGS.ifi.current,
          threshold: -1,
          residencePrincipaleAbattementRate: 110,
        },
      },
    };

    const errors = validateImpotsSettings(settings);

    expect(errors['cdhr.current.thresholdSingle']).toBe('La valeur doit être positive.');
    expect(errors['cdhr.current.thresholdCouple']).toBe('La valeur doit être positive.');
    expect(errors['ifi.current.threshold']).toBe('La valeur doit être positive.');
    expect(errors['ifi.current.residencePrincipaleAbattementRate']).toBe(
      'Le taux doit être entre 0 et 100.',
    );
  });
});

describe('validateCorporateTaxSettings', () => {
  it('bloque les seuils IS réduits invalides', () => {
    const corporateTax = {
      ...DEFAULT_TAX_SETTINGS.corporateTax,
      current: {
        ...DEFAULT_TAX_SETTINGS.corporateTax.current,
        reducedThreshold: -1,
      },
      previous: {
        ...DEFAULT_TAX_SETTINGS.corporateTax.previous,
        reducedThreshold: -2,
      },
    };

    const errors = validateCorporateTaxSettings(corporateTax);

    expect(errors['corporateTax.current.reducedThreshold']).toBe('La valeur doit être positive.');
    expect(errors['corporateTax.previous.reducedThreshold']).toBe('La valeur doit être positive.');
  });
});
