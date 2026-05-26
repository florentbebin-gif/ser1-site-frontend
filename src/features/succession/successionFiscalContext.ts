import {
  DEFAULT_ASSURANCE_VIE_RULES,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '../../constants/settingsDefaults';
import type { FiscalContext } from '../../hooks/useFiscalContext';
import { getFiscalityRules } from '../../utils/cache/fiscalitySettingsAccess';
import type { FiscalitySettingsV2 } from '../../utils/cache/fiscalitySettings';

type DmtgSettings = typeof DEFAULT_TAX_SETTINGS.dmtg;
type DonationSettings = typeof DEFAULT_TAX_SETTINGS.donation;

export interface SuccessionDonationSettings {
  rappelFiscalAnnees: number;
  donFamilial790G: {
    montant: number;
    conditions: string;
  };
}

export interface SuccessionAvDecesSettings {
  agePivotPrimes: number;
  primesApres1998: {
    allowancePerBeneficiary: number;
    brackets: Array<{ upTo: number | null; ratePercent: number }>;
  };
  apres70ans: {
    globalAllowance: number;
    taxationMode: string;
  };
}

export interface SuccessionFiscalSnapshot {
  dmtgSettings: DmtgSettings;
  donation: SuccessionDonationSettings;
  avDeces: SuccessionAvDecesSettings;
}

interface LooseTaxSettings extends Record<string, unknown> {
  dmtg?: DmtgSettings;
  donation?: Partial<DonationSettings>;
}

interface LooseAssuranceVieRules extends Record<string, unknown> {
  deces?: {
    agePivotPrimes?: unknown;
    primesApres1998?: {
      allowancePerBeneficiary?: unknown;
      brackets?: Array<{ upTo?: unknown; ratePercent?: unknown }>;
    };
    apres70ans?: {
      globalAllowance?: unknown;
      taxationMode?: unknown;
    };
  };
}

const DEFAULT_DONATION = DEFAULT_TAX_SETTINGS.donation;

function asNumberOr(input: unknown, fallback: number): number {
  const numeric = Number(input);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, numeric);
}

function asStringOr(input: unknown, fallback: string): string {
  return typeof input === 'string' && input.trim().length > 0 ? input : fallback;
}

function normalizeBrackets(
  input: unknown,
  fallback: Array<{ upTo: number | null; ratePercent: number }>,
): Array<{ upTo: number | null; ratePercent: number }> {
  if (!Array.isArray(input)) return fallback;
  const normalized = input
    .map((row) => ({
      upTo: row?.upTo == null ? null : asNumberOr(row.upTo, 0),
      ratePercent: asNumberOr(row?.ratePercent, 0),
    }))
    .filter((row) => row.ratePercent >= 0);

  return normalized.length > 0 ? normalized : fallback;
}

export function buildSuccessionFiscalSnapshot(
  fiscalContext: FiscalContext | null | undefined,
): SuccessionFiscalSnapshot {
  const tax = (fiscalContext?._raw_tax ?? DEFAULT_TAX_SETTINGS) as LooseTaxSettings;
  const fiscality = (fiscalContext?._raw_fiscality ?? DEFAULT_FISCALITY_SETTINGS) as
    | FiscalitySettingsV2
    | null
    | undefined;

  const donationRaw = tax.donation;
  const assuranceVieRules = getFiscalityRules(fiscality, 'assuranceVie') as LooseAssuranceVieRules;
  const avDecesRaw = assuranceVieRules.deces;

  const defaultAvDeces = DEFAULT_ASSURANCE_VIE_RULES.deces;
  const default990I = defaultAvDeces.primesApres1998;
  const default757B = defaultAvDeces.apres70ans;

  return {
    dmtgSettings: fiscalContext?.dmtgSettings ?? tax.dmtg ?? DEFAULT_TAX_SETTINGS.dmtg,
    donation: {
      rappelFiscalAnnees: asNumberOr(
        donationRaw?.rappelFiscalAnnees,
        DEFAULT_DONATION.rappelFiscalAnnees,
      ),
      donFamilial790G: {
        montant: asNumberOr(
          donationRaw?.donFamilial790G?.montant,
          DEFAULT_DONATION.donFamilial790G.montant,
        ),
        conditions: asStringOr(
          donationRaw?.donFamilial790G?.conditions,
          DEFAULT_DONATION.donFamilial790G.conditions,
        ),
      },
    },
    avDeces: {
      agePivotPrimes: asNumberOr(avDecesRaw?.agePivotPrimes, defaultAvDeces.agePivotPrimes),
      primesApres1998: {
        allowancePerBeneficiary: asNumberOr(
          avDecesRaw?.primesApres1998?.allowancePerBeneficiary,
          default990I.allowancePerBeneficiary,
        ),
        brackets: normalizeBrackets(avDecesRaw?.primesApres1998?.brackets, default990I.brackets),
      },
      apres70ans: {
        globalAllowance: asNumberOr(
          avDecesRaw?.apres70ans?.globalAllowance,
          default757B.globalAllowance,
        ),
        taxationMode: asStringOr(avDecesRaw?.apres70ans?.taxationMode, default757B.taxationMode),
      },
    },
  };
}
