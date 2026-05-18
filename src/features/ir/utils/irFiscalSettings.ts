import type { FiscalContext } from '@/hooks/useFiscalContext';

export type IrTaxSettings = FiscalContext['_raw_tax'];
export type IrPsSettings = FiscalContext['_raw_ps'];

export interface IrFiscalSettings {
  taxSettings: IrTaxSettings;
  psSettings: IrPsSettings;
}

export function deriveIrFiscalSettings(fiscalContext: FiscalContext): IrFiscalSettings {
  return {
    taxSettings: fiscalContext._raw_tax,
    psSettings: fiscalContext._raw_ps,
  };
}
