/**
 * calculCreditIR.ts — Crédit contracté par l'associé (remboursé via dividendes)
 *
 * PFU uniquement — option barème IR hors périmètre de ce calcul (invariant 3).
 *
 * Formule (preuve : cellule AC21 sheet31 du XLSM) :
 *   dividendesBruts = mensualité × 12 / (1 − pfuTotal)
 *
 * Ces dividendes bruts sont plafonnés par la capacité distribuable et
 * la trésorerie disponible calculée par simulateTresorerieV2.
 */

import { mensualiteAmortissable } from '../credit/loanSchedule';
import type { CreditIrPocketInput, TresoFiscalParams } from './types';

export interface CreditIRResult {
  mensualite: number;
  annuite: number;
  dividendesBrutsDemandes: number;
}

/**
 * Calcule la mensualité, l'annuité et les dividendes bruts nécessaires
 * pour couvrir le crédit IR via PFU.
 *
 * Invariant 3 : dividendesBrutsDemandes = annuité / (1 − pfuTotal)
 */
export function calculCreditIR(
  pocket: CreditIrPocketInput,
  params: TresoFiscalParams,
  annee: number,
): CreditIRResult {
  if (!pocket.actif || pocket.capital <= 0 || pocket.dureeMois <= 0) {
    return { mensualite: 0, annuite: 0, dividendesBrutsDemandes: 0 };
  }

  // Le crédit est actif tant que l'annuité n'est pas terminée
  const dureeMoisCredit = pocket.dureeMois;
  const moisDebut = (annee - 1) * 12 + 1;
  if (moisDebut > dureeMoisCredit) {
    return { mensualite: 0, annuite: 0, dividendesBrutsDemandes: 0 };
  }

  const tauxMensuel = pocket.taux / 12;
  const mensualite = mensualiteAmortissable(pocket.capital, tauxMensuel, dureeMoisCredit);

  // Mois actifs cette année (peut être partiel la dernière année)
  const moisActifs = Math.min(12, dureeMoisCredit - (annee - 1) * 12);
  const annuite = mensualite * moisActifs;

  const pfuTotal = params.pfuTotal;
  const dividendesBrutsDemandes = pfuTotal >= 1 ? 0 : annuite / (1 - pfuTotal);

  return { mensualite, annuite, dividendesBrutsDemandes };
}
