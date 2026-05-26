import type { FiscalContext } from '@/hooks/useFiscalContext';
import { fingerprintSettingsData } from './export/exportFingerprint';

export interface FiscalIdentityCurrent {
  tax: { updatedAt: string | null; hash: string };
  ps: { updatedAt: string | null; hash: string };
  fiscality: { updatedAt: string | null; hash: string };
  pass: { updatedAt: string | null; hash: string };
}

export interface FiscalIdentityMeta {
  taxUpdatedAt: string | null;
  psUpdatedAt: string | null;
  fiscalityUpdatedAt: string | null;
  passUpdatedAt: string | null;
}

export function buildFiscalIdentityCurrent(
  fiscalContext: FiscalContext,
  fiscalMeta: FiscalIdentityMeta,
): FiscalIdentityCurrent {
  return {
    tax: {
      updatedAt: fiscalMeta.taxUpdatedAt,
      hash: fingerprintSettingsData(fiscalContext._raw_tax),
    },
    ps: {
      updatedAt: fiscalMeta.psUpdatedAt,
      hash: fingerprintSettingsData(fiscalContext._raw_ps),
    },
    fiscality: {
      updatedAt: fiscalMeta.fiscalityUpdatedAt,
      hash: fingerprintSettingsData(fiscalContext._raw_fiscality),
    },
    pass: {
      updatedAt: fiscalMeta.passUpdatedAt,
      hash: fingerprintSettingsData(fiscalContext.passHistoryByYear),
    },
  };
}
