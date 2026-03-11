import type { CapitalBasesResult } from './types';

interface CapitalBasesInput {
  capWithPs?: number;
  capWithoutPs?: number;
  modeCap: 'bareme' | 'pfu';
}

interface PfuYearCfg {
  rateIR?: number;
}

interface TaxSettingsWithPfu {
  pfu?: Record<string, PfuYearCfg>;
}

interface PfuIrInput {
  capitalBasePfu: number;
  yearKey: string;
  taxSettings?: TaxSettingsWithPfu | null;
}

export function computeCapitalBases({ capWithPs, capWithoutPs, modeCap }: CapitalBasesInput): CapitalBasesResult {
  const capWithPsNum = Number(capWithPs) || 0;
  const capWithoutPsNum = Number(capWithoutPs) || 0;
  const capTotal = capWithPsNum + capWithoutPsNum;

  let capitalBaseBareme = 0;
  let capitalBasePfu = 0;

  if (modeCap === 'bareme') {
    capitalBaseBareme = capTotal * 0.6;
  } else {
    capitalBasePfu = capTotal;
  }

  return { capTotal, capitalBaseBareme, capitalBasePfu };
}

export function computePfuIr({ capitalBasePfu, yearKey, taxSettings }: PfuIrInput): number {
  const base = Number(capitalBasePfu) || 0;
  if (base <= 0) return 0;

  const pfuCfg = taxSettings?.pfu && taxSettings.pfu[yearKey] ? taxSettings.pfu[yearKey] : null;
  const pfuRateIR = pfuCfg ? Number(pfuCfg.rateIR) || 12.8 : 12.8;

  return base * (pfuRateIR / 100);
}
