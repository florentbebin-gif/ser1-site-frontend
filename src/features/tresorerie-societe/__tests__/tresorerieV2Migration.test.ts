import { describe, expect, it } from 'vitest';
import type { TresoInputs, TresoProjectionRow } from '@/engine/tresorerie/types';
import {
  buildTresoInputsV4FromLegacy,
  buildTresoInputsV4FromV2,
  buildTresoInputsV4FromV3,
  buildTresoInputsV3FromLegacy,
  buildTresoInputsV3FromV2,
  getAllocationPocketLabel,
} from '../utils/tresorerieV2Migration';

const LEGACY_INPUTS: TresoInputs = {
  typeCreation: 'existante',
  ageActuel: 52,
  ageRetraite: 64,
  besoinsRetraiteAnnuels: 42000,
  fraisStructureAnnuels: 4500,
  ccaInitial: 80000,
  apportAnnuelCCA: 12000,
  dureeActiveAns: 10,
  tresorerieInitiale: 150000,
  reservesInitiales: 220000,
  anneeCivileDebut: 2027,
  distribution: {
    montant: 100000,
    rendementDistribue: 0.045,
    delaiJouissanceMois: 3,
    dureeAns: 5,
    repetitionAuTerme: true,
  },
  capitalisation: {
    montant: 50000,
    rendementAnnuel: 0.035,
    dureeAns: 8,
    rachatAuTerme: true,
  },
  creditIS: {
    actif: true,
    capitalEmprunte: 90000,
    taux: 0.032,
    dureeMois: 144,
    dateDeblocage: '2025-04',
    actifFinance: 'SCPI',
    rendementActifFinance: 0.047,
    delaiJouissanceMois: 6,
    interetsDeductibles: true,
  },
  holding: {
    actif: true,
    regimeMereFilleEligible: true,
    regimeGroupeFiscal: false,
    tauxDetention: 80,
    dureeConservationTitresAns: 3,
    dividendesFiliales: 18000,
  },
};

describe('migration trésorerie v3', () => {
  it('construit le profil associé PP, la société, le CCA et les flux legacy dans TresoInputsV3', () => {
    const v3 = buildTresoInputsV3FromLegacy(LEGACY_INPUTS);

    expect(v3.version).toBe(3);
    expect(v3.selectedAssociateId).toBe('associe-1');
    expect(v3.company.creationType).toBe('existante');
    expect(v3.company.companyKind).toBe('holding_patrimoniale');
    expect(v3.company.legalForm).toBe('sas');
    expect(v3.company.incomeStatement).toEqual({
      annualRevenue: 0,
      annualStructureCosts: 4500,
      workingCapitalRequirement: 0,
    });
    expect(v3.company.reservesInitial).toBe(220000);
    expect(v3.company.treasuryInitial).toBe(150000);
    expect(v3.company.associates[0]).toMatchObject({
      id: 'associe-1',
      label: 'Associé 1',
      kind: 'pp',
      profile: {
        currentAge: 52,
        retirementAge: 64,
        annualIncomeNeed: 42000,
        projectionStartYear: 2027,
      },
      cca: {
        currentBalance: 80000,
        annualContribution: {
          amount: 12000,
          startYear: 2027,
          endYear: 2036,
        },
        exceptionalContributions: [],
        remunerationRate: 0,
      },
    });
    expect(v3.company.associates[0].ownershipLots).toEqual([
      { right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 },
    ]);
    expect(v3.company.loans[0]).toMatchObject({
      principal: 90000,
      financedAssetLabel: 'SCPI',
      financedAssetReturnRate: 0.047,
      enjoymentDelayMonths: 6,
    });
    expect(v3.company.subsidiaries[0]).toMatchObject({
      parentEntityId: 'societe',
      ownershipPct: 80,
      displayOrder: 0,
      annualDividends: 18000,
      motherDaughterEligible: true,
    });
    expect(v3.allocationMatrix.pockets).toHaveLength(2);
    expect(v3.allocationMatrix.pockets.map(getAllocationPocketLabel)).toEqual([
      'Distribution 5 ans',
      'Capitalisation 8 ans',
    ]);
    expect(v3.allocationMatrix.pockets[0]).toMatchObject({
      horizon: 'court_terme',
      initialAllocationPct: 66.66666666666666,
      annualAllocationPct: 0,
    });
    expect(v3.allocationMatrix.pockets[1]).toMatchObject({
      horizon: 'long_terme',
      initialAllocationPct: 33.33333333333333,
      annualAllocationPct: 0,
    });
  });

  it("reste compatible avec les sessions v2 en migrant le foyer vers l'associé PP sélectionné", () => {
    const v2 = {
      version: 2,
      foyer: {
        selectedAssociateId: 'associe-1',
        currentAge: 48,
        retirementAge: 63,
        annualIncomeNeed: 36000,
        projectionStartYear: 2028,
      },
      company: {
        creationType: 'newco',
        legalForm: 'sas',
        shareCapital: 10000,
        sharePremium: 0,
        reservesInitial: 0,
        treasuryInitial: 120000,
        annualStructureCosts: 2500,
        reducedCorporateTaxEligible: true,
        associates: [{
          id: 'associe-1',
          label: 'Associé historique',
          ownershipLots: [{ right: 'pleine_propriete', capitalPct: 80, economicRightsPct: 80 }],
          roles: ['associe_sans_statut'],
          ccaInitial: 30000,
          ccaAnnualContribution: 6000,
          ccaContributionEndYear: 2030,
          remunerationAnnualCost: 0,
        }],
        loans: [],
        subsidiaries: [{
          id: 'filiale-1',
          label: 'Filiale historique',
          holdingOwnershipPct: 70,
          annualServicesRevenue: 10000,
          annualDividends: 15000,
          motherDaughterEligible: true,
          fiscalIntegrationEstimateEnabled: false,
        }],
      },
      allocationMatrix: {
        sweepThreshold: 50000,
        pockets: [],
      },
    } as any;

    const v3 = buildTresoInputsV3FromV2(v2);

    expect(v3.version).toBe(3);
    expect(v3.selectedAssociateId).toBe('associe-1');
    expect(v3.company.associates[0]).toMatchObject({
      kind: 'pp',
      profile: {
        currentAge: 48,
        retirementAge: 63,
        annualIncomeNeed: 36000,
        projectionStartYear: 2028,
      },
      cca: {
        currentBalance: 30000,
        annualContribution: {
          amount: 6000,
          startYear: 2028,
          endYear: 2030,
        },
      },
    });
    expect(v3.company.incomeStatement?.annualStructureCosts).toBe(2500);
    expect(v3.company.subsidiaries[0]).toMatchObject({
      parentEntityId: 'societe',
      ownershipPct: 70,
    });
    expect(v3.allocationMatrix.pockets).toEqual([]);
  });

  it('prévoit revenusParAssocie sur les lignes de projection dès le socle v2', () => {
    const row = {
      year: 1,
      revenusParAssocie: [],
    } as Pick<TresoProjectionRow, 'year' | 'revenusParAssocie'>;

    expect(row.revenusParAssocie).toEqual([]);
  });

  it('normalise les états legacy et v2 vers V4 avec compte bancaire minimum', () => {
    const legacyV4 = buildTresoInputsV4FromLegacy(LEGACY_INPUTS);

    expect(legacyV4.version).toBe(4);
    expect(legacyV4.allocationMatrix.minimumBankBalance).toBe(0);
    expect(legacyV4.company.label).toBe('Holding patrimoniale');
    expect(legacyV4.company.projectionStartYear).toBe(2027);
    expect(legacyV4.company.subsidiaries[0]).toMatchObject({
      treasuryInitial: 0,
      workingCapitalRequirement: 0,
      distributableReserves: 0,
      servicesSchedule: [],
      dividendsSchedule: [{ amount: 18000, startYear: 2027 }],
    });

    const v2 = {
      ...legacyV4,
      version: 2,
      foyer: legacyV4.foyer,
      allocationMatrix: {
        sweepThreshold: 50_000,
        pockets: [{
          id: 'legacy',
          kind: 'distribution',
          durationYears: 3,
          annualReturnRate: 0.03,
          enjoymentDelayMonths: 0,
          initialAllocationPct: 0,
          annualAllocationPct: 100,
          repeatAtTerm: false,
        }],
      },
    } as any;

    const v4 = buildTresoInputsV4FromV2(v2);

    expect(v4.version).toBe(4);
    expect(v4.allocationMatrix.minimumBankBalance).toBe(50_000);
    expect(v4.allocationMatrix.pockets[0]).toMatchObject({
      id: 'legacy',
      horizon: 'court_terme',
    });
  });

  it('déplace le début de projection au niveau société en retenant l’année la plus ancienne', () => {
    const legacyV4 = buildTresoInputsV4FromLegacy(LEGACY_INPUTS);
    const v3 = {
      ...legacyV4,
      version: 3,
      company: {
        ...legacyV4.company,
        projectionStartYear: undefined,
        associates: [
          {
            ...legacyV4.company.associates[0],
            profile: {
              ...legacyV4.company.associates[0].profile,
              projectionStartYear: 2029,
            },
          },
          {
            ...legacyV4.company.associates[0],
            id: 'associe-2',
            label: 'Associé 2',
            profile: {
              ...legacyV4.company.associates[0].profile,
              projectionStartYear: 2026,
            },
          },
        ],
      },
    } as any;

    const v4 = buildTresoInputsV4FromV3(v3);

    expect(v4.company.projectionStartYear).toBe(2026);
    expect(v4.foyer.projectionStartYear).toBe(2026);
    expect(v4.company.associates.map(associate => associate.profile?.projectionStartYear)).toEqual([2026, 2026]);
  });
});
