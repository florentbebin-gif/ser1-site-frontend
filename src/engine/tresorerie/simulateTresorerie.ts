/**
 * simulateTresorerie.ts — Orchestrateur de la simulation trésorerie société IS
 *
 * Produit un TresoProjectionRow[] couvrant l'horizon (ageRetraite − ageActuel) + durée retraite.
 *
 * Ordre d'opérations par année (voir plan §"Flux annuels exacts") :
 *  0. Stock de départ
 *  1. Apport CCA
 *  2. Revenus placement distribution (avec délai de jouissance)
 *  3. Capitalisation — croissance pure, SANS IS
 *  3b. Dividendes filiales — régime mère-fille
 *  4. Intérêts crédit IS (si actif)
 *  5. Charges structure
 *  6. Résultat comptable / fiscal / base IS
 *  7. Calcul IS
 *  8. Résultat net comptable + capacité distribuable
 *  9. Dividendes crédit IR demandés
 * 10. Remboursement CCA + dividendes complémentaires retraite
 * 11. Plafonnement dividendes
 * 12. Trésorerie fin d'année (Convention Option A : sortie brute unique)
 * 13. CCA restant dû
 * 14. Réserves finales
 *
 * Invariants : voir plan §"Invariants métier"
 */

import type { TresoInputs, TresoFiscalParams, TresoProjectionRow } from './types';
import { calculBaseEtIS, calculResultatFiscalHolding } from './calculIS';
import {
  calculApportCCAAnnuel,
  calculCCACumule,
  calculRemboursementCCA,
} from './calculCCA';
import {
  calculDistributionAnnuel,
  calculCapitalisationAnnuel,
  type CapitalisationState,
} from './calculPlacements';
import { buildCreditISSchedule } from './calculCreditIS';
import { calculCreditIR } from './calculCreditIR';

/**
 * Génère la projection annuelle complète.
 *
 * @param inputs   Paramètres saisis par l'utilisateur
 * @param params   Paramètres fiscaux construits par le hook (jamais hardcodés)
 * @param horizonAns  Durée de la simulation (active + retraite). Défaut = 30 ans.
 */
export function simulateTresorerie(
  inputs: TresoInputs,
  params: TresoFiscalParams,
  horizonAns = 30,
): TresoProjectionRow[] {
  const {
    typeCreation,
    ageActuel,
    ageRetraite,
    besoinsRetraiteAnnuels,
    fraisStructureAnnuels,
    ccaInitial,
    apportAnnuelCCA,
    dureeActiveAns,
    tresorerieInitiale = 0,
    reservesInitiales = 0,
    anneeCivileDebut: anneeCivileDebutInput,
    distribution,
    capitalisation,
    creditIS,
    creditIR,
    holding,
  } = inputs;

  const anneeCivileDebut = anneeCivileDebutInput ?? new Date().getFullYear();

  // Pré-calcul de l'échéancier crédit IS (agrégé par année)
  const creditISSchedule = creditIS?.actif ? buildCreditISSchedule(creditIS, anneeCivileDebut) : [];

  // État initial de la poche capitalisation
  let capiState: CapitalisationState = {
    valeurActuelle: capitalisation?.valeurActuelle ?? capitalisation?.montant ?? 0,
    capitalInvesti: capitalisation?.capitalInvestiHistorique ?? capitalisation?.montant ?? 0,
  };

  // Taux IS effectif pour IS latent capitalisation (taux réduit si base ≤ seuil, sinon taux normal)
  // Approximation conservatrice : taux normal utilisé pour IS latent
  const tauxISEffectifLatent = params.isNormalRate;

  // Variables de stock
  // NEWCO : la dette CCA part de 0 et s'accumule avec apportCCA dès year 1.
  // Existante : la dette initiale ccaInitial est déjà présente avant la projection.
  let tresorerieDebut = tresorerieInitiale;
  let ccaRestant = typeCreation === 'existante' ? ccaInitial : 0;
  let reservesDebut = reservesInitiales;

  const rows: TresoProjectionRow[] = [];

  for (let year = 1; year <= horizonAns; year++) {
    const ageAnnee = ageActuel + year - 1;
    const enPhaseRetraite = ageAnnee >= ageRetraite;

    // ── Étape 0 : stock de départ ────────────────────────────────────────────
    // tresorerieDebut est déjà initialisé

    // ── Étape 1 : apport CCA ─────────────────────────────────────────────────
    const apportCCA = calculApportCCAAnnuel({
      ccaInitial,
      apportAnnuelCCA,
      annee: year,
      dureeActiveAns,
      typeCreation,
    });
    const ccaCumule = calculCCACumule({
      ccaInitial,
      apportAnnuelCCA,
      dureeActiveAns,
      annee: year,
    });

    const anneeCivile = anneeCivileDebut + (year - 1);

    // ── Étape 2 : revenus distribution ───────────────────────────────────────
    const distResult = distribution
      ? calculDistributionAnnuel(distribution, anneeCivile)
      : { capitalDistrib: 0, revenuDistrib: 0 };

    // ── Étape 3 : capitalisation — croissance pure, SANS IS ──────────────────
    const capiResult = capitalisation
      ? calculCapitalisationAnnuel(capitalisation, capiState, year, tauxISEffectifLatent)
      : { capitalCapi: 0, valeurCapiApres: capiState.valeurActuelle, gainCapiN: 0, isLatentCapi: 0, rachatEffectue: false, montantRachatCapi: 0 };

    // Mise à jour état capitalisation pour l'année suivante
    if (capiResult.rachatEffectue) {
      if (capitalisation?.repetitionAuTerme) {
        // Redémarre un nouveau cycle avec le montant initial
        capiState = {
          valeurActuelle: capitalisation.montant ?? 0,
          capitalInvesti: capitalisation.montant ?? 0,
        };
      } else {
        capiState = { valeurActuelle: 0, capitalInvesti: 0 };
      }
    } else {
      capiState = { valeurActuelle: capiResult.valeurCapiApres, capitalInvesti: capiState.capitalInvesti };
    }

    // ── Étape 3b : dividendes filiales (holding mère-fille) ──────────────────
    const dividendesFiliales = holding?.actif ? (holding.dividendesFiliales ?? 0) : 0;

    // ── Étape 4 : intérêts crédit IS ─────────────────────────────────────────
    const creditISAnnee = creditISSchedule[year - 1] ?? {
      annuiteCreditIS: 0,
      interetsCreditIS: 0,
      capitalRembourse: 0,
      revenusActifFinance: 0,
    };
    const interetsCreditIS = creditISAnnee.interetsCreditIS;
    const annuiteCreditIS = creditISAnnee.annuiteCreditIS;
    const revenusActifFinance = creditISAnnee.revenusActifFinance;

    // ── Étape 5 : charges structure ──────────────────────────────────────────
    const chargesStructure = fraisStructureAnnuels;

    // ── Étape 6 : résultat comptable / fiscal avant IS ───────────────────────
    const resultatComptableSansHolding =
      distResult.revenuDistrib + capiResult.gainCapiN + revenusActifFinance
      - interetsCreditIS - chargesStructure;

    const holdingResult = calculResultatFiscalHolding(
      resultatComptableSansHolding,
      dividendesFiliales,
      holding,
      params,
    );

    const resultatComptableAvantIS = holdingResult.resultatComptable;
    const resultatFiscalAvantIS = holdingResult.resultatFiscal;
    const quotePartTaxable = holdingResult.quotePartTaxable;
    const dividendesFilialesExoneres = holdingResult.dividendesFilialesExoneres;

    // ── Étape 7 : IS ─────────────────────────────────────────────────────────
    const { baseIS, is } = calculBaseEtIS(resultatFiscalAvantIS, params);

    // ── Étape 8 : résultat net comptable + capacité distribuable ─────────────
    const resultatNetComptable = resultatComptableAvantIS - is;
    const capaciteDistribuable = Math.max(0, reservesDebut + resultatNetComptable);

    // ── Étape 9 : dividendes crédit IR demandés ───────────────────────────────
    const creditIRResult =
      creditIR?.actif
        ? calculCreditIR(creditIR, params, year)
        : { mensualite: 0, annuite: 0, dividendesBrutsDemandes: 0 };
    const dividendesBrutsCreditIRDemandes = creditIRResult.dividendesBrutsDemandes;

    // ── Étape 10 : remboursement CCA + dividendes complémentaires retraite ────
    // montantRachatCapi = valeurCapiApres à la sortie (capital + gain) ; gainCapiN = gain seul (base IS)
    const tresorerieDisponibleApresIS = Math.max(0, tresorerieDebut + distResult.revenuDistrib
      + dividendesFiliales + apportCCA + capiResult.montantRachatCapi + revenusActifFinance
      - is - annuiteCreditIS - chargesStructure);

    const retraitsCCA = calculRemboursementCCA({
      besoinsRetraiteAnnuels,
      ccaRestantDu: ccaRestant,
      tresorerieDisponibleApresIS,
      enPhaseRetraite,
    });

    const besoinNetRestant = enPhaseRetraite
      ? Math.max(0, besoinsRetraiteAnnuels - retraitsCCA)
      : 0;
    const dividendesComplementairesBrutsDemandes =
      besoinNetRestant > 0 && params.pfuTotal < 1
        ? besoinNetRestant / (1 - params.pfuTotal)
        : 0;

    // ── Étape 11 : plafonnement dividendes ────────────────────────────────────
    const dividendesDemandesTotaux =
      dividendesBrutsCreditIRDemandes + dividendesComplementairesBrutsDemandes;

    const tresoDispoApresCCAEtIS = Math.max(
      0,
      tresorerieDisponibleApresIS - retraitsCCA,
    );

    const dividendesAssociesBruts = Math.min(
      dividendesDemandesTotaux,
      capaciteDistribuable,
      tresoDispoApresCCAEtIS,
    );

    const alerteDividendesSuperieursCapacite = dividendesAssociesBruts < dividendesDemandesTotaux;
    const pfuDividendes = dividendesAssociesBruts * params.pfuTotal;

    const revenusNets = retraitsCCA + dividendesAssociesBruts - pfuDividendes;
    const deltaBesoin = revenusNets - besoinsRetraiteAnnuels;

    // ── Étape 12 : trésorerie fin d'année (Convention Option A) ───────────────
    // Sortie brute unique pour dividendes — pas de double comptage du PFU
    // montantRachatCapi remplace gainCapiN : le cash entrant est le montant total racheté,
    // pas seulement le gain (le gain IS est déjà déduit via `is` dans fluxSortants).
    const fluxEntrants =
      distResult.revenuDistrib + dividendesFiliales + apportCCA
      + capiResult.montantRachatCapi + revenusActifFinance;
    const fluxSortants =
      is + retraitsCCA + dividendesAssociesBruts + annuiteCreditIS + chargesStructure;
    const tresorerieFin = tresorerieDebut + fluxEntrants - fluxSortants;

    // ── Étape 13 : CCA restant dû ─────────────────────────────────────────────
    // apportCCA augmente la dette, retraitsCCA la rembourse (invariant 1 : ≥ 0)
    const nouveauCCARestant = Math.max(0, ccaRestant + apportCCA - retraitsCCA);

    // ── Étape 14 : réserves finales ───────────────────────────────────────────
    const miseEnReserve = resultatNetComptable - dividendesAssociesBruts;
    const reservesFin = reservesDebut + miseEnReserve;

    rows.push({
      year,
      apportCCA,
      ccaCumule,
      ccaRestant: nouveauCCARestant,
      retraitsCCA,
      capitalDistrib: distResult.capitalDistrib,
      revenuDistrib: distResult.revenuDistrib,
      capitalCapi: capiResult.capitalCapi,
      valeurCapi: capiResult.valeurCapiApres,
      gainCapiN: capiResult.gainCapiN,
      isLatentCapi: capiResult.isLatentCapi,
      montantRachatCapi: capiResult.montantRachatCapi,
      dividendesFiliales,
      dividendesFilialesExoneres,
      quotePartTaxable,
      chargesStructure,
      interetsCreditIS,
      resultatComptableAvantIS,
      resultatFiscalAvantIS,
      baseIS,
      is,
      resultatNetComptable,
      dividendesBrutsCreditIRDemandes,
      dividendesComplementairesBrutsDemandes,
      dividendesDemandesTotaux,
      dividendesAssociesBruts,
      pfu: pfuDividendes,
      reservesDebut,
      capaciteDistribuable,
      miseEnReserve,
      reservesFin,
      alerteDividendesSuperieursCapacite,
      annuiteCreditIS,
      revenusActifFinance,
      revenusNets,
      deltaBesoin,
      tresorerieDebut,
      tresorerieFin,
    });

    // Mise à jour des variables de stock pour l'année suivante
    tresorerieDebut = tresorerieFin;
    ccaRestant = nouveauCCARestant;
    reservesDebut = reservesFin;
  }

  return rows;
}
