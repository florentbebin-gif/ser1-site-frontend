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
} from './types';
import { computePlafond163Q } from './plafond163Q';
import { computePlafondMadelin, isTNS } from './plafondMadelin';
import { estimerSituationFiscale } from './perIrEstimation';
import type { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../../constants/settingsDefaults';

/**
 * Calcule le potentiel épargne retraite complet.
 */
export function calculatePerPotentiel(input: PerPotentielInput): PerPotentielResult {
  const warnings: PerWarning[] = [];
  const {
    mode,
    anneeRef,
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

  const abat10Cfg = tax?.incomeTax?.abat10?.current;
  const plafondAbat10 = abat10Cfg?.plafond ?? 14426;
  const plancherAbat10 = abat10Cfg?.plancher ?? 504;

  const { declarant1, declarant2 } = situationFiscale;
  const activeSituation = projectionFiscale ?? situationFiscale;
  const activeDeclarant1 = activeSituation.declarant1;
  const activeDeclarant2 = activeSituation.declarant2;
  const declarationSource = mode === 'declaration-n1' ? situationFiscale : activeSituation;

  const plafond163QD1 = computePlafond163Q(
    { revenuSource: declarant1, cotisationSource: activeDeclarant1, pass, avisIr },
    plafondAbat10, plancherAbat10, warnings,
  );

  let plafond163QD2;
  if (declarant2) {
    plafond163QD2 = computePlafond163Q(
      { revenuSource: declarant2, cotisationSource: activeDeclarant2, pass, avisIr: avisIr2 },
      plafondAbat10, plancherAbat10, warnings,
    );
  }

  const estTNSD1 = isTNS(activeDeclarant1);
  const estTNSD2 = activeDeclarant2 ? isTNS(activeDeclarant2) : false;
  const estTNS = estTNSD1 || estTNSD2;

  let plafondMadelin;
  if (estTNS) {
    const mad1 = computePlafondMadelin({ declarant: activeDeclarant1, pass }, warnings);
    const mad2 = activeDeclarant2
      ? computePlafondMadelin({ declarant: activeDeclarant2, pass }, warnings)
      : undefined;

    if (mad1 || mad2) {
      plafondMadelin = {
        declarant1: mad1!,
        declarant2: mad2 ?? undefined,
      };
    }
  }

  const totalCotisationsDeductiblesD1 =
    activeDeclarant1.cotisationsPer163Q +
    activeDeclarant1.cotisationsPerp +
    activeDeclarant1.cotisationsMadelin154bis +
    activeDeclarant1.cotisationsMadelinRetraite;

  const totalCotisationsDeductiblesD2 = activeDeclarant2
    ? activeDeclarant2.cotisationsPer163Q +
      activeDeclarant2.cotisationsPerp +
      activeDeclarant2.cotisationsMadelin154bis +
      activeDeclarant2.cotisationsMadelinRetraite
      : 0;

  const totalDeductionsPer = totalCotisationsDeductiblesD1 + totalCotisationsDeductiblesD2;

  const situationFiscaleResult = estimerSituationFiscale({
    situationFiscale: activeSituation,
    deductionsPer: totalDeductionsPer,
    taxSettings: tax,
    psSettings: ps,
  });

  const declaration2042 = {
    case6NS: declarationSource.declarant1.cotisationsPer163Q,
    case6NT: declarationSource.declarant2 ? declarationSource.declarant2.cotisationsPer163Q : undefined,
    case6RS: declarationSource.declarant1.cotisationsPerp,
    case6RT: declarationSource.declarant2 ? declarationSource.declarant2.cotisationsPerp : undefined,
    case6QS: declarationSource.declarant1.cotisationsArt83,
    case6QT: declarationSource.declarant2 ? declarationSource.declarant2.cotisationsArt83 : undefined,
    case6OS: declarationSource.declarant1.cotisationsMadelin154bis,
    case6OT: declarationSource.declarant2 ? declarationSource.declarant2.cotisationsMadelin154bis : undefined,
    case6QR: Boolean(declarationSource.declarant2 && mutualisationConjoints),
  };

  let simulation: SimulationVersement | undefined;
  if (mode === 'versement-n' && versementEnvisage != null && versementEnvisage > 0) {
    const plafondDispoD1 = plafond163QD1.disponibleRestant;
    const plafondDispoD2 =
      declarationSource.declarant2 && mutualisationConjoints
        ? plafond163QD2?.disponibleRestant ?? 0
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
    plafondMadelin,
    estTNS,
    declaration2042,
    simulation,
    warnings,
  };
}
