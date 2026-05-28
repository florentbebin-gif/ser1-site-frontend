import type {
  AllocationPocketInput,
  AssociateInput,
  CapitalisationPocketInput,
  CompanyLoanInput,
  DistributionPocketInput,
  SubsidiaryInput,
  TresoInputsV6,
} from '@/engine/tresorerie/types';
import type {
  TresoInputs,
  TresoInputsV2,
  TresoInputsV3,
  TresoInputsV4,
  TresoInputsV5,
} from '@/engine/tresorerie/migrations/compatTypes';
import { buildTresoInputsV5FromV4 as buildTresoInputsV5FromV4Internal } from './tresorerieV5Migration';
import { buildTresoInputsV6FromV5 as buildTresoInputsV6FromV5Internal } from './tresorerieV6Migration';

const DEFAULT_ASSOCIATE_ID = 'associe-1';

const DEFAULT_COMPANY_LABEL = 'Holding patrimoniale';

type LegacyAssociateFields = {
  ccaInitial?: number;
  ccaAnnualContribution?: number;
  ccaContributionEndYear?: number;
  remunerationAnnualCost?: number;
  remunerationEndYear?: number;
  socialChargesManualRate?: number;
};

type LegacySubsidiaryFields = {
  displayOrder?: number;
  annualServicesRevenue?: number;
  annualDividends?: number;
  disposalYear?: number;
  estimatedDisposalPrice?: number;
  taxBasis?: number;
};

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
    horizon: 'court_terme',
    durationYears,
    annualReturnRate: distribution.rendementDistribue ?? 0,
    enjoymentDelayMonths: distribution.delaiJouissanceMois ?? 0,
    initialAllocationPct: treasuryBase > 0 ? (distribution.montant / treasuryBase) * 100 : 0,
    annualAllocationPct: 0,
    repeatAtTerm: distribution.repetitionAuTerme ?? false,
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
    horizon: 'long_terme',
    durationYears,
    annualReturnRate: capitalisation.rendementAnnuel ?? 0,
    enjoymentDelayMonths: 0,
    initialAllocationPct: treasuryBase > 0 ? (capitalisation.montant / treasuryBase) * 100 : 0,
    annualAllocationPct: 0,
    repeatAtTerm: capitalisation.repetitionAuTerme ?? false,
  };
}

function buildCompanyLoan(input: TresoInputs): CompanyLoanInput[] {
  const credit = input.creditIS;
  if (!credit?.actif) return [];
  return [
    {
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
    },
  ];
}

function buildSubsidiaries(input: TresoInputs): SubsidiaryInput[] {
  const holding = input.holding;
  if (!holding?.actif) return [];
  const projectionStartYear = input.anneeCivileDebut ?? currentYear();
  return [
    {
      id: 'filiale-1',
      label: 'Filiale 1',
      parentEntityId: 'societe',
      ownershipPct: holding.tauxDetention,
      holdingOwnershipPct: holding.tauxDetention,
      motherDaughterEligible: holding.regimeMereFilleEligible,
      fiscalIntegrationEstimateEnabled: holding.regimeGroupeFiscal,
      servicesSchedule: [],
      dividendsSchedule: scheduleFromAnnualAmount(holding.dividendesFiliales, projectionStartYear),
    },
  ];
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
      projectionStartYear,
      creationType: input.typeCreation,
      legalForm: 'sas',
      shareCapital: 0,
      sharePremium: 0,
      reservesInitial: input.reservesInitiales ?? 0,
      treasuryInitial,
      annualStructureCosts: input.fraisStructureAnnuels,
      reducedCorporateTaxEligible: true,
      associates: [
        {
          id: DEFAULT_ASSOCIATE_ID,
          label: 'Associé 1',
          ownershipLots: [
            {
              right: 'pleine_propriete',
              capitalPct: 100,
              economicRightsPct: 100,
            },
          ],
          roles: ['associe_sans_statut'],
          cca: {
            currentBalance: input.ccaInitial,
            exceptionalContributions: [],
            annualContribution: {
              amount: input.apportAnnuelCCA,
              startYear: projectionStartYear,
              endYear: endYearFromDuration(projectionStartYear, input.dureeActiveAns),
            },
            remunerationRate: 0,
          },
          remuneration: {
            source: 'holding',
            loadedAnnualCost: 0,
            socialChargeRate: 0,
          },
        },
      ],
      loans: buildCompanyLoan(input),
      subsidiaries: buildSubsidiaries(input),
    },
    allocationMatrix: {
      sweepThreshold: 0,
      pockets,
    },
  };
}

export function buildTresoInputsV3FromV2(input: TresoInputsV2): TresoInputsV3 {
  const selectedAssociateId = input.foyer.selectedAssociateId || DEFAULT_ASSOCIATE_ID;
  const projectionStartYear = input.foyer.projectionStartYear;
  const associates = input.company.associates.map((associate, index) => {
    const legacyAssociate = associate as AssociateInput & LegacyAssociateFields;
    const isSelected = associate.id === selectedAssociateId;
    const annualContributionStartYear = projectionStartYear;
    const cca = associate.cca ?? {
      currentBalance: legacyAssociate.ccaInitial ?? 0,
      exceptionalContributions: [],
      annualContribution: {
        amount: legacyAssociate.ccaAnnualContribution ?? 0,
        startYear: annualContributionStartYear,
        endYear: legacyAssociate.ccaContributionEndYear,
      },
      remunerationRate: 0,
    };
    const remuneration = associate.remuneration ?? {
      source: 'holding' as const,
      loadedAnnualCost: Math.max(0, legacyAssociate.remunerationAnnualCost ?? 0),
      socialChargeRate: Math.max(0, legacyAssociate.socialChargesManualRate ?? 0),
      endYear: legacyAssociate.remunerationEndYear,
    };
    return {
      id: associate.id,
      label: associate.label,
      kind: associate.kind ?? 'pp',
      profile:
        associate.profile ??
        (isSelected
          ? {
              currentAge: input.foyer.currentAge,
              retirementAge: input.foyer.retirementAge,
              annualIncomeNeed: input.foyer.annualIncomeNeed,
              projectionStartYear,
            }
          : undefined),
      ownershipLots:
        associate.ownershipLots.length > 0
          ? associate.ownershipLots
          : [
              {
                right: 'pleine_propriete' as const,
                capitalPct: index === 0 ? 100 : 0,
                economicRightsPct: index === 0 ? 100 : 0,
              },
            ],
      roles: associate.roles,
      cca,
      remuneration,
    };
  });

  return {
    ...input,
    version: 3,
    selectedAssociateId,
    company: {
      ...input.company,
      projectionStartYear: input.company.projectionStartYear ?? projectionStartYear,
      companyKind: input.company.companyKind ?? 'holding_patrimoniale',
      incomeStatement: input.company.incomeStatement ?? {
        annualRevenue: 0,
        annualStructureCosts: input.company.annualStructureCosts,
        workingCapitalRequirement: 0,
      },
      associates,
      subsidiaries: input.company.subsidiaries.map((subsidiary) => {
        const legacySubsidiary = subsidiary as SubsidiaryInput & LegacySubsidiaryFields;
        const servicesSchedule =
          subsidiary.servicesSchedule ??
          scheduleFromAnnualAmount(
            legacySubsidiary.annualServicesRevenue ?? 0,
            projectionStartYear,
          );
        const dividendsSchedule =
          subsidiary.dividendsSchedule ??
          scheduleFromAnnualAmount(legacySubsidiary.annualDividends ?? 0, projectionStartYear);
        const disposal =
          subsidiary.disposal ??
          (legacySubsidiary.disposalYear
            ? {
                year: legacySubsidiary.disposalYear,
                estimatedPrice: legacySubsidiary.estimatedDisposalPrice ?? 0,
                taxBasis: legacySubsidiary.taxBasis ?? 0,
                fees: 0,
                regime: 'auto' as const,
              }
            : undefined);
        return {
          id: subsidiary.id,
          label: subsidiary.label,
          parentEntityId: subsidiary.parentEntityId ?? 'societe',
          ownershipPct: subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct,
          holdingOwnershipPct: subsidiary.holdingOwnershipPct,
          motherDaughterEligible: subsidiary.motherDaughterEligible,
          fiscalIntegrationEstimateEnabled: subsidiary.fiscalIntegrationEstimateEnabled,
          estimatedFiscalResult: subsidiary.estimatedFiscalResult,
          treasuryInitial: subsidiary.treasuryInitial,
          workingCapitalRequirement: subsidiary.workingCapitalRequirement,
          distributableReserves: subsidiary.distributableReserves,
          servicesSchedule,
          dividendsSchedule,
          disposal,
        };
      }),
    },
    allocationMatrix: {
      ...input.allocationMatrix,
      pockets: input.allocationMatrix.pockets.map((pocket, index) => ({
        ...pocket,
        horizon:
          pocket.horizon ??
          (index === 0 ? 'court_terme' : index === 1 ? 'long_terme' : 'moyen_terme'),
      })),
    },
  };
}

export function buildTresoInputsV3FromLegacy(input: TresoInputs): TresoInputsV3 {
  return buildTresoInputsV3FromV2(buildTresoInputsV2FromLegacy(input));
}

function scheduleFromAnnualAmount(amount: number, startYear: number) {
  return amount > 0 ? [{ amount, startYear }] : [];
}

function normalizeProjectionStartYear(input: TresoInputsV3): number {
  const companyYear = input.company.projectionStartYear;
  if (typeof companyYear === 'number' && Number.isFinite(companyYear) && companyYear > 0) {
    return companyYear;
  }

  const associateYears = input.company.associates
    .map((associate) => associate.profile?.projectionStartYear)
    .filter(
      (year): year is number => typeof year === 'number' && Number.isFinite(year) && year > 0,
    );
  if (associateYears.length > 0) return Math.min(...associateYears);

  return input.foyer.projectionStartYear || currentYear();
}

export function buildTresoInputsV4FromV3(input: TresoInputsV3): TresoInputsV4 {
  const projectionStartYear = normalizeProjectionStartYear(input);
  return {
    ...input,
    version: 4,
    foyer: {
      selectedAssociateId: input.foyer.selectedAssociateId,
    },
    company: {
      ...input.company,
      label: input.company.label ?? DEFAULT_COMPANY_LABEL,
      projectionStartYear,
      associates: input.company.associates.map((associate) => {
        const legacyAssociate = associate as AssociateInput & LegacyAssociateFields;
        return {
          id: associate.id,
          label: associate.label,
          kind: associate.kind,
          profile: associate.profile
            ? { ...associate.profile, projectionStartYear }
            : associate.profile,
          ownershipLots: associate.ownershipLots,
          roles: associate.roles,
          cca: associate.cca ?? {
            currentBalance: legacyAssociate.ccaInitial ?? 0,
            exceptionalContributions: [],
            annualContribution: {
              amount: legacyAssociate.ccaAnnualContribution ?? 0,
              startYear: projectionStartYear,
              endYear: legacyAssociate.ccaContributionEndYear,
            },
            remunerationRate: 0,
          },
          remuneration: associate.remuneration ?? {
            source: 'holding' as const,
            loadedAnnualCost: Math.max(0, legacyAssociate.remunerationAnnualCost ?? 0),
            socialChargeRate: Math.max(0, legacyAssociate.socialChargesManualRate ?? 0),
            endYear: legacyAssociate.remunerationEndYear,
          },
        };
      }),
      subsidiaries: input.company.subsidiaries.map((subsidiary) => {
        const legacySubsidiary = subsidiary as SubsidiaryInput & LegacySubsidiaryFields;
        return {
          id: subsidiary.id,
          label: subsidiary.label,
          parentEntityId: subsidiary.parentEntityId ?? 'societe',
          ownershipPct: subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct,
          holdingOwnershipPct: subsidiary.holdingOwnershipPct,
          motherDaughterEligible: subsidiary.motherDaughterEligible,
          fiscalIntegrationEstimateEnabled: subsidiary.fiscalIntegrationEstimateEnabled,
          estimatedFiscalResult: subsidiary.estimatedFiscalResult,
          treasuryInitial: subsidiary.treasuryInitial ?? 0,
          workingCapitalRequirement: subsidiary.workingCapitalRequirement ?? 0,
          distributableReserves: subsidiary.distributableReserves ?? 0,
          servicesSchedule:
            subsidiary.servicesSchedule ??
            scheduleFromAnnualAmount(
              legacySubsidiary.annualServicesRevenue ?? 0,
              projectionStartYear,
            ),
          dividendsSchedule:
            subsidiary.dividendsSchedule ??
            scheduleFromAnnualAmount(legacySubsidiary.annualDividends ?? 0, projectionStartYear),
          disposal:
            subsidiary.disposal ??
            (legacySubsidiary.disposalYear
              ? {
                  year: legacySubsidiary.disposalYear,
                  estimatedPrice: legacySubsidiary.estimatedDisposalPrice ?? 0,
                  taxBasis: legacySubsidiary.taxBasis ?? 0,
                  fees: 0,
                  regime: 'auto' as const,
                }
              : undefined),
        };
      }),
    },
    allocationMatrix: {
      ...input.allocationMatrix,
      minimumBankBalance:
        input.allocationMatrix.minimumBankBalance ?? input.allocationMatrix.sweepThreshold ?? 0,
      pockets: input.allocationMatrix.pockets.map((pocket, index) => ({
        ...pocket,
        horizon:
          pocket.horizon ??
          (index === 0 ? 'court_terme' : index === 1 ? 'long_terme' : 'moyen_terme'),
      })),
    },
  };
}

export function buildTresoInputsV4FromV2(input: TresoInputsV2): TresoInputsV4 {
  return buildTresoInputsV4FromV3(buildTresoInputsV3FromV2(input));
}

export function buildTresoInputsV4FromLegacy(input: TresoInputs): TresoInputsV4 {
  return buildTresoInputsV4FromV2(buildTresoInputsV2FromLegacy(input));
}

export function buildTresoInputsV5FromV4(input: TresoInputsV4 | TresoInputsV5): TresoInputsV5 {
  return buildTresoInputsV5FromV4Internal(input);
}

export function buildTresoInputsV5FromV3(input: TresoInputsV3): TresoInputsV5 {
  return buildTresoInputsV5FromV4(buildTresoInputsV4FromV3(input));
}

export function buildTresoInputsV5FromV2(input: TresoInputsV2): TresoInputsV5 {
  return buildTresoInputsV5FromV4(buildTresoInputsV4FromV2(input));
}

export function buildTresoInputsV5FromLegacy(input: TresoInputs): TresoInputsV5 {
  return buildTresoInputsV5FromV4(buildTresoInputsV4FromLegacy(input));
}

export function buildTresoInputsV6FromV5(input: TresoInputsV5 | TresoInputsV6): TresoInputsV6 {
  return buildTresoInputsV6FromV5Internal(input);
}

export function buildTresoInputsV6FromV4(
  input: TresoInputsV4 | TresoInputsV5 | TresoInputsV6,
): TresoInputsV6 {
  return input.version === 6 ? input : buildTresoInputsV6FromV5(buildTresoInputsV5FromV4(input));
}

export function buildTresoInputsV6FromV3(input: TresoInputsV3): TresoInputsV6 {
  return buildTresoInputsV6FromV4(buildTresoInputsV4FromV3(input));
}

export function buildTresoInputsV6FromV2(input: TresoInputsV2): TresoInputsV6 {
  return buildTresoInputsV6FromV4(buildTresoInputsV4FromV2(input));
}

export function buildTresoInputsV6FromLegacy(input: TresoInputs): TresoInputsV6 {
  return buildTresoInputsV6FromV4(buildTresoInputsV4FromLegacy(input));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function hasVersion(value: unknown, version: number): boolean {
  return isObject(value) && value.version === version;
}

export function migrateUnknownTresorerieInputsToV6(input: unknown): TresoInputsV6 | null {
  if (!isObject(input)) return null;
  if (hasVersion(input, 6)) return input as unknown as TresoInputsV6;
  if (hasVersion(input, 5)) return buildTresoInputsV6FromV5(input as unknown as TresoInputsV5);
  if (hasVersion(input, 4)) return buildTresoInputsV6FromV4(input as unknown as TresoInputsV4);
  if (hasVersion(input, 3)) return buildTresoInputsV6FromV3(input as unknown as TresoInputsV3);
  if (hasVersion(input, 2)) return buildTresoInputsV6FromV2(input as unknown as TresoInputsV2);

  const embeddedV2 = input.v2;
  if (hasVersion(embeddedV2, 2)) {
    return buildTresoInputsV6FromV2(embeddedV2 as unknown as TresoInputsV2);
  }

  return buildTresoInputsV6FromLegacy(input as unknown as TresoInputs);
}
