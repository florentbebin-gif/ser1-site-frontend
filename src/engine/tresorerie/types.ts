/**
 * types.ts — Types du moteur trésorerie société IS
 *
 * TresoInputs     : entrées du simulateur (structure + poches + crédits + holding)
 * TresoFiscalParams : paramètres fiscaux typés construits par useTresorerieCalculations
 * TresoProjectionRow : ligne de la projection annuelle produite par simulateTresorerie
 *
 * Règle : zéro React, zéro Supabase — types purs.
 */

// ─── Barème IR ────────────────────────────────────────────────────────────────

export interface IRBracket {
  from: number;
  to: number | null;
  rate: number;
  deduction?: number;
}

// ─── Paramètres fiscaux IS (construits par le hook, jamais lus dans le moteur) ──

export interface TresoFiscalParams {
  /** Taux IS normal (ex: 0.25) */
  isNormalRate: number;
  /** Taux IS réduit (ex: 0.15) */
  isReducedRate: number;
  /** Seuil de bénéfice pour le taux réduit (ex: 42 500) */
  isReducedThreshold: number;
  /** Quote-part frais et charges régime mère-fille standard (ex: 0.05) */
  motherDaughterStandardQpfcRate: number;
  /** Quote-part frais et charges régime mère-fille groupe fiscal (ex: 0.01) */
  motherDaughterGroupQpfcRate: number;
  /** Taux IR du PFU (ex: 0.128) */
  pfuRateIR: number;
  /** Taux PS patrimoine (ex: 0.172) */
  psRate: number;
  /** PFU total = pfuRateIR + psRate */
  pfuTotal: number;
  /** Abattement 40 % dividendes barème IR (ex: 0.4) — V1 : non utilisé */
  dividendesAbattement: number;
  /** Barème IR pour option future — V1 : non utilisé */
  irScale: IRBracket[];
}

// ─── Poches de placement ──────────────────────────────────────────────────────

export type StrategieRevenus = 'tresorerie' | 'reinvestir' | 'distribuer';
export type DestinationAuTerme = 'tresorerie' | 'capitalisation' | 'nouvelle_distribution';

export interface DistributionPocketInput {
  montant: number;
  rendementDistribue: number;
  tauxRevalorisation?: number;
  dateSouscription?: string;
  delaiJouissanceMois?: number;
  dureeAns?: number;
  strategieRevenus?: StrategieRevenus;
  repetitionAuTerme?: boolean;
  destinationAuTerme?: DestinationAuTerme;
}

export interface CapitalisationPocketInput {
  montant: number;
  rendementAnnuel: number;
  dateSouscription?: string;
  dureeAns?: number;
  rachatAuTerme?: boolean;
  repetitionAuTerme?: boolean;
  valeurActuelle?: number | null;
  capitalInvestiHistorique?: number | null;
}

// ─── Crédits ──────────────────────────────────────────────────────────────────

export interface CreditIsPocketInput {
  actif: boolean;
  capitalEmprunte: number;
  taux: number;
  dureeMois: number;
  dateDeblocage?: string;
  actifFinance?: string;
  rendementActifFinance?: number;
  delaiJouissanceMois?: number;
  interetsDeductibles: true;
}

export interface CreditIrPocketInput {
  actif: boolean;
  capital: number;
  taux: number;
  dureeMois: number;
  dateDebut?: string;
}

// ─── Holding et régime mère-fille ─────────────────────────────────────────────

export interface HoldingParticipationInput {
  actif: boolean;
  regimeMereFilleEligible: boolean;
  regimeGroupeFiscal: boolean;
  tauxDetention: number;
  dureeConservationTitresAns: number;
  dividendesFiliales: number;
  datePremierDividende?: string;
}

// ─── Entrées globales du simulateur ───────────────────────────────────────────

export interface TresoInputs {
  // Société
  typeCreation: 'newco' | 'existante';
  ageActuel: number;
  ageRetraite: number;
  besoinsRetraiteAnnuels: number;
  fraisStructureAnnuels: number;

  // CCA
  ccaInitial: number;
  apportAnnuelCCA: number;
  dureeActiveAns: number;

  // Société existante — soldes initiaux
  tresorerieInitiale?: number;
  reservesInitiales?: number;
  /** Année civile de début de la projection (ex : 2025). Défaut : année en cours. */
  anneeCivileDebut?: number;

  // Poches
  distribution?: DistributionPocketInput;
  capitalisation?: CapitalisationPocketInput;

  // Crédits
  creditIS?: CreditIsPocketInput;
  creditIR?: CreditIrPocketInput;

  // Holding
  holding?: HoldingParticipationInput;
}

// ─── Ligne de projection annuelle ────────────────────────────────────────────

export interface TresoProjectionRow {
  year: number;

  // Apports
  apportCCA: number;
  ccaCumule: number;
  ccaRestant: number;
  retraitsCCA: number;

  // Placement distribution
  capitalDistrib: number;
  revenuDistrib: number;

  // Placement capitalisation
  capitalCapi: number;
  valeurCapi: number;
  gainCapiN: number;
  isLatentCapi: number;
  /** Montant brut encaissé lors du rachat (capital + gain) — distinct de gainCapiN */
  montantRachatCapi: number;

  // Holding mère-fille
  dividendesFiliales: number;
  dividendesFilialesExoneres: number;
  quotePartTaxable: number;

  // Résultat
  chargesStructure: number;
  interetsCreditIS: number;
  resultatComptableAvantIS: number;
  resultatFiscalAvantIS: number;
  baseIS: number;
  is: number;
  resultatNetComptable: number;

  // Dividendes
  dividendesBrutsCreditIRDemandes: number;
  dividendesComplementairesBrutsDemandes: number;
  dividendesDemandesTotaux: number;
  dividendesAssociesBruts: number;
  pfu: number;

  // Réserves
  reservesDebut: number;
  capaciteDistribuable: number;
  miseEnReserve: number;
  reservesFin: number;
  alerteDividendesSuperieursCapacite: boolean;

  // Crédit IS
  annuiteCreditIS: number;
  /** Revenus bruts de l'actif financé par le crédit IS (SCPI, immo…) */
  revenusActifFinance: number;

  // Revenus nets associés
  revenusNets: number;
  deltaBesoin: number;

  // Trésorerie
  tresorerieDebut: number;
  tresorerieFin: number;
}
