/**
 * Plafond Madelin 154 bis — calcul de l'enveloppe TNS.
 *
 * CGI Art. 154 bis :
 * - Enveloppe 15% : (revenus > 1 PASS, max 8 PASS) × 15%
 * - Enveloppe 10% : min 10% PASS, max 10% de 8 PASS
 * - Assiette : BIC/BNC + art62 + cotisations Madelin + PERin 154bis + prévoyance
 */

import type { DeclarantRevenus, PlafondMadelinDetail, PerWarning } from './types';

export interface PlafondMadelinParams {
  declarant: DeclarantRevenus;
  pass: number;
}

/**
 * Calcule l'assiette Madelin pour un déclarant TNS.
 */
export function computeAssietteMadelin(d: DeclarantRevenus): number {
  return d.bic + d.art62 +
    d.cotisationsMadelinRetraite +
    d.cotisationsMadelin154bis +
    d.cotisationsPrevo;
}

/**
 * Vérifie si un déclarant est TNS (a des revenus BIC/BNC ou art62).
 */
export function isTNS(d: DeclarantRevenus): boolean {
  return d.bic > 0 || d.art62 > 0;
}

/**
 * Calcule le plafond Madelin 154 bis pour un déclarant TNS.
 */
export function computePlafondMadelin(
  params: PlafondMadelinParams,
  warnings: PerWarning[],
): PlafondMadelinDetail | null {
  const { declarant, pass } = params;

  if (!isTNS(declarant)) return null;

  const assiette = computeAssietteMadelin(declarant);

  let enveloppe15: number;
  if (assiette <= pass) {
    enveloppe15 = 0;
  } else if (assiette <= 8 * pass) {
    enveloppe15 = Math.round((assiette - pass) * 0.15);
  } else {
    enveloppe15 = Math.round((8 * pass - pass) * 0.15);
  }

  let enveloppe10: number;
  if (assiette <= pass) {
    enveloppe10 = Math.round(pass * 0.1);
  } else if (assiette <= 8 * pass) {
    enveloppe10 = Math.round(assiette * 0.1);
  } else {
    enveloppe10 = Math.round(8 * pass * 0.1);
  }

  const potentielTotal = enveloppe15 + enveloppe10;

  const cotisationsVersees =
    declarant.cotisationsMadelinRetraite +
    declarant.cotisationsMadelin154bis;

  const disponibleRestant = potentielTotal - cotisationsVersees;
  const depassement = disponibleRestant < 0;

  if (depassement) {
    warnings.push({
      code: 'PER_MADELIN_DEPASSE',
      message: `Dépassement enveloppe Madelin : versements (${cotisationsVersees.toLocaleString('fr-FR')} €) > potentiel (${potentielTotal.toLocaleString('fr-FR')} €). Réintégration fiscale à opérer.`,
      severity: 'warning',
    });
  }

  return {
    assiette,
    enveloppe15,
    enveloppe10,
    potentielTotal,
    cotisationsVersees,
    disponibleRestant: Math.max(0, disponibleRestant),
    depassement,
  };
}
