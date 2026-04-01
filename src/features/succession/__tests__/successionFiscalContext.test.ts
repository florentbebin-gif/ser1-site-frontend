import { describe, expect, it } from 'vitest';
import { DEFAULT_FISCALITY_SETTINGS, DEFAULT_TAX_SETTINGS } from '../../../constants/settingsDefaults';
import type { FiscalContext } from '../../../hooks/useFiscalContext';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';

function makeFiscalContext(overrides: Partial<FiscalContext>): FiscalContext {
  return {
    irScaleCurrent: DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
    irScalePrevious: DEFAULT_TAX_SETTINGS.incomeTax.scalePrevious,
    irCurrentYearLabel: DEFAULT_TAX_SETTINGS.incomeTax.currentYearLabel,
    irPreviousYearLabel: DEFAULT_TAX_SETTINGS.incomeTax.previousYearLabel,
    pfuRateIR: DEFAULT_TAX_SETTINGS.pfu.current.rateIR,
    psRateGeneral: 0,
    psRateException: 0,
    dmtgScaleLigneDirecte: DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
    dmtgAbattementEnfant: DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement,
    dmtgSettings: DEFAULT_TAX_SETTINGS.dmtg,
    passHistoryByYear: { 2024: 46368, 2025: 47100 },
    _raw_tax: DEFAULT_TAX_SETTINGS,
    _raw_ps: {} as FiscalContext['_raw_ps'],
    _raw_fiscality: DEFAULT_FISCALITY_SETTINGS,
    ...overrides,
  };
}

describe('buildSuccessionFiscalSnapshot', () => {
  it('retourne un snapshot par défaut quand fiscalContext est absent', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    expect(snapshot.dmtgSettings.ligneDirecte.abattement).toBe(100000);
    expect(snapshot.avDeces.agePivotPrimes).toBe(DEFAULT_FISCALITY_SETTINGS.assuranceVie.deces.agePivotPrimes);
    expect(snapshot.avDeces.primesApres1998.allowancePerBeneficiary).toBe(152500);
    expect(snapshot.avDeces.apres70ans.globalAllowance).toBe(30500);
    expect(snapshot.avDeces.primesApres1998.brackets).toEqual([
      { upTo: 700000, ratePercent: 20 },
      { upTo: null, ratePercent: 31.25 },
    ]);
    expect(snapshot.donation.rappelFiscalAnnees).toBe(15);
  });

  it('normalise donation et assurance-vie décès depuis les données brutes', () => {
    const fiscalContext = makeFiscalContext({
      _raw_tax: {
        ...DEFAULT_TAX_SETTINGS,
        donation: {
          rappelFiscalAnnees: 12,
          donFamilial790G: { montant: 50000, conditions: 'Condition custom' },
          donManuel: { abattementRenouvellement: 10 },
        },
      } as FiscalContext['_raw_tax'],
      _raw_fiscality: {
        ...DEFAULT_FISCALITY_SETTINGS,
        assuranceVie: {
          ...DEFAULT_FISCALITY_SETTINGS.assuranceVie,
          deces: {
            ...DEFAULT_FISCALITY_SETTINGS.assuranceVie.deces,
            agePivotPrimes: 68,
            primesApres1998: {
              allowancePerBeneficiary: 200000,
              brackets: [{ upTo: 900000, ratePercent: 25 }],
            },
            apres70ans: {
              globalAllowance: 40000,
              taxationMode: 'dmtg',
            },
          },
        },
      } as FiscalContext['_raw_fiscality'],
    });

    const snapshot = buildSuccessionFiscalSnapshot(fiscalContext);
    expect(snapshot.donation.rappelFiscalAnnees).toBe(12);
    expect(snapshot.donation.donFamilial790G.montant).toBe(50000);
    expect(snapshot.donation.donManuel.abattementRenouvellement).toBe(10);
    expect(snapshot.avDeces.agePivotPrimes).toBe(68);
    expect(snapshot.avDeces.primesApres1998.allowancePerBeneficiary).toBe(200000);
    expect(snapshot.avDeces.primesApres1998.brackets).toEqual([{ upTo: 900000, ratePercent: 25 }]);
    expect(snapshot.avDeces.apres70ans.globalAllowance).toBe(40000);
  });

  it('applique des fallback robustes sur les champs incomplets', () => {
    const fiscalContext = makeFiscalContext({
      _raw_tax: {
        ...DEFAULT_TAX_SETTINGS,
        donation: {
          rappelFiscalAnnees: -5,
          donFamilial790G: { montant: 'x' },
          donManuel: {},
        },
      } as FiscalContext['_raw_tax'],
      _raw_fiscality: {
        ...DEFAULT_FISCALITY_SETTINGS,
        assuranceVie: {
          ...DEFAULT_FISCALITY_SETTINGS.assuranceVie,
          deces: {
            ...DEFAULT_FISCALITY_SETTINGS.assuranceVie.deces,
            agePivotPrimes: 'abc',
            primesApres1998: { allowancePerBeneficiary: null, brackets: [] },
            apres70ans: { globalAllowance: undefined, taxationMode: '' },
          },
        },
      } as unknown as FiscalContext['_raw_fiscality'],
    });

    const snapshot = buildSuccessionFiscalSnapshot(fiscalContext);
    expect(snapshot.donation.rappelFiscalAnnees).toBe(0);
    expect(snapshot.donation.donFamilial790G.montant).toBe(31865);
    expect(snapshot.avDeces.agePivotPrimes).toBe(DEFAULT_FISCALITY_SETTINGS.assuranceVie.deces.agePivotPrimes);
    expect(snapshot.avDeces.primesApres1998.brackets).toEqual(
      DEFAULT_FISCALITY_SETTINGS.assuranceVie.deces.primesApres1998.brackets,
    );
    expect(snapshot.avDeces.apres70ans.taxationMode).toBe(
      DEFAULT_FISCALITY_SETTINGS.assuranceVie.deces.apres70ans.taxationMode,
    );
  });
});
