import type { SocialContribResult } from './types';

interface PatrimonyCfg {
  generalRate?: number | string;
  exceptionRate?: number | string;
}

interface SocialContribInput {
  patrimonyCfg?: PatrimonyCfg | null;
  fonciersBase?: number;
  capWithPs?: number;
}

export function computeSocialContributions({
  patrimonyCfg,
  fonciersBase,
  capWithPs,
}: SocialContribInput): SocialContribResult {
  if (!patrimonyCfg) {
    return {
      psRateGeneral: 0,
      psRateException: 0,
      psFoncier: 0,
      psDividends: 0,
      psTotal: 0,
    };
  }

  const psRateGeneral = Number(patrimonyCfg.generalRate) || 0;
  const psRateException = Number(patrimonyCfg.exceptionRate) || 0;

  const baseFoncier = Number(fonciersBase) || 0;
  const psFoncier = baseFoncier * (psRateException / 100);

  let psDividends = 0;
  const capWithPsNum = Number(capWithPs) || 0;
  if (capWithPsNum > 0) {
    psDividends = capWithPsNum * (psRateGeneral / 100);
  }

  const psTotal = psFoncier + psDividends;

  return {
    psRateGeneral,
    psRateException,
    psFoncier,
    psDividends,
    psTotal,
  };
}
