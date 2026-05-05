/**
 * calculCreditIS.ts — Crédit contracté par la société IS
 *
 * La société emprunte pour investir (SCPI, immo).
 * Intérêts déductibles du résultat fiscal (réduisent la base IS).
 * Les revenus générés par l'actif financé s'ajoutent au résultat comptable.
 *
 * L'échéancier de remboursement démarre au mois civil de `dateDeblocage`.
 * Les années de simulation antérieures au déblocage ont annuité et intérêts = 0.
 *
 * Réutilise loanSchedule.ts (moteur pur).
 */

import { mensualiteAmortissable, scheduleAmortissable } from '../credit/loanSchedule';
import { computeProductiveMonthsByCivilYear } from './calculPlacements';
import type { CreditIsPocketInput } from './types';

export interface CreditISAnneeResult {
  annuiteCreditIS: number;
  interetsCreditIS: number;
  capitalRembourse: number;
  /** Revenus bruts générés par l'actif financé (SCPI, immo…) — intégrés au résultat comptable */
  revenusActifFinance: number;
}

/**
 * Construit les résultats annuels du crédit IS pour toutes les années de la projection.
 *
 * @param pocket           Paramètres du crédit IS
 * @param anneeCivileDebut Année civile de début de la projection (ex : 2026)
 * @returns tableau indexé par (année simulation 1-based) → résultat annuel
 */
export function buildCreditISSchedule(
  pocket: CreditIsPocketInput,
  anneeCivileDebut: number,
): CreditISAnneeResult[] {
  if (!pocket.actif || pocket.capitalEmprunte <= 0 || pocket.dureeMois <= 0) {
    return [];
  }

  // Décalage en mois entre le début de la projection et le déblocage du crédit.
  // Si dateDeblocage est avant anneeCivileDebut, le crédit a déjà démarré — on le traite
  // comme s'il commençait en mois 0 (pas de décalage négatif).
  let decalageMois = 0;
  if (pocket.dateDeblocage) {
    const parts = pocket.dateDeblocage.split('-').map(Number);
    const deblYyyy = parts[0];
    const deblMm = parts[1];
    if (deblYyyy && deblMm) {
      decalageMois = Math.max(0, (deblYyyy - anneeCivileDebut) * 12 + (deblMm - 1));
    }
  }

  const tauxMensuel = pocket.taux / 12;
  const rows = scheduleAmortissable({
    capital: pocket.capitalEmprunte,
    r: tauxMensuel,
    rAss: 0,
    N: pocket.dureeMois,
    assurMode: 'CRD',
  });

  // Nombre total d'années de simulation couvertes (délai + durée du prêt)
  const anneeMax = Math.ceil((pocket.dureeMois + decalageMois) / 12);
  const resultats: CreditISAnneeResult[] = [];

  for (let annee = 1; annee <= anneeMax; annee++) {
    let interetsCreditIS = 0;
    let capitalRembourse = 0;
    let mensu = 0;

    for (let simMois = (annee - 1) * 12 + 1; simMois <= annee * 12; simMois++) {
      // Convertit le mois simulation en index loan (1-based)
      const loanMois = simMois - decalageMois;
      if (loanMois < 1) continue; // avant le déblocage
      const row = rows[loanMois - 1];
      if (!row) break; // prêt terminé
      interetsCreditIS += row.interet;
      capitalRembourse += row.amort;
      mensu += row.mensu;
    }

    // Revenus de l'actif financé (délai de jouissance prorata temporis)
    let revenusActifFinance = 0;
    if (pocket.rendementActifFinance && pocket.rendementActifFinance > 0) {
      const moisProductifs = computeProductiveMonthsByCivilYear({
        dateSouscription: pocket.dateDeblocage ?? `${anneeCivileDebut}-01`,
        delaiJouissanceMois: pocket.delaiJouissanceMois ?? 0,
        dureeMois: pocket.dureeMois,
        repetitionAuTerme: false,
        anneeCivile: anneeCivileDebut + (annee - 1),
      });
      revenusActifFinance = pocket.capitalEmprunte * pocket.rendementActifFinance * (moisProductifs / 12);
    }

    resultats.push({
      annuiteCreditIS: mensu,
      interetsCreditIS,
      capitalRembourse,
      revenusActifFinance,
    });
  }

  return resultats;
}

/**
 * Retourne la mensualité annualisée du crédit IS.
 */
export function calculAnnuiteCreditIS(pocket: CreditIsPocketInput): number {
  if (!pocket.actif || pocket.capitalEmprunte <= 0 || pocket.dureeMois <= 0) return 0;
  const tauxMensuel = pocket.taux / 12;
  return mensualiteAmortissable(pocket.capitalEmprunte, tauxMensuel, pocket.dureeMois) * 12;
}
