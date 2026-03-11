import {
  DEFAULT_FISCAL_PARAMS,
  REQUIRED_NUMERIC_FISCAL_KEYS,
  clamp,
} from './shared.js';

let hasWarnedMissingFiscalParams = false;

export function extractFiscalParams(fiscalitySettings, psSettings) {
  const params = { ...DEFAULT_FISCAL_PARAMS };

  if (psSettings?.patrimony?.current?.totalRate) {
    params.psPatrimoine = psSettings.patrimony.current.totalRate / 100;
    params.pfuPS = params.psPatrimoine;
    params.pfuTotal = params.pfuIR + params.pfuPS;
  }

  const av = fiscalitySettings?.assuranceVie;
  if (av) {
    const rc = av.retraitsCapital;
    if (rc) {
      if (rc.psRatePercent) params.psPatrimoine = rc.psRatePercent / 100;

      const d2017 = rc.depuis2017;
      if (d2017) {
        if (d2017.moins8Ans?.irRatePercent) {
          params.pfuIR = d2017.moins8Ans.irRatePercent / 100;
        }
        if (d2017.plus8Ans) {
          const p8 = d2017.plus8Ans;
          if (p8.abattementAnnuel?.single) params.avAbattement8ansSingle = p8.abattementAnnuel.single;
          if (p8.abattementAnnuel?.couple) params.avAbattement8ansCouple = p8.abattementAnnuel.couple;
          if (p8.primesNettesSeuil) params.avSeuilPrimes150k = p8.primesNettesSeuil;
          if (p8.irRateUnderThresholdPercent) params.avTauxSousSeuil8ans = p8.irRateUnderThresholdPercent / 100;
          if (p8.irRateOverThresholdPercent) params.avTauxSurSeuil8ans = p8.irRateOverThresholdPercent / 100;
        }
      }
    }

    const deces = av.deces;
    if (deces?.primesApres1998) {
      if (deces.primesApres1998.allowancePerBeneficiary) {
        params.av990IAbattement = deces.primesApres1998.allowancePerBeneficiary;
      }
      if (deces.primesApres1998.brackets?.[0]) {
        params.av990ITranche1Taux = deces.primesApres1998.brackets[0].ratePercent / 100;
        if (deces.primesApres1998.brackets[0].upTo) {
          params.av990ITranche1Plafond = deces.primesApres1998.brackets[0].upTo - params.av990IAbattement;
        }
      }
      if (deces.primesApres1998.brackets?.[1]) {
        params.av990ITranche2Taux = deces.primesApres1998.brackets[1].ratePercent / 100;
      }
    }
    if (deces?.apres70ans?.globalAllowance) {
      params.av757BAbattement = deces.apres70ans.globalAllowance;
    }
  }

  const per = fiscalitySettings?.perIndividuel;
  if (per?.sortieCapital?.pfu) {
    if (per.sortieCapital.pfu.irRatePercent) {
      params.pfuIR = per.sortieCapital.pfu.irRatePercent / 100;
    }
    if (per.sortieCapital.pfu.psRatePercent) {
      params.pfuPS = per.sortieCapital.pfu.psRatePercent / 100;
    }
    params.pfuTotal = params.pfuIR + params.pfuPS;
  }

  const dividendes = fiscalitySettings?.dividendes;
  if (dividendes?.abattementBaremePercent != null) {
    params.dividendesAbattementPercent = clamp(dividendes.abattementBaremePercent / 100, 0, 1);
  }

  const missingKeys = [];
  for (const key of REQUIRED_NUMERIC_FISCAL_KEYS) {
    const value = params[key];
    if (typeof value !== 'number' || Number.isNaN(value)) {
      params[key] = DEFAULT_FISCAL_PARAMS[key];
      missingKeys.push(key);
    }
  }

  if (typeof params.pfuPS !== 'number' || Number.isNaN(params.pfuPS)) {
    params.pfuPS = params.psPatrimoine;
  }
  if (typeof params.pfuTotal !== 'number' || Number.isNaN(params.pfuTotal)) {
    params.pfuTotal = (params.pfuIR ?? 0) + (params.pfuPS ?? params.psPatrimoine ?? 0);
  }

  if (missingKeys.length && !hasWarnedMissingFiscalParams) {
    console.warn(
      '[Placement] Paramètres fiscaux incomplets, fallback appliqué pour :',
      missingKeys.join(', '),
    );
    hasWarnedMissingFiscalParams = true;
  }

  return params;
}
