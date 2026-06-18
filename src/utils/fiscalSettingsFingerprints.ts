import type { FiscalContext } from '@/hooks/useFiscalContext';
import { fingerprintSettingsData } from './export/exportFingerprint';

export interface FiscalIdentityEntry {
  updatedAt: string | null;
  hash: string;
}

export interface FiscalIdentityCurrent {
  tax: FiscalIdentityEntry;
  ps: FiscalIdentityEntry;
  fiscality: FiscalIdentityEntry;
  pass: FiscalIdentityEntry;
  memento: FiscalIdentityEntry;
}

const EMPTY_FISCAL_IDENTITY_ENTRY: FiscalIdentityEntry = { updatedAt: null, hash: '' };

export interface FiscalIdentityMeta {
  taxUpdatedAt: string | null;
  psUpdatedAt: string | null;
  fiscalityUpdatedAt: string | null;
  passUpdatedAt: string | null;
}

export function buildFiscalIdentityCurrent(
  fiscalContext: FiscalContext,
  fiscalMeta: FiscalIdentityMeta,
  mementoIdentity: FiscalIdentityEntry = EMPTY_FISCAL_IDENTITY_ENTRY,
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
    // Identité de la base mémento, fournie hors `useFiscalContext` (cf. useMementoIdentity).
    memento: { updatedAt: mementoIdentity.updatedAt, hash: mementoIdentity.hash },
  };
}
