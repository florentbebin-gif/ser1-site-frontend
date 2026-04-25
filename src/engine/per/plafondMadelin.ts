/**
 * Plafond Madelin 154 bis — calcul détaillé des enveloppes TNS.
 *
 * Référence métier :
 * - assiette de versement = BIC + art.62 + Madelin retraite + PER 154 bis + prévoyance
 * - enveloppe 15% de versement = 15% de l'assiette au-delà d'1 PASS, plafonnée à 8 PASS
 * - enveloppe 10% commune = partagée avec art. 83, PERCO/PERECO et dépassements Madelin
 * - enveloppe 15% de report 2042 = recalculée sur la base imposable TNS après frais pro
 */

import { computeProfessionalDeduction, type PerAbattementConfigLike } from './plafond163Q';
import type { DeclarantRevenus, PerWarning, PlafondMadelinDetail } from './types';

export interface PlafondMadelinParams {
  declarant: DeclarantRevenus;
  pass: number;
  abat10SalCfg: PerAbattementConfigLike;
}

export function createEmptyMadelinDetail(): PlafondMadelinDetail {
  return {
    assietteVersement: 0,
    assietteReport: 0,
    enveloppe15Versement: 0,
    enveloppe15Report: 0,
    enveloppe10: 0,
    cotisationsVersees: 0,
    utilisation15Versement: { madelinRetraite: 0, per154bis: 0, total: 0 },
    depassement15Versement: { madelinRetraite: 0, per154bis: 0, total: 0 },
    utilisation15Report: { madelinRetraite: 0, per154bis: 0, total: 0 },
    depassement15Report: { madelinRetraite: 0, per154bis: 0, total: 0 },
    consommation10: { art83: 0, perco: 0, madelinRetraite: 0, per154bis: 0, total: 0 },
    reste15Versement: 0,
    reste15Report: 0,
    reste10: 0,
    disponibleRestant: 0,
    surplusAReintegrer: 0,
    depassement: false,
  };
}

function clampAssiette(assiette: number, pass: number): number {
  return Math.max(0, Math.min(assiette, 8 * pass));
}

function computeEnvelope15(assiette: number, pass: number): number {
  const assietteCappee = clampAssiette(assiette, pass);
  if (assietteCappee <= pass) {
    return 0;
  }
  return Math.round((assietteCappee - pass) * 0.15);
}

function computeEnvelope10(baseTns: number, assiette: number, pass: number): number {
  if (baseTns <= 0) {
    return 0;
  }

  if (assiette <= pass) {
    return Math.round(pass * 0.1);
  }

  return Math.round(clampAssiette(assiette, pass) * 0.1);
}

function computeAssietteReport(
  declarant: DeclarantRevenus,
  abat10SalCfg: PerAbattementConfigLike,
): number {
  const deductionProfessionnelle = computeProfessionalDeduction(declarant, abat10SalCfg);
  return Math.max(0, (declarant.art62 || 0) + (declarant.bic || 0) - deductionProfessionnelle);
}

function allocateSequentially(
  envelope10: number,
  demands: Array<{ key: 'art83' | 'perco' | 'madelinRetraite' | 'per154bis'; amount: number }>,
): PlafondMadelinDetail['consommation10'] {
  let remaining = Math.max(0, envelope10);
  const allocation: PlafondMadelinDetail['consommation10'] = {
    art83: 0,
    perco: 0,
    madelinRetraite: 0,
    per154bis: 0,
    total: 0,
  };

  demands.forEach((demand) => {
    const consumed = Math.min(remaining, Math.max(0, demand.amount));
    allocation[demand.key] = Math.round(consumed);
    allocation.total += Math.round(consumed);
    remaining -= consumed;
  });

  allocation.total = Math.round(allocation.total);
  return allocation;
}

/**
 * Calcule l'assiette Madelin pour un déclarant TNS.
 */
export function computeAssietteMadelin(d: DeclarantRevenus): number {
  return Math.round(
    (d.bic || 0) +
    (d.art62 || 0) +
    (d.cotisationsMadelinRetraite || 0) +
    (d.cotisationsMadelin154bis || 0) +
    (d.cotisationsPrevo || 0),
  );
}

/**
 * Vérifie si un déclarant doit être traité comme TNS.
 */
export function isTNS(d: DeclarantRevenus): boolean {
  return d.statutTns === true;
}

/**
 * Calcule le plafond Madelin 154 bis détaillé pour un déclarant TNS.
 */
export function computePlafondMadelin(
  params: PlafondMadelinParams,
  warnings: PerWarning[],
): PlafondMadelinDetail | null {
  const { declarant, pass, abat10SalCfg } = params;
  const baseTns = Math.max(0, (declarant.bic || 0) + (declarant.art62 || 0));

  if (!isTNS(declarant)) {
    return null;
  }

  if (baseTns <= 0) {
    return createEmptyMadelinDetail();
  }

  const assietteVersement = computeAssietteMadelin(declarant);
  const assietteReport = computeAssietteReport(declarant, abat10SalCfg);
  const enveloppe15Versement = computeEnvelope15(assietteVersement, pass);
  const enveloppe15Report = computeEnvelope15(assietteReport, pass);
  const enveloppe10 = computeEnvelope10(baseTns, assietteVersement, pass);

  const madelinRetraite = Math.max(0, declarant.cotisationsMadelinRetraite || 0);
  const per154bis = Math.max(0, declarant.cotisationsMadelin154bis || 0);
  const art83 = Math.max(0, declarant.cotisationsArt83 || 0);
  const perco = Math.max(0, declarant.abondementPerco || 0);

  const utilisation15VersementMadelin = Math.min(madelinRetraite, enveloppe15Versement);
  const remaining15VersementAfterMadelin = Math.max(0, enveloppe15Versement - utilisation15VersementMadelin);
  const utilisation15VersementPer154 = Math.min(per154bis, remaining15VersementAfterMadelin);

  const utilisation15ReportMadelin = Math.min(madelinRetraite, enveloppe15Report);
  const remaining15ReportAfterMadelin = Math.max(0, enveloppe15Report - utilisation15ReportMadelin);
  const utilisation15ReportPer154 = Math.min(per154bis, remaining15ReportAfterMadelin);

  const depassement15Versement = {
    madelinRetraite: Math.max(0, madelinRetraite - enveloppe15Versement),
    per154bis: Math.max(0, per154bis - remaining15VersementAfterMadelin),
  };
  const depassement15Report = {
    madelinRetraite: Math.max(0, madelinRetraite - enveloppe15Report),
    per154bis: Math.max(0, per154bis - remaining15ReportAfterMadelin),
  };

  const consommation10 = allocateSequentially(enveloppe10, [
    { key: 'art83', amount: art83 },
    { key: 'perco', amount: perco },
    { key: 'madelinRetraite', amount: depassement15Versement.madelinRetraite },
    { key: 'per154bis', amount: depassement15Versement.per154bis },
  ]);

  const demande10Totale =
    art83 +
    perco +
    depassement15Versement.madelinRetraite +
    depassement15Versement.per154bis;

  const surplusAReintegrer = Math.max(0, Math.round(demande10Totale - consommation10.total));
  const reste15Versement = Math.max(
    0,
    Math.round(enveloppe15Versement - utilisation15VersementMadelin - utilisation15VersementPer154),
  );
  const reste15Report = Math.max(
    0,
    Math.round(enveloppe15Report - utilisation15ReportMadelin - utilisation15ReportPer154),
  );
  const reste10 = Math.max(0, Math.round(enveloppe10 - consommation10.total));
  const disponibleRestant = Math.max(0, Math.round(reste15Versement + reste10));
  const depassement = surplusAReintegrer > 0;

  if (depassement) {
    warnings.push({
      code: 'PER_MADELIN_REINTEGRATION',
      message: `Le dépassement des enveloppes Madelin 154 bis entraîne une réintégration fiscale de ${surplusAReintegrer.toLocaleString('fr-FR')} € dans la base TNS.`,
      severity: 'warning',
    });
  }

  return {
    assietteVersement,
    assietteReport,
    enveloppe15Versement,
    enveloppe15Report,
    enveloppe10,
    cotisationsVersees: madelinRetraite + per154bis,
    utilisation15Versement: {
      madelinRetraite: Math.round(utilisation15VersementMadelin),
      per154bis: Math.round(utilisation15VersementPer154),
      total: Math.round(utilisation15VersementMadelin + utilisation15VersementPer154),
    },
    depassement15Versement: {
      madelinRetraite: Math.round(depassement15Versement.madelinRetraite),
      per154bis: Math.round(depassement15Versement.per154bis),
      total: Math.round(depassement15Versement.madelinRetraite + depassement15Versement.per154bis),
    },
    utilisation15Report: {
      madelinRetraite: Math.round(utilisation15ReportMadelin),
      per154bis: Math.round(utilisation15ReportPer154),
      total: Math.round(utilisation15ReportMadelin + utilisation15ReportPer154),
    },
    depassement15Report: {
      madelinRetraite: Math.round(depassement15Report.madelinRetraite),
      per154bis: Math.round(depassement15Report.per154bis),
      total: Math.round(depassement15Report.madelinRetraite + depassement15Report.per154bis),
    },
    consommation10,
    reste15Versement,
    reste15Report,
    reste10,
    disponibleRestant,
    surplusAReintegrer,
    depassement,
  };
}
