/**
 * Plafond 163 quatervicies — calcul du potentiel PER individuel.
 *
 * Le plafond utilisable pour les versements 163 quatervicies / PERP de l'année
 * provient de l'avis IR saisi. Les revenus courants servent à projeter le
 * plafond calculé du prochain avis IR.
 */

import type { AvisIrPlafonds, DeclarantRevenus, PerWarning, PlafondDetail } from './types';

export interface PerAbattementConfigLike {
  plafond?: number | string | null;
  plancher?: number | string | null;
}

export interface Plafond163QParams {
  revenuSource?: DeclarantRevenus;
  cotisationSource: DeclarantRevenus;
  avisIr?: AvisIrPlafonds;
  reduction2042?: number;
  pass: number;
  abat10SalCfg: PerAbattementConfigLike;
  abat10RetCfg: PerAbattementConfigLike;
}

function toNumber(value: number | string | null | undefined, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : fallback;
}

export function computeProfessionalDeduction(
  d: DeclarantRevenus,
  abat10SalCfg: PerAbattementConfigLike,
): number {
  if (d.fraisReels && d.fraisReelsMontant > 0) {
    return Math.max(0, d.fraisReelsMontant);
  }

  const plafondAbat10 = toNumber(abat10SalCfg.plafond, 0);
  const plancherAbat10 = toNumber(abat10SalCfg.plancher, 0);
  const salBrut = (d.salaires || 0) + (d.art62 || 0);

  return salBrut > 0
    ? Math.min(Math.max(salBrut * 0.1, plancherAbat10), plafondAbat10)
    : 0;
}

/**
 * Calcule le revenu imposable net d'un déclarant (après abattement 10% ou frais réels).
 */
export function computeRevenuImposable(
  d: DeclarantRevenus,
  abat10SalCfg: PerAbattementConfigLike,
  abat10RetCfg: PerAbattementConfigLike,
): number {
  const salDeduction = computeProfessionalDeduction(d, abat10SalCfg);
  const salNet = Math.max(0, (d.salaires || 0) + (d.art62 || 0) - salDeduction);

  const plafondAbatRetraites = toNumber(abat10RetCfg.plafond, 0);
  const plancherAbatRetraites = toNumber(abat10RetCfg.plancher, 0);
  const abatRetraites = (d.retraites || 0) > 0
    ? Math.min(
      Math.max((d.retraites || 0) * 0.1, plancherAbatRetraites),
      plafondAbatRetraites,
    )
    : 0;
  const pensionsNet = Math.max(0, (d.retraites || 0) - abatRetraites);

  return Math.round(
    salNet +
    (d.bic || 0) +
    pensionsNet +
    (d.fonciersNets || 0) +
    (d.autresRevenus || 0),
  );
}

/**
 * Base d'activité professionnelle retenue pour le plafond projeté du prochain avis IR.
 * Alignement classeur : salaires + art.62 - frais pro + BIC.
 */
export function computeRevenuActiviteProfessionnelle(
  d: DeclarantRevenus,
  abat10SalCfg: PerAbattementConfigLike,
): number {
  const salDeduction = computeProfessionalDeduction(d, abat10SalCfg);

  return Math.round(
    (d.salaires || 0) +
    (d.art62 || 0) -
    salDeduction +
    (d.bic || 0),
  );
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

export function computeReductions163Q(plafondBrut: number, reduction2042: number): number {
  return Math.round(Math.min(Math.max(0, reduction2042), Math.max(0, plafondBrut)));
}

function mapAvisToPlafondDetail(
  avisIr: AvisIrPlafonds | undefined,
  cotisationsVersees: number,
  warnings: PerWarning[],
): PlafondDetail {
  const nonUtiliseN3 = avisIr?.nonUtiliseAnnee1 ?? 0;
  const nonUtiliseN2 = avisIr?.nonUtiliseAnnee2 ?? 0;
  const nonUtiliseN1 = avisIr?.nonUtiliseAnnee3 ?? 0;
  const plafondCalculeN = avisIr?.plafondCalcule ?? 0;
  const totalDisponible = nonUtiliseN3 + nonUtiliseN2 + nonUtiliseN1 + plafondCalculeN;
  const disponibleRestant = totalDisponible - cotisationsVersees;
  const depassement = disponibleRestant < 0;

  if (depassement) {
    warnings.push({
      code: 'PER_PLAFOND_163Q_DEPASSE',
      message: `Les cotisations 163 quatervicies / PERP (${cotisationsVersees.toLocaleString('fr-FR')} €) dépassent le potentiel disponible issu de l'avis IR (${totalDisponible.toLocaleString('fr-FR')} €).`,
      severity: 'warning',
    });
  }

  return {
    plafondCalculeN,
    nonUtiliseN1,
    nonUtiliseN2,
    nonUtiliseN3,
    totalDisponible,
    cotisationsDejaVersees: cotisationsVersees,
    disponibleRestant: Math.max(0, disponibleRestant),
    depassement,
  };
}

/**
 * Calcule le détail 163Q courant à partir de l'avis IR saisi.
 */
export function computePlafond163Q(
  params: Plafond163QParams,
  warnings: PerWarning[],
): PlafondDetail {
  const { cotisationSource } = params;
  const cotisationsVersees =
    (cotisationSource.cotisationsPer163Q || 0) +
    (cotisationSource.cotisationsPerp || 0);

  if ((cotisationSource.cotisationsPrevo || 0) > 0) {
    warnings.push({
      code: 'PER_PREVOYANCE_WARNING',
      message: 'Les cotisations prévoyance Madelin entrent dans le calcul du potentiel 154 bis. Vérifiez leur impact sur l’assiette TNS.',
      severity: 'info',
    });
  }

  return mapAvisToPlafondDetail(params.avisIr, cotisationsVersees, warnings);
}

/**
 * Calcule le plafond 163Q projeté pour le prochain avis IR.
 */
export function computeProjectedPlafond163Q(
  params: Plafond163QParams,
): number {
  if (!params.revenuSource) {
    return 0;
  }

  const revenuActivite = computeRevenuActiviteProfessionnelle(
    params.revenuSource,
    params.abat10SalCfg,
  );
  const plafondBrut = computePlafond163QBrut(revenuActivite, params.pass);
  const reductions = computeReductions163Q(plafondBrut, params.reduction2042 ?? 0);
  return Math.max(0, plafondBrut - reductions);
}
