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
    anneeRef,
    situationFiscale,
    avisIr,
    avisIr2,
    versementEnvisage,
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

  const plafond163QD1 = computePlafond163Q(
    { declarant: declarant1, pass, avisIr },
    plafondAbat10, plancherAbat10, warnings,
  );

  let plafond163QD2;
  if (declarant2) {
    plafond163QD2 = computePlafond163Q(
      { declarant: declarant2, pass, avisIr: avisIr2 },
      plafondAbat10, plancherAbat10, warnings,
    );
  }

  const estTNSD1 = isTNS(declarant1);
  const estTNSD2 = declarant2 ? isTNS(declarant2) : false;
  const estTNS = estTNSD1 || estTNSD2;

  let plafondMadelin;
  if (estTNS) {
    const mad1 = computePlafondMadelin({ declarant: declarant1, pass }, warnings);
    const mad2 = declarant2
      ? computePlafondMadelin({ declarant: declarant2, pass }, warnings)
      : undefined;

    if (mad1 || mad2) {
      plafondMadelin = {
        declarant1: mad1!,
        declarant2: mad2 ?? undefined,
      };
    }
  }

  const totalCotisationsDeductiblesD1 =
    declarant1.cotisationsPer163Q +
    declarant1.cotisationsPerp +
    declarant1.cotisationsMadelin154bis +
    declarant1.cotisationsMadelinRetraite;

  const totalCotisationsDeductiblesD2 = declarant2
    ? declarant2.cotisationsPer163Q +
      declarant2.cotisationsPerp +
      declarant2.cotisationsMadelin154bis +
      declarant2.cotisationsMadelinRetraite
    : 0;

  const totalDeductionsPer = totalCotisationsDeductiblesD1 + totalCotisationsDeductiblesD2;

  const situationFiscaleResult = estimerSituationFiscale({
    situationFiscale,
    deductionsPer: totalDeductionsPer,
    taxSettings: tax,
    psSettings: ps,
  });

  let simulation: SimulationVersement | undefined;
  if (versementEnvisage != null && versementEnvisage > 0) {
    const plafondDispoD1 = plafond163QD1.disponibleRestant;
    const plafondDispoD2 = plafond163QD2?.disponibleRestant ?? 0;
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
    simulation,
    warnings,
  };
}
