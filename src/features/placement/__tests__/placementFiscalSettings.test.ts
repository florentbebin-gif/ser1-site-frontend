import { describe, expect, it, vi } from 'vitest';
import * as placementEngine from '@/engine/placement';
import {
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_PER_INDIVIDUEL_RULES,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import type { FiscalContext } from '@/hooks/useFiscalContext';
import { derivePlacementSettingsFromFiscalContext } from '@/hooks/usePlacementSettings';

function makeFiscalContext(overrides: Partial<FiscalContext>): FiscalContext {
  return {
    irScaleCurrent: DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
    irScalePrevious: DEFAULT_TAX_SETTINGS.incomeTax.scalePrevious,
    irCurrentYearLabel: DEFAULT_TAX_SETTINGS.incomeTax.currentYearLabel,
    irPreviousYearLabel: DEFAULT_TAX_SETTINGS.incomeTax.previousYearLabel,
    pfuRateIR: DEFAULT_TAX_SETTINGS.pfu.current.rateIR,
    psRateGeneral: DEFAULT_PS_SETTINGS.patrimony.current.generalRate,
    psRateException: DEFAULT_PS_SETTINGS.patrimony.current.exceptionRate,
    rvtoTaxableFractionByAge:
      DEFAULT_PER_INDIVIDUEL_RULES.rente.rvtoTaxableFractionByAgeAtFirstPayment,
    psRateRenteInterests:
      DEFAULT_PER_INDIVIDUEL_RULES.rente.deduits.interestsQuotePart.psRatePercent / 100,
    psRateRenteCapitalCASA:
      DEFAULT_PER_INDIVIDUEL_RULES.rente.deduits.capitalQuotePart.psRatePercent / 100,
    abat10Rate: DEFAULT_PER_INDIVIDUEL_RULES.rente.pensionAbatementRatePercent / 100,
    abat10RetireesCurrent: DEFAULT_TAX_SETTINGS.incomeTax.abat10.retireesCurrent,
    psRetirementBrackets: DEFAULT_PS_SETTINGS.retirement.current.brackets,
    psRateRetirementDefault:
      Math.max(
        ...DEFAULT_PS_SETTINGS.retirement.current.brackets.map((bracket) => bracket.totalRate),
      ) / 100,
    smallAnnuityMonthlyCapitalExitThreshold:
      DEFAULT_PER_INDIVIDUEL_RULES.sortieCapital.retraite.petiteRente.monthlyThreshold,
    smallAnnuityAnnualCapitalExitThreshold:
      DEFAULT_PER_INDIVIDUEL_RULES.sortieCapital.retraite.petiteRente.monthlyThreshold * 12,
    smallAnnuityCapitalExitFlatTaxRate:
      DEFAULT_PER_INDIVIDUEL_RULES.sortieCapital.retraite.petiteRente.forfaitIrRatePercent / 100,
    smallAnnuityCapitalExitFlatTaxAbatementRate:
      DEFAULT_PER_INDIVIDUEL_RULES.sortieCapital.retraite.petiteRente.forfaitAbatementRatePercent /
      100,
    dmtgScaleLigneDirecte: DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.scale,
    dmtgAbattementEnfant: DEFAULT_TAX_SETTINGS.dmtg.ligneDirecte.abattement,
    dmtgSettings: DEFAULT_TAX_SETTINGS.dmtg,
    corporateTax: DEFAULT_TAX_SETTINGS.corporateTax,
    ifi: DEFAULT_TAX_SETTINGS.ifi,
    cdhr: DEFAULT_TAX_SETTINGS.cdhr,
    passHistoryByYear: { 2025: 47100 },
    _raw_tax: DEFAULT_TAX_SETTINGS,
    _raw_ps: DEFAULT_PS_SETTINGS,
    _raw_fiscality: DEFAULT_FISCALITY_SETTINGS,
    ...overrides,
  };
}

describe('derivePlacementSettingsFromFiscalContext', () => {
  it('produit des options TMI dédupliquées et triées depuis le barème IR normalisé', () => {
    const fiscalContext = makeFiscalContext({
      irScaleCurrent: [
        { from: 0, to: 10, rate: 19, deduction: 0 },
        { from: 11, to: 20, rate: 7, deduction: 0 },
        { from: 21, to: 40, rate: 19, deduction: 0 },
        { from: 41, to: null, rate: 43, deduction: 0 },
      ],
    });

    const settings = derivePlacementSettingsFromFiscalContext(fiscalContext);

    expect(settings.baremIR).toBe(fiscalContext.irScaleCurrent);
    expect(settings.tmiOptions).toEqual([
      { value: 0.07, label: '7 %' },
      { value: 0.19, label: '19 %' },
      { value: 0.43, label: '43 %' },
    ]);
  });

  it('projette le DMTG depuis les clés normalisées du dossier fiscal', () => {
    const dmtgScale = [
      { from: 0, to: 12_000, rate: 6 },
      { from: 12_000, to: null, rate: 24 },
    ];
    const fiscalContext = makeFiscalContext({
      dmtgAbattementEnfant: 123_456,
      dmtgScaleLigneDirecte: dmtgScale,
    });

    const settings = derivePlacementSettingsFromFiscalContext(fiscalContext);

    expect(settings.fiscalParams.dmtgAbattementLigneDirecte).toBe(123_456);
    expect(settings.fiscalParams.dmtgScale).toBe(dmtgScale);
  });

  it('transmet les trois tables brutes a extractFiscalParams', () => {
    const rawFiscality = {
      ...DEFAULT_FISCALITY_SETTINGS,
      rulesetsByKey: {
        ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey,
        cto: {
          ...DEFAULT_FISCALITY_SETTINGS.rulesetsByKey.cto,
          rules: { dividendes: { abattementBaremePercent: 38 } },
        },
      },
    } as FiscalContext['_raw_fiscality'];
    const rawPs = {
      ...DEFAULT_PS_SETTINGS,
      patrimony: {
        ...DEFAULT_PS_SETTINGS.patrimony,
        current: {
          ...DEFAULT_PS_SETTINGS.patrimony.current,
          generalRate: 18,
        },
      },
    } as FiscalContext['_raw_ps'];
    const rawTax = {
      ...DEFAULT_TAX_SETTINGS,
      pfu: {
        ...DEFAULT_TAX_SETTINGS.pfu,
        current: { rateIR: 9 },
      },
    } as FiscalContext['_raw_tax'];
    const spy = vi.spyOn(placementEngine, 'extractFiscalParams');
    const fiscalContext = makeFiscalContext({
      _raw_fiscality: rawFiscality,
      _raw_ps: rawPs,
      _raw_tax: rawTax,
    });

    try {
      derivePlacementSettingsFromFiscalContext(fiscalContext);

      expect(spy).toHaveBeenCalledWith(rawFiscality, rawPs, rawTax);
    } finally {
      spy.mockRestore();
    }
  });
});
