/**
 * Plafond 163 Quatervicies — calcul du plafond personnel épargne retraite.
 *
 * CGI Art. 163 quatervicies :
 * - 10% des revenus imposables (après abattement 10% si applicable)
 * - Minimum : 10% de 1 PASS
 * - Maximum : 10% de 8 PASS
 * - Réductions : art83, excédent Madelin, PERCO
 */

import type { DeclarantRevenus, PlafondDetail, AvisIrPlafonds, PerWarning } from './types';

export interface Plafond163QParams {
  revenuSource: DeclarantRevenus;
  cotisationSource?: DeclarantRevenus;
  pass: number;
  avisIr?: AvisIrPlafonds;
}

/**
 * Calcule le revenu imposable net d'un déclarant (après abattement 10% ou frais réels).
 */
export function computeRevenuImposable(d: DeclarantRevenus, plafondAbat10: number, plancherAbat10: number): number {
  const salBrut = d.salaires + d.art62;
  let abattement: number;
  if (d.fraisReels && d.fraisReelsMontant > 0) {
    abattement = d.fraisReelsMontant;
  } else {
    abattement = Math.min(Math.max(salBrut * 0.1, plancherAbat10), plafondAbat10);
  }
  const salNet = Math.max(0, salBrut - abattement);

  const plafondAbatRetraites = 4399;
  const plancherAbatRetraites = 450;
  const abatRetraites = d.retraites > 0
    ? Math.min(Math.max(d.retraites * 0.1, plancherAbatRetraites), plafondAbatRetraites)
    : 0;
  const pensionsNet = Math.max(0, d.retraites - abatRetraites);

  return salNet + d.bic + pensionsNet + d.fonciersNets + d.autresRevenus;
}

/**
 * Calcule le plafond brut 163Q pour un déclarant.
 */
export function computePlafond163QBrut(revenuImposable: number, pass: number): number {
  const minPlafond = pass * 0.1;
  const maxPlafond = 8 * pass * 0.1;
  const plafondBrut = revenuImposable * 0.1;
  return Math.round(Math.min(Math.max(plafondBrut, minPlafond), maxPlafond));
}

/**
 * Calcule les réductions sur le plafond 163Q (art83, excédent Madelin, PERCO).
 */
export function computeReductions163Q(d: DeclarantRevenus, pass: number): number {
  const reductionArt83 = d.cotisationsArt83;
  const madelinMax = Math.max(0, (d.bic - pass)) * 0.15;
  const madelinVerse = d.cotisationsMadelinRetraite + d.cotisationsMadelin154bis;
  const reductionMadelinExcess = Math.max(0, madelinVerse - madelinMax);
  const reductionPerco = d.abondementPerco;
  return Math.round(reductionArt83 + reductionMadelinExcess + reductionPerco);
}

/**
 * Calcule le plafond 163Q complet pour un déclarant, avec report en avant.
 */
export function computePlafond163Q(
  params: Plafond163QParams,
  plafondAbat10: number,
  plancherAbat10: number,
  warnings: PerWarning[],
): PlafondDetail {
  const { revenuSource, cotisationSource, pass, avisIr } = params;
  const declarantCotisations = cotisationSource ?? revenuSource;

  const revenuImposable = computeRevenuImposable(revenuSource, plafondAbat10, plancherAbat10);
  const plafondBrut = computePlafond163QBrut(revenuImposable, pass);
  const reductions = computeReductions163Q(declarantCotisations, pass);
  const plafondNet = Math.max(0, plafondBrut - reductions);

  const nonUtiliseN1 = avisIr?.nonUtiliseAnnee3 ?? 0;
  const nonUtiliseN2 = avisIr?.nonUtiliseAnnee2 ?? 0;
  const nonUtiliseN3 = avisIr?.nonUtiliseAnnee1 ?? 0;

  const totalDisponible = plafondNet + nonUtiliseN1 + nonUtiliseN2 + nonUtiliseN3;

  const cotisationsVersees =
    declarantCotisations.cotisationsPer163Q +
    declarantCotisations.cotisationsPerp;

  const disponibleRestant = totalDisponible - cotisationsVersees;
  const depassement = disponibleRestant < 0;

  if (depassement) {
    warnings.push({
      code: 'PER_PLAFOND_163Q_DEPASSE',
      message: `Dépassement du plafond 163Q : les versements (${cotisationsVersees.toLocaleString('fr-FR')} €) dépassent le plafond disponible (${totalDisponible.toLocaleString('fr-FR')} €).`,
      severity: 'warning',
    });
  }

  if (declarantCotisations.cotisationsPrevo > 0) {
    warnings.push({
      code: 'PER_PREVOYANCE_WARNING',
      message: 'Les cotisations prévoyance Madelin entrent dans le calcul du plafond Madelin. Vérifiez l\'impact sur votre enveloppe.',
      severity: 'info',
    });
  }

  return {
    plafondCalculeN: plafondNet,
    nonUtiliseN1,
    nonUtiliseN2,
    nonUtiliseN3,
    totalDisponible,
    cotisationsDejaVersees: cotisationsVersees,
    disponibleRestant: Math.max(0, disponibleRestant),
    depassement,
  };
}
