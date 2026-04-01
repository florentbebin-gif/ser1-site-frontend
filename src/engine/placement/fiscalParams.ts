import {
  DEFAULT_FISCAL_PARAMS,
  REQUIRED_NUMERIC_FISCAL_KEYS,
  clamp,
} from './shared';
import type { FiscalParams } from './types';

interface Bracket {
  ratePercent: number;
  upTo?: number | null;
}

interface FiscalitySettings {
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
}

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

function toDecimalPercent(value: number): number {
  return Math.round((value / 100) * 1_000_000) / 1_000_000;
}

function roundDecimal(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function extractFiscalParams(
  fiscalitySettings: FiscalitySettings | null | undefined,
  psSettings: PsSettingsForExtract | null | undefined,
  taxSettings?: TaxSettingsForExtract | null,
): FiscalParams {
  const params: Record<string, number> = { ...DEFAULT_FISCAL_PARAMS };

  if (psSettings?.patrimony?.current?.generalRate != null) {
    params.psGeneral = toDecimalPercent(psSettings.patrimony.current.generalRate);
  }
  if (psSettings?.patrimony?.current?.exceptionRate != null) {
    params.psException = toDecimalPercent(psSettings.patrimony.current.exceptionRate);
  }

  params.pfuPS = params.psGeneral;
  params.pfuTotal = roundDecimal(params.pfuIR + params.pfuPS);

  const pfuRateIR = taxSettings?.pfu?.current?.rateIR;
  if (typeof pfuRateIR === 'number') {
    params.pfuIR = toDecimalPercent(pfuRateIR);
    params.pfuTotal = roundDecimal(params.pfuIR + params.pfuPS);
  }

  const av = fiscalitySettings?.assuranceVie;
  if (av) {
    const retraitsCapital = av.retraitsCapital;
    const depuis2017 = retraitsCapital?.depuis2017;
    if (depuis2017?.plus8Ans) {
      const plus8Ans = depuis2017.plus8Ans;
      if (plus8Ans.abattementAnnuel?.single) params.avAbattement8ansSingle = plus8Ans.abattementAnnuel.single;
      if (plus8Ans.abattementAnnuel?.couple) params.avAbattement8ansCouple = plus8Ans.abattementAnnuel.couple;
      if (plus8Ans.primesNettesSeuil) params.avSeuilPrimes150k = plus8Ans.primesNettesSeuil;
      if (plus8Ans.irRateUnderThresholdPercent) params.avTauxSousSeuil8ans = toDecimalPercent(plus8Ans.irRateUnderThresholdPercent);
      if (plus8Ans.irRateOverThresholdPercent) params.avTauxSurSeuil8ans = toDecimalPercent(plus8Ans.irRateOverThresholdPercent);
    }
    if (depuis2017?.moins8Ans?.irRatePercent && typeof pfuRateIR !== 'number') {
      params.pfuIR = toDecimalPercent(depuis2017.moins8Ans.irRatePercent);
      params.pfuTotal = roundDecimal(params.pfuIR + params.pfuPS);
    }

    const deces = av.deces;
    if (deces?.primesApres1998) {
      if (deces.primesApres1998.allowancePerBeneficiary) {
        params.av990IAbattement = deces.primesApres1998.allowancePerBeneficiary;
      }
      if (deces.primesApres1998.brackets?.[0]) {
        params.av990ITranche1Taux = toDecimalPercent(deces.primesApres1998.brackets[0].ratePercent);
        if (deces.primesApres1998.brackets[0].upTo) {
          params.av990ITranche1Plafond = deces.primesApres1998.brackets[0].upTo - params.av990IAbattement;
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

  const dividendes = fiscalitySettings?.dividendes;
  if (dividendes?.abattementBaremePercent != null) {
    params.dividendesAbattementPercent = clamp(toDecimalPercent(dividendes.abattementBaremePercent), 0, 1);
  }

  const missingKeys: string[] = [];
  for (const key of REQUIRED_NUMERIC_FISCAL_KEYS) {
    const value = params[key];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      params[key] = (DEFAULT_FISCAL_PARAMS as Record<string, number>)[key];
      missingKeys.push(key);
    }
  }

  params.pfuTotal = roundDecimal((params.pfuIR ?? 0) + (params.pfuPS ?? 0));

  if (missingKeys.length && !hasWarnedMissingFiscalParams) {
    console.warn(
      '[Placement] Parametres fiscaux incomplets, fallback applique pour :',
      missingKeys.join(', '),
    );
    hasWarnedMissingFiscalParams = true;
  }

  return params as unknown as FiscalParams;
}
