import type { FiscalContext } from '@/hooks/useFiscalContext';

export interface PerAbattementConfig {
  plafond?: number | string | null;
  plancher?: number | string | null;
}

export interface PerPotentielFiscalSettings {
  taxSettings: FiscalContext['_raw_tax'];
  psSettings: FiscalContext['_raw_ps'];
  passHistory: FiscalContext['passHistoryByYear'];
  abat10SalCfgCurrent: PerAbattementConfig;
  abat10RetCfgCurrent: PerAbattementConfig;
}

export function derivePerPotentielFiscalSettings(
  fiscalContext: FiscalContext,
): PerPotentielFiscalSettings {
  const abat10CfgRoot = fiscalContext._raw_tax?.incomeTax?.abat10 ?? {};

  return {
    taxSettings: fiscalContext._raw_tax,
    psSettings: fiscalContext._raw_ps,
    passHistory: fiscalContext.passHistoryByYear,
    abat10SalCfgCurrent: abat10CfgRoot.current ?? {},
    abat10RetCfgCurrent: abat10CfgRoot.retireesCurrent ?? {},
  };
}
