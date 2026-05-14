/**
 * calculPlacements.ts — Calcul des poches de placement
 *
 * Deux poches :
 * - Distribution : revenus bruts annuels intégrés au résultat fiscal de la société
 * - Capitalisation : croissance sans IS annuel — IS payable UNIQUEMENT à la sortie
 *   (preuve : cellule M21 sheet31 du XLSM — vaut 0 toutes les années sauf l'année de sortie)
 *
 * La fonction computeProductiveMonthsByCivilYear applique le délai de jouissance
 * prorata temporis sur l'année civile réelle fournie par l'appelant.
 */

import type { DistributionPocketInput, CapitalisationPocketInput } from './types';

// ─── Délai de jouissance ──────────────────────────────────────────────────────

interface ProductiveMonthsParams {
  /** Format YYYY-MM */
  dateSouscription: string;
  delaiJouissanceMois: number;
  dureeMois: number;
  repetitionAuTerme: boolean;
  /** Année civile de la projection (ex : 2025, 2026…) — fournie par l'appelant */
  anneeCivile: number;
}

/**
 * Calcule le nombre de mois productifs (0–12) pour l'année civile `anneeCivile`
 * en tenant compte du délai de jouissance.
 *
 * Convention :
 *   dateDebutJouissance = dateSouscription + delaiJouissanceMois
 *   Mois productif = premier jour du mois ≥ dateDebutJouissance
 *   Revenus = rendementAnnuel × moisProductifs / 12
 *
 * Avec repetitionAuTerme : les cycles se répètent en mois absolus.
 * Le cycle couvrant le début de l'année civile est identifié et son
 * intersection avec [debutJouissance, finCycle[ ∩ [debutAnnée, finAnnée[ est calculée.
 */
export function computeProductiveMonthsByCivilYear(
  params: ProductiveMonthsParams,
): number {
  const { dateSouscription, delaiJouissanceMois, dureeMois, repetitionAuTerme, anneeCivile } = params;

  if (dureeMois <= 0) return 0;

  const [yyyy, mm] = dateSouscription.split('-').map(Number);
  if (!yyyy || !mm) return 0;

  const moisSouscriptionAbs = (yyyy - 2000) * 12 + (mm - 1);

  // Plage de l'année civile (mois absolus, 0-indexed depuis 2000-01)
  const moisDebutAnneeAbs = (anneeCivile - 2000) * 12;
  const moisFinAnneeAbs = moisDebutAnneeAbs + 12; // exclu

  let moisDebutJouissanceAbs: number;
  let moisFinPlacementAbs: number;

  if (repetitionAuTerme) {
    // Identifier le cycle qui couvre le début de l'année civile
    const offsetDebutAnnee = moisDebutAnneeAbs - moisSouscriptionAbs;
    const currentCycleIndex = offsetDebutAnnee <= 0
      ? 0
      : Math.floor(offsetDebutAnnee / dureeMois);

    const moisDebutCycle = moisSouscriptionAbs + currentCycleIndex * dureeMois;
    moisDebutJouissanceAbs = moisDebutCycle + delaiJouissanceMois;
    moisFinPlacementAbs = moisDebutCycle + dureeMois;
  } else {
    moisDebutJouissanceAbs = moisSouscriptionAbs + delaiJouissanceMois;
    moisFinPlacementAbs = moisSouscriptionAbs + dureeMois;
  }

  const debutIntersection = Math.max(moisDebutJouissanceAbs, moisDebutAnneeAbs);
  const finIntersection = Math.min(moisFinPlacementAbs, moisFinAnneeAbs);

  if (finIntersection <= debutIntersection) return 0;
  return finIntersection - debutIntersection;
}

// ─── Poche distribution ────────────────────────────────────────────────────────

export interface DistributionYearResult {
  capitalDistrib: number;
  revenuDistrib: number;
}

/**
 * Calcule les revenus de la poche distribution pour l'année civile `anneeCivile`.
 *
 * Formule (preuve : H21 = F21 × 'Param treso'!$H$30) :
 *   revenuBrut = capitalDistrib × rendementBrut × (moisProductifs / 12)
 */
export function calculDistributionAnnuel(
  pocket: DistributionPocketInput,
  anneeCivile: number,
): DistributionYearResult {
  if (!pocket || pocket.montant <= 0) {
    return { capitalDistrib: 0, revenuDistrib: 0 };
  }

  const capitalDistrib = pocket.montant;
  const moisProductifs = computeProductiveMonthsByCivilYear({
    dateSouscription: pocket.dateSouscription ?? '2025-01',
    delaiJouissanceMois: pocket.delaiJouissanceMois ?? 0,
    dureeMois: pocket.dureeAns ? pocket.dureeAns * 12 : 360,
    repetitionAuTerme: pocket.repetitionAuTerme ?? false,
    anneeCivile,
  });

  const revenuDistrib = capitalDistrib * pocket.rendementDistribue * (moisProductifs / 12);

  return { capitalDistrib, revenuDistrib };
}

// ─── Poche capitalisation ─────────────────────────────────────────────────────

export interface CapitalisationState {
  valeurActuelle: number;
  capitalInvesti: number;
}

export interface CapitalisationYearResult {
  capitalCapi: number;
  valeurCapiApres: number;
  gainCapiN: number;
  isLatentCapi: number;
  /** true si le rachat au terme a eu lieu cette année */
  rachatEffectue: boolean;
  /**
   * Montant brut encaissé par la société lors du rachat (= valeurCapiApres si rachat, 0 sinon).
   * Distinct de gainCapiN (gain taxable seul) : ce champ inclut le retour du capital investi.
   */
  montantRachatCapi: number;
}

/**
 * Calcule la croissance de la poche capitalisation pour l'année year.
 *
 * Formule (preuve : L22 = L21 × (1 + r)) — AUCUN IS annuel.
 *
 * À la sortie (year = dureeAns, rachatAuTerme actif) :
 *   gainCapiN = max(0, valeurCapiApres − capitalInvesti)  → entre dans la base IS
 *   montantRachatCapi = valeurCapiApres                   → entre dans les flux trésorerie
 *   (preuve : M21 = IFERROR(IF(B21 = dureeCapi, L21 − K21, 0), 0))
 */
export function calculCapitalisationAnnuel(
  pocket: CapitalisationPocketInput,
  state: CapitalisationState,
  year: number,
  tauxISEffectif: number,
): CapitalisationYearResult {
  if (!pocket || pocket.montant <= 0) {
    return {
      capitalCapi: 0,
      valeurCapiApres: state.valeurActuelle,
      gainCapiN: 0,
      isLatentCapi: 0,
      rachatEffectue: false,
      montantRachatCapi: 0,
    };
  }

  const capitalCapi = pocket.montant;
  const valeurAvant = state.valeurActuelle;

  // Croissance sans IS
  const valeurCapiApres = valeurAvant * (1 + pocket.rendementAnnuel);

  // Sortie : gain taxable et montant racheté distincts
  const dureeCapi = pocket.dureeAns ?? 999;
  const isExitYear = year === dureeCapi && pocket.rachatAuTerme !== false;
  const gainCapiN = isExitYear ? Math.max(0, valeurCapiApres - state.capitalInvesti) : 0;
  const montantRachatCapi = isExitYear ? valeurCapiApres : 0;

  // IS latent (affiché, non décaissé — invariant 4)
  const plusValueLatente = Math.max(0, valeurCapiApres - state.capitalInvesti);
  const isLatentCapi = plusValueLatente * tauxISEffectif;

  return { capitalCapi, valeurCapiApres, gainCapiN, isLatentCapi, rachatEffectue: isExitYear, montantRachatCapi };
}

/**
 * Calcule l'IS effectif sur un rachat partiel de la poche capitalisation.
 * Invariant 5 : déclenché uniquement au moment du rachat.
 *
 * Exposée pour usage futur : le runtime actuel ne gère que le rachatAuTerme complet.
 */
export function calculISRachatCapitalisation(params: {
  montantRachat: number;
  valeurActuelle: number;
  capitalInvesti: number;
  tauxISEffectif: number;
}): { isEffectif: number; montantNet: number } {
  const { montantRachat, valeurActuelle, capitalInvesti, tauxISEffectif } = params;
  if (montantRachat <= 0 || valeurActuelle <= 0) return { isEffectif: 0, montantNet: montantRachat };
  const gainProrata = montantRachat * (Math.max(0, valeurActuelle - capitalInvesti) / valeurActuelle);
  const isEffectif = gainProrata * tauxISEffectif;
  return { isEffectif, montantNet: montantRachat - isEffectif };
}
