/**
 * calculCCA.ts — Calcul du Compte Courant d'Associé (CCA)
 *
 * Invariants :
 *   - Invariant 1 : CCARestant ≥ 0 — jamais dépassé
 *   - Le remboursement CCA n'est PAS un dividende : aucun PFU, aucun impact réserves
 *   - CCA constitué = ccaInitial + apportAnnuel × min(année, dureeActive)
 */

/**
 * Calcule le CCA cumulé constitué pour l'année n.
 * Année 1 : ccaInitial (apport unique) + apportAnnuel × 1
 * Années suivantes : + apportAnnuel jusqu'à dureeActive
 *
 * Formule issue de la cellule C8 du XLSX (FCB) :
 *   C8 = IF(age < ageRetraite, apportAnnuel, 0) + apportInitial
 */
export function calculCCACumule(params: {
  ccaInitial: number;
  apportAnnuelCCA: number;
  dureeActiveAns: number;
  annee: number;
}): number {
  const { ccaInitial, apportAnnuelCCA, dureeActiveAns, annee } = params;
  const annuitesCCA = Math.min(annee, dureeActiveAns);
  return ccaInitial + apportAnnuelCCA * annuitesCCA;
}

/**
 * Calcule l'apport CCA de l'année n (différentiel).
 * NEWCO — Année 1 : ccaInitial + apportAnnuel (le capital initial est apporté en year 1)
 * Existante — Année 1 : apportAnnuel uniquement (ccaInitial déjà présent avant la projection)
 * Années actives suivantes : apportAnnuel
 * Phase retraite : 0
 */
export function calculApportCCAAnnuel(params: {
  ccaInitial: number;
  apportAnnuelCCA: number;
  annee: number;
  dureeActiveAns: number;
  typeCreation?: 'newco' | 'existante';
}): number {
  const { ccaInitial, apportAnnuelCCA, annee, dureeActiveAns, typeCreation } = params;
  if (annee > dureeActiveAns) return 0;
  const base = annee === 1 && typeCreation !== 'existante' ? ccaInitial : 0;
  return base + apportAnnuelCCA;
}

/**
 * Calcule le remboursement CCA pour une année de retraite.
 *
 * Règles :
 * - Plafonné par le CCA restant dû
 * - Plafonné par la trésorerie disponible après IS
 * - Aucun PFU appliqué
 *
 * @returns montant effectivement remboursé
 */
export function calculRemboursementCCA(params: {
  besoinsRetraiteAnnuels: number;
  ccaRestantDu: number;
  tresorerieDisponibleApresIS: number;
  enPhaseRetraite: boolean;
}): number {
  const { besoinsRetraiteAnnuels, ccaRestantDu, tresorerieDisponibleApresIS, enPhaseRetraite } =
    params;
  if (!enPhaseRetraite) return 0;
  return Math.min(besoinsRetraiteAnnuels, ccaRestantDu, Math.max(0, tresorerieDisponibleApresIS));
}

/**
 * Calcule le CCA restant dû après remboursement.
 * Invariant 1 : résultat ≥ 0
 */
export function calculCCARestant(ccaRestantAvant: number, remboursement: number): number {
  return Math.max(0, ccaRestantAvant - remboursement);
}
