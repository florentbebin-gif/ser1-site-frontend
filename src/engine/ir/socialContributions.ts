import type { SocialContribResult } from './types';

interface PatrimonyCfg {
  totalRate?: number | string;
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
      psRateTotal: 0,
      psFoncier: 0,
      psDividends: 0,
      psTotal: 0,
    };
  }

  const psRateTotal = Number(patrimonyCfg.totalRate) || 0;

  const baseFoncier = Number(fonciersBase) || 0;
  const psFoncier = baseFoncier * (psRateTotal / 100);

  let psDividends = 0;
  const capWithPsNum = Number(capWithPs) || 0;
  if (capWithPsNum > 0) {
    psDividends = capWithPsNum * (psRateTotal / 100);
  }

  const psTotal = psFoncier + psDividends;

  return {
    psRateTotal,
    psFoncier,
    psDividends,
    psTotal,
  };
}
