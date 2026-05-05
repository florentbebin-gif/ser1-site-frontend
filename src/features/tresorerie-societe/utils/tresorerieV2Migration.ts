import type {
  AllocationPocketInput,
  CapitalisationPocketInput,
  CompanyLoanInput,
  DistributionPocketInput,
  SubsidiaryInput,
  TresoInputs,
  TresoInputsV2,
} from '@/engine/tresorerie/types';

const DEFAULT_ASSOCIATE_ID = 'associe-1';

function currentYear(): number {
  return new Date().getFullYear();
}

function endYearFromDuration(startYear: number, durationYears: number): number | undefined {
  if (durationYears <= 0) return undefined;
  return startYear + durationYears - 1;
}

function buildDistributionPocket(
  distribution: DistributionPocketInput | undefined,
  treasuryBase: number,
): AllocationPocketInput | null {
  if (!distribution) return null;
  const durationYears = distribution.dureeAns ?? 0;
  return {
    id: 'poche-distribution-1',
    kind: 'distribution',
    durationYears,
    annualReturnRate: distribution.rendementDistribue ?? 0,
    enjoymentDelayMonths: distribution.delaiJouissanceMois ?? 0,
    initialAllocationPct: treasuryBase > 0 ? distribution.montant / treasuryBase * 100 : 0,
    annualAllocationPct: 0,
    repeatAtTerm: distribution.repetitionAuTerme ?? false,
    termDestination: distribution.repetitionAuTerme ? 'same_pocket' : 'treasury',
  };
}

function buildCapitalisationPocket(
  capitalisation: CapitalisationPocketInput | undefined,
  treasuryBase: number,
): AllocationPocketInput | null {
  if (!capitalisation) return null;
  const durationYears = capitalisation.dureeAns ?? 0;
  return {
    id: 'poche-capitalisation-1',
    kind: 'capitalisation',
    durationYears,
    annualReturnRate: capitalisation.rendementAnnuel ?? 0,
    enjoymentDelayMonths: 0,
    initialAllocationPct: treasuryBase > 0 ? capitalisation.montant / treasuryBase * 100 : 0,
    annualAllocationPct: 0,
    repeatAtTerm: capitalisation.repetitionAuTerme ?? false,
    termDestination: capitalisation.repetitionAuTerme ? 'same_pocket' : 'treasury',
  };
}

function buildCompanyLoan(input: TresoInputs): CompanyLoanInput[] {
  const credit = input.creditIS;
  if (!credit?.actif) return [];
  return [{
    id: 'emprunt-is-1',
    label: 'Emprunt IS 1',
    principal: credit.capitalEmprunte,
    annualRate: credit.taux,
    durationMonths: credit.dureeMois,
    startDate: credit.dateDeblocage ?? `${input.anneeCivileDebut ?? currentYear()}-01`,
    existingLoan: false,
    deductibleInterest: credit.interetsDeductibles,
    financedAssetKind: credit.actifFinance ? 'autre' : undefined,
    financedAssetLabel: credit.actifFinance,
    financedAssetReturnRate: credit.rendementActifFinance,
    enjoymentDelayMonths: credit.delaiJouissanceMois,
  }];
}

function buildSubsidiaries(input: TresoInputs): SubsidiaryInput[] {
  const holding = input.holding;
  if (!holding?.actif) return [];
  return [{
    id: 'filiale-1',
    label: 'Filiale 1',
    holdingOwnershipPct: holding.tauxDetention,
    annualServicesRevenue: 0,
    annualDividends: holding.dividendesFiliales,
    motherDaughterEligible: holding.regimeMereFilleEligible,
    fiscalIntegrationEstimateEnabled: holding.regimeGroupeFiscal,
  }];
}

export function getAllocationPocketLabel(pocket: AllocationPocketInput): string {
  if (pocket.label?.trim()) return pocket.label.trim();
  const kindLabel = pocket.kind === 'distribution' ? 'Distribution' : 'Capitalisation';
  return `${kindLabel} ${pocket.durationYears} ans`;
}

export function buildTresoInputsV2FromLegacy(input: TresoInputs): TresoInputsV2 {
  const projectionStartYear = input.anneeCivileDebut ?? currentYear();
  const legacyPlacementAmount =
    (input.distribution?.montant ?? 0) + (input.capitalisation?.montant ?? 0);
  const treasuryInitial = Math.max(input.tresorerieInitiale ?? 0, legacyPlacementAmount);
  const pockets = [
    buildDistributionPocket(input.distribution, treasuryInitial),
    buildCapitalisationPocket(input.capitalisation, treasuryInitial),
  ].filter((pocket): pocket is AllocationPocketInput => pocket !== null);

  return {
    version: 2,
    foyer: {
      selectedAssociateId: DEFAULT_ASSOCIATE_ID,
      currentAge: input.ageActuel,
      retirementAge: input.ageRetraite,
      annualIncomeNeed: input.besoinsRetraiteAnnuels,
      projectionStartYear,
    },
    company: {
      creationType: input.typeCreation,
      legalForm: 'sas',
      shareCapital: 0,
      sharePremium: 0,
      reservesInitial: input.reservesInitiales ?? 0,
      treasuryInitial,
      annualStructureCosts: input.fraisStructureAnnuels,
      reducedCorporateTaxEligible: true,
      associates: [{
        id: DEFAULT_ASSOCIATE_ID,
        label: 'Associé 1',
        ownershipLots: [{
          right: 'pleine_propriete',
          capitalPct: 100,
          economicRightsPct: 100,
        }],
        roles: ['associe_sans_statut'],
        ccaInitial: input.ccaInitial,
        ccaAnnualContribution: input.apportAnnuelCCA,
        ccaContributionEndYear: endYearFromDuration(projectionStartYear, input.dureeActiveAns),
        remunerationAnnualCost: 0,
      }],
      loans: buildCompanyLoan(input),
      subsidiaries: buildSubsidiaries(input),
    },
    allocationMatrix: {
      sweepThreshold: 0,
      pockets,
    },
  };
}
