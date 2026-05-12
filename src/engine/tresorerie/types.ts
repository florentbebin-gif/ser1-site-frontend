/**
 * types.ts — Types du moteur trésorerie société IS
 *
 * TresoInputs     : entrées legacy du simulateur (migration/compatibilité)
 * TresoInputsV2   : source de vérité du runtime Trésorerie société
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
  /** Quote-part taxable des plus-values long terme sur titres de participation. */
  participationDisposalQpfcRate?: number;
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
  /** Seuil social TNS sur dividendes (ex: 10 % de capital + primes + CCA) */
  tnsDividendBasePct?: number;
  /** Taux maximum déductible des intérêts de CCA. */
  maxDeductibleCcaInterestRate?: number;
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

// ─── Modèle domaine v2 — société, foyer, allocation ──────────────────────────

export type OwnershipRight = 'pleine_propriete' | 'usufruit' | 'nue_propriete';

export interface FoyerInput {
  selectedAssociateId: string;
  currentAge: number;
  retirementAge: number;
  annualIncomeNeed: number;
  projectionStartYear: number;
}

export interface RuntimeFoyerInput {
  selectedAssociateId: string;
}

export interface OwnershipLotInput {
  right: OwnershipRight;
  capitalPct: number;
  economicRightsPct: number;
}

export type AssociateRole =
  | 'gerant_tns'
  | 'cogerant_tns'
  | 'pdg'
  | 'dg'
  | 'associe_sans_statut'
  | 'salarie';

export type AssociateRemunerationSource = 'holding' | 'subsidiary';
export type AssociateRevenuePhaseSource = 'none' | AssociateRemunerationSource;

export interface AssociateRemunerationInput {
  source: AssociateRemunerationSource;
  subsidiaryId?: string;
  loadedAnnualCost: number;
  socialChargeRate: number;
  startYear?: number;
  endYear?: number;
  annualNeedAfterStop?: number;
}

export interface AssociateRevenuePhaseInput {
  id: string;
  startYear: number;
  label?: string;
  source: AssociateRevenuePhaseSource;
  subsidiaryId?: string;
  loadedAnnualCost: number;
  socialChargeRate: number;
  annualNetIncomeNeed: number;
  useCcaForCompletion: boolean;
}

export interface AssociateInput {
  id: string;
  label: string;
  kind?: AssociateKind;
  profile?: AssociateProfileInput;
  ownershipLots: OwnershipLotInput[];
  roles: AssociateRole[];
  cca?: CcaScheduleInput;
  remuneration?: AssociateRemunerationInput;
}

export interface AssociateInputV5 extends Omit<AssociateInput, 'remuneration'> {
  remuneration?: never;
  revenuePhases: AssociateRevenuePhaseInput[];
}

export type FinancedAssetKind = 'scpi' | 'immobilier' | 'autre';

export interface CompanyLoanInput {
  id: string;
  label: string;
  principal: number;
  annualRate: number;
  durationMonths: number;
  startDate: string;
  existingLoan: boolean;
  deductibleInterest: boolean;
  financedAssetKind?: FinancedAssetKind;
  financedAssetLabel?: string;
  financedAssetReturnRate?: number;
  enjoymentDelayMonths?: number;
}

export interface AmountScheduleInput {
  amount: number;
  startYear: number;
  endYear?: number;
}

export type SubsidiaryDisposalRegime = 'auto' | 'pvlt' | 'standard';

export interface SubsidiaryDisposalInput {
  year?: number;
  estimatedPrice: number;
  taxBasis: number;
  fees?: number;
  regime: SubsidiaryDisposalRegime;
  acquisitionYear?: number;
}

export interface SubsidiaryInput {
  id: string;
  label: string;
  parentEntityId?: string;
  ownershipPct?: number;
  holdingOwnershipPct: number;
  motherDaughterEligible: boolean;
  fiscalIntegrationEstimateEnabled: boolean;
  estimatedFiscalResult?: number;
  treasuryInitial?: number;
  workingCapitalRequirement?: number;
  distributableReserves?: number;
  servicesSchedule?: AmountScheduleInput[];
  dividendsSchedule?: AmountScheduleInput[];
  disposal?: SubsidiaryDisposalInput;
}

export type AllocationPocketKind = 'distribution' | 'capitalisation';
export type AllocationPocketHorizon = 'court_terme' | 'moyen_terme' | 'long_terme';

export interface AllocationPocketInput {
  id: string;
  label?: string;
  kind: AllocationPocketKind;
  horizon?: AllocationPocketHorizon;
  durationYears: number;
  annualReturnRate: number;
  enjoymentDelayMonths: number;
  initialAllocationPct: number;
  annualAllocationPct: number;
  repeatAtTerm: boolean;
}

export interface AllocationMatrixInput {
  sweepThreshold: number;
  minimumBankBalance?: number;
  pockets: AllocationPocketInput[];
}

export type LegalForm = 'sas' | 'sc' | 'sarl' | 'sa' | 'selarl' | 'spfpl' | 'selas' | 'autre';
export type CompanyKind =
  | 'holding_patrimoniale'
  | 'holding_remuneration'
  | 'holding_animatrice'
  | 'societe_exploitation';
export type AssociateKind = 'pp' | 'pm';

export interface AssociateProfileInput {
  currentAge: number;
  retirementAge: number;
  annualIncomeNeed: number;
  projectionStartYear: number;
}

export interface CcaExceptionalContributionInput {
  year: number;
  amount: number;
}

export interface CcaAnnualContributionInput {
  amount: number;
  startYear: number;
  endYear?: number;
}

export interface CcaScheduleInput {
  currentBalance: number;
  exceptionalContributions: CcaExceptionalContributionInput[];
  annualContribution: CcaAnnualContributionInput;
  remunerationRate: number;
}

export interface CompanyInput {
  label?: string;
  projectionStartYear?: number;
  creationType: 'newco' | 'existante';
  legalForm: LegalForm;
  companyKind?: CompanyKind;
  shareCapital: number;
  sharePremium: number;
  reservesInitial: number;
  legalReserveInitial?: number;
  treasuryInitial: number;
  annualStructureCosts: number;
  incomeStatement?: {
    annualRevenue: number;
    annualStructureCosts: number;
    workingCapitalRequirement: number;
  };
  reducedCorporateTaxEligible: boolean;
  associates: AssociateInput[];
  loans: CompanyLoanInput[];
  subsidiaries: SubsidiaryInput[];
}

export interface CompanyInputV5 extends Omit<CompanyInput, 'associates'> {
  associates: AssociateInputV5[];
}

export interface TresoInputsV2 {
  version: 2;
  foyer: FoyerInput;
  company: CompanyInput;
  allocationMatrix: AllocationMatrixInput;
}

export interface TresoInputsV3 extends Omit<TresoInputsV2, 'version'> {
  version: 3;
  selectedAssociateId: string;
}

export interface TresoInputsV4 extends Omit<TresoInputsV3, 'version' | 'foyer'> {
  version: 4;
  foyer: RuntimeFoyerInput;
}

export interface TresoInputsV5 extends Omit<TresoInputsV4, 'version' | 'company'> {
  version: 5;
  company: CompanyInputV5;
}

export type TresoInputsRuntime = TresoInputsV2 | TresoInputsV3 | TresoInputsV4 | TresoInputsV5;

// ─── Entrées legacy du simulateur (migration/compatibilité) ───────────────────

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

export type TresoAssociateRevenueSource =
  | 'remuneration'
  | 'cca'
  | 'cca_interets'
  | 'dividendes'
  | 'charges_sociales_tns'
  | 'fiscalite';

export interface TresoAssociateRevenueRow {
  associateId: string;
  label: string;
  source: TresoAssociateRevenueSource;
  remuneration: number;
  ccaRepaid: number;
  grossDividends: number;
  dividendTax: number;
  tnsSocialCharges: number;
  netRevenue: number;
}

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
  cessionFilialesCash?: number;
  cessionFilialesPlusValueBrute?: number;
  cessionFilialesQuotePartTaxable?: number;

  // Résultat
  chargesStructure: number;
  interetsCCA: number;
  interetsCCADeductibles: number;
  interetsCCANonDeductibles: number;
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
  phaseIdActive?: string;
  phaseLabelActive?: string;
  revenusNets: number;
  deltaBesoin: number;
  revenusParAssocie: TresoAssociateRevenueRow[];

  // Trésorerie
  tresorerieDebut: number;
  tresorerieFin: number;
  tresorerieBanqueDebut?: number;
  tresorerieBanqueFin?: number;
  soldeMinimumCompteBancaire?: number;
  bfr?: number;
  tresorerieDisponible?: number;
  montantInvestiInitial?: number;
  montantBalayeAnnuel?: number;
  montantReinvestiAuTerme?: number;
  deficitTresorerieBancaire?: number;
  alerteTresorerieBancaireInsuffisante?: boolean;
}
