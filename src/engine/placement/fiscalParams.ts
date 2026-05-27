import {
  DEFAULT_FISCAL_PARAMS,
  REQUIRED_NUMERIC_FISCAL_KEYS,
  clamp,
  roundDecimal,
  toDecimalPercent,
} from './shared';
import type { FiscalParams } from './types';
import { buildFiscalityEngineSettings } from '../../utils/cache/fiscalitySettingsAccess';
import type { FiscalitySettingsV2 } from '../../utils/cache/fiscalitySettings';

interface Bracket {
  ratePercent: number;
  upTo?: number | null;
}

interface FlatFiscalitySettings {
  assuranceVie?: {
    retraitsCapital?: {
      depuis2017?: {
        moins8Ans?: { irRatePercent?: number };
        plus8Ans?: {
          abattementAnnuel?: { single?: number; couple?: number };
          primesNettesSeuil?: number;
          irRateUnderThresholdPercent?: number;
          irRateOverThresholdPercent?: number;
        };
      };
    };
    deces?: {
      primesApres1998?: {
        allowancePerBeneficiary?: number;
        brackets?: Bracket[];
      };
      apres70ans?: { globalAllowance?: number };
    };
  };
  dividendes?: { abattementBaremePercent?: number };
  pea?: { ancienneteMinYears?: number };
}

type FiscalitySettings = FlatFiscalitySettings | FiscalitySettingsV2;
type NumericFiscalParamKey = keyof typeof DEFAULT_FISCAL_PARAMS;

interface PsSettingsForExtract {
  patrimony?: {
    current?: {
      generalRate?: number;
      exceptionRate?: number;
    };
  };
}

interface TaxSettingsForExtract {
  pfu?: {
    current?: { rateIR?: number };
  };
}

let hasWarnedMissingFiscalParams = false;
const REQUIRED_FISCAL_PARAM_KEYS = REQUIRED_NUMERIC_FISCAL_KEYS as readonly NumericFiscalParamKey[];

function hasRulesetsByKey(value: unknown): value is FiscalitySettingsV2 {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    (value as { schemaVersion?: unknown }).schemaVersion === 2 &&
    'rulesetsByKey' in value
  );
}

function normalizeFiscalitySettings(
  fiscalitySettings: FiscalitySettings | null | undefined,
  taxSettings: TaxSettingsForExtract | null | undefined,
  psSettings: PsSettingsForExtract | null | undefined,
): FlatFiscalitySettings | null | undefined {
  if (!hasRulesetsByKey(fiscalitySettings)) return fiscalitySettings;
  return buildFiscalityEngineSettings(
    fiscalitySettings,
    taxSettings as Record<string, unknown> | null,
    psSettings as Record<string, unknown> | null,
  ) as FlatFiscalitySettings;
}

function getParam(params: Partial<Record<NumericFiscalParamKey, number>>, key: string): number {
  const fiscalKey = key as NumericFiscalParamKey;
  return params[fiscalKey] ?? DEFAULT_FISCAL_PARAMS[fiscalKey] ?? 0;
}

export function extractFiscalParams(
  fiscalitySettings: FiscalitySettings | null | undefined,
  psSettings: PsSettingsForExtract | null | undefined,
  taxSettings?: TaxSettingsForExtract | null,
): FiscalParams {
  const params: Record<NumericFiscalParamKey, number> = { ...DEFAULT_FISCAL_PARAMS };
  const normalizedFiscality = normalizeFiscalitySettings(
    fiscalitySettings,
    taxSettings,
    psSettings,
  );

  if (psSettings?.patrimony?.current?.generalRate != null) {
    params.psGeneral = toDecimalPercent(psSettings.patrimony.current.generalRate);
  }
  if (psSettings?.patrimony?.current?.exceptionRate != null) {
    params.psException = toDecimalPercent(psSettings.patrimony.current.exceptionRate);
  }

  params.pfuPS = getParam(params, 'psGeneral');
  params.pfuTotal = roundDecimal(getParam(params, 'pfuIR') + getParam(params, 'pfuPS'));

  const pfuRateIR = taxSettings?.pfu?.current?.rateIR;
  if (typeof pfuRateIR === 'number') {
    params.pfuIR = toDecimalPercent(pfuRateIR);
    params.pfuTotal = roundDecimal(getParam(params, 'pfuIR') + getParam(params, 'pfuPS'));
  }

  const av = normalizedFiscality?.assuranceVie;
  if (av) {
    const retraitsCapital = av.retraitsCapital;
    const depuis2017 = retraitsCapital?.depuis2017;
    if (depuis2017?.plus8Ans) {
      const plus8Ans = depuis2017.plus8Ans;
      if (plus8Ans.abattementAnnuel?.single)
        params.avAbattement8ansSingle = plus8Ans.abattementAnnuel.single;
      if (plus8Ans.abattementAnnuel?.couple)
        params.avAbattement8ansCouple = plus8Ans.abattementAnnuel.couple;
      if (plus8Ans.primesNettesSeuil) params.avSeuilPrimes150k = plus8Ans.primesNettesSeuil;
      if (plus8Ans.irRateUnderThresholdPercent)
        params.avTauxSousSeuil8ans = toDecimalPercent(plus8Ans.irRateUnderThresholdPercent);
      if (plus8Ans.irRateOverThresholdPercent)
        params.avTauxSurSeuil8ans = toDecimalPercent(plus8Ans.irRateOverThresholdPercent);
    }
    if (depuis2017?.moins8Ans?.irRatePercent && typeof pfuRateIR !== 'number') {
      params.pfuIR = toDecimalPercent(depuis2017.moins8Ans.irRatePercent);
      params.pfuTotal = roundDecimal(getParam(params, 'pfuIR') + getParam(params, 'pfuPS'));
    }

    const deces = av.deces;
    if (deces?.primesApres1998) {
      if (deces.primesApres1998.allowancePerBeneficiary) {
        params.av990IAbattement = deces.primesApres1998.allowancePerBeneficiary;
      }
      if (deces.primesApres1998.brackets?.[0]) {
        params.av990ITranche1Taux = toDecimalPercent(deces.primesApres1998.brackets[0].ratePercent);
        if (deces.primesApres1998.brackets[0].upTo) {
          params.av990ITranche1Plafond = deces.primesApres1998.brackets[0].upTo;
        }
      }
      if (deces.primesApres1998.brackets?.[1]) {
        params.av990ITranche2Taux = toDecimalPercent(deces.primesApres1998.brackets[1].ratePercent);
      }
    }
    if (deces?.apres70ans?.globalAllowance) {
      params.av757BAbattement = deces.apres70ans.globalAllowance;
    }
  }

  const dividendes = normalizedFiscality?.dividendes;
  if (dividendes?.abattementBaremePercent != null) {
    params.dividendesAbattementPercent = clamp(
      toDecimalPercent(dividendes.abattementBaremePercent),
      0,
      1,
    );
  }

  if (normalizedFiscality?.pea?.ancienneteMinYears != null) {
    params.peaAncienneteMin = normalizedFiscality.pea.ancienneteMinYears;
  }

  const missingKeys: string[] = [];
  for (const key of REQUIRED_FISCAL_PARAM_KEYS) {
    const value = params[key];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      params[key] = getParam(DEFAULT_FISCAL_PARAMS, key);
      missingKeys.push(key);
    }
  }

  params.pfuTotal = roundDecimal(getParam(params, 'pfuIR') + getParam(params, 'pfuPS'));

  if (missingKeys.length && !hasWarnedMissingFiscalParams) {
    console.warn(
      '[Placement] Parametres fiscaux incomplets, fallback applique pour :',
      missingKeys.join(', '),
    );
    hasWarnedMissingFiscalParams = true;
  }

  return params;
}
