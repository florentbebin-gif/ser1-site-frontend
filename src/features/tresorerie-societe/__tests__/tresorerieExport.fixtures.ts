import { migrateUnknownTresorerieInputsToV6 } from '@/engine/tresorerie/migrations/tresorerieV2Migration';
import type { TresoInputsV6, TresoProjectionRow } from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';

export const KPIS: TresoKPIs = {
  ccaTotalConstitue: 234000,
  isTotalDecaisse: 14500,
  isLatentCapi: 7200,
  revenusNetsRetraite: 26000,
  dureeRemboursementCCA: 10,
  valeurNetteSocieteRetraite: 188000,
  reservesRetraite: 42000,
  capaciteDistribuableAn1: 6500,
  alerteDividendesAn1: false,
  deficitBancaireMax: 0,
  compteBancaireFinHorizon: 0,
  ccaRestantFinHorizon: 0,
  ccaRembourseTotal: 0,
  alerteTresorerieBancaire: false,
  premiereAnneeDeficitBancaire: null,
  tresorerieTientHorizon: true,
  revenuCibleTientHorizon: null,
  premiereAnneeRevenuCibleNonTenu: null,
  performanceMoyenneTresorerie: 0,
  hasRows: true,
  anneeRetraiteIndex: 12,
};

function toCurrentInputs(input: unknown): TresoInputsV6 {
  const migrated = migrateUnknownTresorerieInputsToV6(input);
  if (!migrated) {
    throw new Error('Fixture Trésorerie export invalide');
  }
  return migrated;
}

export const INPUTS = toCurrentInputs({
  version: 5,
  selectedAssociateId: 'associe-1',
  foyer: {
    selectedAssociateId: 'associe-1',
    currentAge: 50,
    retirementAge: 62,
    annualIncomeNeed: 24000,
    projectionStartYear: 2026,
  },
  company: {
    creationType: 'newco',
    legalForm: 'sas',
    companyKind: 'holding_patrimoniale',
    shareCapital: 10000,
    sharePremium: 0,
    reservesInitial: 8000,
    treasuryInitial: 150000,
    annualStructureCosts: 3000,
    incomeStatement: {
      annualRevenue: 0,
      annualStructureCosts: 3000,
      workingCapitalRequirement: 50000,
    },
    reducedCorporateTaxEligible: true,
    associates: [
      {
        id: 'associe-1',
        label: 'Associé 1',
        kind: 'pp',
        profile: {
          currentAge: 50,
          retirementAge: 62,
          annualIncomeNeed: 24000,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 90000,
          exceptionalContributions: [{ year: 2028, amount: 15000 }],
          annualContribution: { amount: 12000, startYear: 2026, endYear: 2037 },
          remunerationRate: 0.04,
        },
        remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
        revenuePhases: [
          {
            id: 'phase-remu',
            label: 'Rémunération holding',
            startYear: 2026,
            source: 'holding',
            loadedAnnualCost: 80000,
            socialChargeRate: 0.3,
            annualNetIncomeNeed: 0,
            useCcaForCompletion: true,
          },
          {
            id: 'phase-besoin',
            label: 'Besoin complémentaire',
            startYear: 2031,
            source: 'none',
            loadedAnnualCost: 0,
            socialChargeRate: 0,
            annualNetIncomeNeed: 40000,
            useCcaForCompletion: false,
          },
        ],
      },
    ],
    loans: [
      {
        id: 'pret-1',
        label: 'Emprunt société',
        principal: 90000,
        annualRate: 0.035,
        durationMonths: 120,
        startDate: '2026-01',
        existingLoan: false,
        deductibleInterest: true,
      },
    ],
    subsidiaries: [
      {
        id: 'filiale-1',
        label: 'Filiale',
        parentEntityId: 'societe',
        ownershipPct: 80,
        holdingOwnershipPct: 80,
        motherDaughterEligible: true,
        fiscalIntegrationEstimateEnabled: false,
        servicesSchedule: [],
        dividendsSchedule: [{ amount: 18000, startYear: 2026 }],
      },
    ],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    pockets: [
      {
        id: 'distribution-1',
        label: 'Court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        durationYears: 5,
        annualReturnRate: 0.045,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 60,
        annualAllocationPct: 70,
        repeatAtTerm: false,
      },
      {
        id: 'capitalisation-1',
        label: 'Long terme',
        kind: 'capitalisation',
        horizon: 'long_terme',
        durationYears: 8,
        annualReturnRate: 0.035,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 40,
        annualAllocationPct: 30,
        repeatAtTerm: false,
      },
    ],
  },
});

function makeRow(year: number): TresoProjectionRow {
  const profile = INPUTS.company.associates[0].profile;
  if (!profile) throw new Error('Fixture Trésorerie export sans profil associé');
  const retirementOffset = profile.retirementAge - profile.currentAge;
  const activeYears = Math.max(1, retirementOffset);
  const isRemuneration = year <= 5;
  const revenusParAssocie = [
    {
      associateId: 'associe-1',
      label: 'Associé 1',
      source: isRemuneration ? ('remuneration' as const) : ('cca' as const),
      remuneration: isRemuneration ? 56000 : 0,
      ccaRepaid: isRemuneration ? 0 : 24000,
      grossDividends: 0,
      dividendTax: 0,
      tnsSocialCharges: isRemuneration ? 24000 : 0,
      netRevenue: isRemuneration ? 56000 : 24000,
    },
  ];
  const revenusNets = revenusParAssocie.reduce((sum, revenu) => sum + revenu.netRevenue, 0);
  return {
    year,
    apportCCA: year <= activeYears ? 12000 : 0,
    ccaCumule: 90000 + Math.min(year, activeYears) * 12000,
    ccaRestant: Math.max(0, 234000 - Math.max(0, year - activeYears) * 24000),
    retraitsCCA: year > activeYears ? 24000 : 0,
    capitalDistrib: 70000,
    revenuDistrib: 3150,
    capitalCapi: 60000,
    valeurCapi: 60000 + year * 2100,
    gainCapiN: 0,
    isLatentCapi: year * 600,
    montantRachatCapi: 0,
    dividendesFiliales: 0,
    dividendesFilialesExoneres: 0,
    quotePartTaxable: 0,
    cessionFilialesCash: 0,
    cessionFilialesPlusValueBrute: 0,
    cessionFilialesQuotePartTaxable: 0,
    chargesStructure: INPUTS.company.annualStructureCosts,
    interetsCCA: 0,
    interetsCCADeductibles: 0,
    interetsCCANonDeductibles: 0,
    interetsCreditIS: 0,
    resultatComptableAvantIS: 150,
    resultatFiscalAvantIS: 150,
    baseIS: 150,
    is: 22,
    resultatNetComptable: 128,
    dividendesBrutsCreditIRDemandes: 0,
    dividendesComplementairesBrutsDemandes: 0,
    dividendesDemandesTotaux: 0,
    dividendesAssociesBruts: 0,
    pfu: 0,
    reservesDebut: 8000 + year * 128,
    reserveLegaleDebut: 0,
    dotationReserveLegale: 0,
    reserveLegaleFin: 0,
    capaciteDistribuable: 6500 + year * 100,
    miseEnReserve: 128,
    reservesFin: 8128 + year * 128,
    alerteDividendesSuperieursCapacite: false,
    annuiteCreditIS: 0,
    revenusActifFinance: 0,
    revenusNets,
    deltaBesoin: revenusNets - (profile.annualIncomeNeed ?? 0),
    revenusParAssocie,
    tresorerieDebut: 15000 + year * 1000,
    tresorerieFin: 16000 + year * 1000,
  };
}

export const ROWS = Array.from({ length: 12 }, (_, index) => makeRow(index + 1));
