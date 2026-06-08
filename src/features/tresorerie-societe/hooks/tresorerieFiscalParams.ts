import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import type { FiscalContext } from '@/hooks/useFiscalContext';
import type { TresoFiscalParams } from '@/engine/tresorerie/types';

export function buildTresoFiscalParamsFromContext(fiscalContext: FiscalContext): TresoFiscalParams {
  const rawTax = fiscalContext._raw_tax ?? DEFAULT_TAX_SETTINGS;

  const corpCurrent = rawTax?.corporateTax?.current ?? DEFAULT_TAX_SETTINGS.corporateTax.current;
  const defaultsCorp = DEFAULT_TAX_SETTINGS.corporateTax.current;
  const socialDirigeant = fiscalContext.socialDirigeant ?? DEFAULT_PS_SETTINGS.socialDirigeant;
  const socialDirigeantCurrent =
    socialDirigeant.current ?? DEFAULT_PS_SETTINGS.socialDirigeant.current;

  const normalRate = (corpCurrent.normalRate ?? defaultsCorp.normalRate) / 100;
  const reducedRate = (corpCurrent.reducedRate ?? defaultsCorp.reducedRate) / 100;
  const reducedThreshold = corpCurrent.reducedThreshold ?? defaultsCorp.reducedThreshold;
  const tnsDividendBasePct =
    (socialDirigeantCurrent.dividends?.tnsSocialBasePct ??
      DEFAULT_PS_SETTINGS.socialDirigeant.current.dividends.tnsSocialBasePct) / 100;
  const maxDeductibleCcaInterestRate =
    (corpCurrent.maxDeductibleCcaInterestRate ?? defaultsCorp.maxDeductibleCcaInterestRate) / 100;
  const dividendesAbattement =
    (corpCurrent.dividendsAbatementPct ?? defaultsCorp.dividendsAbatementPct) / 100;
  const participationDisposalQpfcRate =
    (corpCurrent.participationDisposalQpfcPct ?? defaultsCorp.participationDisposalQpfcPct) / 100;

  const qpfc = corpCurrent.motherDaughterQpfc ?? defaultsCorp.motherDaughterQpfc;
  const standardQpfc = (qpfc.standard ?? defaultsCorp.motherDaughterQpfc.standard) / 100;
  const groupQpfc = (qpfc.group ?? defaultsCorp.motherDaughterQpfc.group) / 100;

  const pfuRateIR = (fiscalContext.pfuRateIR ?? DEFAULT_TAX_SETTINGS.pfu.current.rateIR) / 100;
  const psRate =
    (fiscalContext.psRateGeneral ?? DEFAULT_PS_SETTINGS.patrimony.current.generalRate) / 100;

  return {
    isNormalRate: normalRate,
    isReducedRate: reducedRate,
    isReducedThreshold: reducedThreshold,
    motherDaughterStandardQpfcRate: standardQpfc,
    motherDaughterGroupQpfcRate: groupQpfc,
    participationDisposalQpfcRate,
    pfuRateIR,
    psRate,
    pfuTotal: pfuRateIR + psRate,
    dividendesAbattement,
    irScale: fiscalContext.irScaleCurrent ?? DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
    tnsDividendBasePct,
    maxDeductibleCcaInterestRate,
  };
}
