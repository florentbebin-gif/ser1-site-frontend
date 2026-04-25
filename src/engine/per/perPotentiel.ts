/**
 * perPotentiel — Orchestrateur du moteur "Contrôle du potentiel ER"
 *
 * Zéro React, zéro Supabase. Fonctions pures uniquement.
 * Consomme les settings via paramètres injectés.
 */

import type {
  PerPotentielInput,
  PerPotentielResult,
  PerWarning,
  SimulationVersement,
  SituationFiscaleInput,
} from './types';
import { computeDeclaration2042 } from './perDeclarationFlow';
import { computePerDeductionFlow } from './perDeductionFlow';
import {
  computePlafond163Q,
  computeProjectedPlafond163Q,
} from './plafond163Q';
import { computePlafondMadelin, createEmptyMadelinDetail, isTNS } from './plafondMadelin';
import { computeProjectionAvis } from './perProjectionAvis';
import { estimerSituationFiscale } from './perIrEstimation';
import type { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '../../constants/settingsDefaults';

function addMadelinReintegration(
  situation: SituationFiscaleInput,
  surplusD1: number,
  surplusD2: number,
): SituationFiscaleInput {
  return {
    ...situation,
    declarant1: {
      ...situation.declarant1,
      bic: Math.max(0, (situation.declarant1.bic || 0) + surplusD1),
    },
    declarant2: situation.declarant2
      ? {
        ...situation.declarant2,
        bic: Math.max(0, (situation.declarant2.bic || 0) + surplusD2),
      }
      : undefined,
  };
}

/**
 * Calcule le potentiel épargne retraite complet.
 */
export function calculatePerPotentiel(input: PerPotentielInput): PerPotentielResult {
  const warnings: PerWarning[] = [];
  const {
    mode,
    anneeRef,
    yearKey = 'current',
    situationFiscale,
    projectionFiscale,
    avisIr,
    avisIr2,
    versementEnvisage,
    mutualisationConjoints,
    passHistory,
    taxSettings,
    psSettings,
  } = input;

  const passKeys = Object.keys(passHistory).map(Number).sort((a, b) => b - a);
  const pass = passHistory[anneeRef] ?? passHistory[anneeRef - 1] ?? passHistory[passKeys[0]] ?? 0;

  const tax = taxSettings as typeof DEFAULT_TAX_SETTINGS;
  const ps = psSettings as typeof DEFAULT_PS_SETTINGS;
  const abat10CfgRoot = tax?.incomeTax?.abat10 ?? {};
  const abat10SalCfg = yearKey === 'current'
    ? abat10CfgRoot.current ?? {}
    : abat10CfgRoot.previous ?? {};
  const abat10RetCfg = yearKey === 'current'
    ? abat10CfgRoot.retireesCurrent ?? {}
    : abat10CfgRoot.retireesPrevious ?? {};

  const activeSituation = projectionFiscale ?? situationFiscale;
  const activeDeclarant1 = activeSituation.declarant1;
  const activeDeclarant2 = activeSituation.declarant2;

  const plafond163QD1 = computePlafond163Q({
    cotisationSource: activeDeclarant1,
    avisIr,
    pass,
    abat10SalCfg,
    abat10RetCfg,
  }, warnings);

  const plafond163QD2 = activeDeclarant2
    ? computePlafond163Q({
      cotisationSource: activeDeclarant2,
      avisIr: avisIr2,
      pass,
      abat10SalCfg,
      abat10RetCfg,
    }, warnings)
    : undefined;

  const mad1 = computePlafondMadelin({
    declarant: activeDeclarant1,
    pass,
    abat10SalCfg,
  }, warnings);
  const mad2 = activeDeclarant2
    ? computePlafondMadelin({
      declarant: activeDeclarant2,
      pass,
      abat10SalCfg,
    }, warnings)
    : null;

  const estTNS = Boolean(isTNS(activeDeclarant1) || (activeDeclarant2 && isTNS(activeDeclarant2)));
  const plafondMadelin = estTNS
    ? {
      declarant1: mad1 ?? createEmptyMadelinDetail(),
      declarant2: mad2 ?? undefined,
    }
    : undefined;

  const declaration2042 = computeDeclaration2042({
    declarant1: activeDeclarant1,
    declarant2: activeDeclarant2,
    madelin1: mad1,
    madelin2: mad2,
    mutualisationConjoints,
  });

  const deductionFlow163Q = computePerDeductionFlow({
    declarant1: activeDeclarant1,
    declarant2: activeDeclarant2,
    plafond1: plafond163QD1,
    plafond2: plafond163QD2,
    mutualisationConjoints,
  });

  if (deductionFlow163Q.declarant1.cotisationsNonDeductibles > 0) {
    warnings.push({
      code: 'PER_163Q_IR_NON_DEDUCTIBLE_D1',
      message: `Une fraction des versements 163 quatervicies / PERP du déclarant 1 (${deductionFlow163Q.declarant1.cotisationsNonDeductibles.toLocaleString('fr-FR')} €) n'est pas retenue pour l'IR courant.`,
      severity: 'warning',
    });
  }
  if ((deductionFlow163Q.declarant2?.cotisationsNonDeductibles ?? 0) > 0) {
    warnings.push({
      code: 'PER_163Q_IR_NON_DEDUCTIBLE_D2',
      message: `Une fraction des versements 163 quatervicies / PERP du déclarant 2 (${deductionFlow163Q.declarant2!.cotisationsNonDeductibles.toLocaleString('fr-FR')} €) n'est pas retenue pour l'IR courant.`,
      severity: 'warning',
    });
  }

  const adjustedSituation = addMadelinReintegration(
    activeSituation,
    mad1?.surplusAReintegrer ?? 0,
    mad2?.surplusAReintegrer ?? 0,
  );

  const situationFiscaleResult = estimerSituationFiscale({
    situationFiscale: adjustedSituation,
    deductionsPer: deductionFlow163Q.totalDeductionsIr,
    taxSettings: tax,
    psSettings: ps,
    yearKey,
  });

  const projectedPlafondD1 = computeProjectedPlafond163Q({
    revenuSource: adjustedSituation.declarant1,
    cotisationSource: activeDeclarant1,
    avisIr,
    reduction2042: declaration2042.case6QS + declaration2042.case6OS,
    pass,
    abat10SalCfg,
    abat10RetCfg,
  });

  const projectedPlafondD2 = adjustedSituation.declarant2
    ? computeProjectedPlafond163Q({
      revenuSource: adjustedSituation.declarant2,
      cotisationSource: activeDeclarant2!,
      avisIr: avisIr2,
      reduction2042: (declaration2042.case6QT ?? 0) + (declaration2042.case6OT ?? 0),
      pass,
      abat10SalCfg,
      abat10RetCfg,
    })
    : undefined;

  const projectionAvisSuivant = computeProjectionAvis({
    avisIr,
    avisIr2,
    deductionFlow: deductionFlow163Q,
    projectedPlafondD1,
    projectedPlafondD2,
  });

  let simulation: SimulationVersement | undefined;
  if (mode === 'versement-n' && versementEnvisage != null && versementEnvisage > 0) {
    const plafondDispoD1 = deductionFlow163Q.declarant1.disponibleRestant;
    const plafondDispoD2 = mutualisationConjoints
      ? deductionFlow163Q.declarant2?.disponibleRestant ?? 0
      : 0;
    const totalDispo = plafondDispoD1 + plafondDispoD2;
    const versementDeductible = Math.min(versementEnvisage, totalDispo);
    const economie = Math.round(versementDeductible * situationFiscaleResult.tmi);

    simulation = {
      versementEnvisage,
      versementDeductible,
      economieIRAnnuelle: economie,
      coutNetApresFiscalite: versementEnvisage - economie,
      plafondRestantApres: Math.max(0, totalDispo - versementEnvisage),
    };
  }

  return {
    situationFiscale: situationFiscaleResult,
    plafond163Q: { declarant1: plafond163QD1, declarant2: plafond163QD2 },
    deductionFlow163Q,
    plafondMadelin,
    estTNS,
    declaration2042,
    projectionAvisSuivant,
    simulation,
    warnings,
  };
}
