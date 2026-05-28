import { describe, expect, it } from 'vitest';
import type { TresoInputs } from '@/engine/tresorerie/migrations/compatTypes';
import type { TresoProjectionRow } from '@/engine/tresorerie/types';
import {
  buildTresoInputsV5FromV4,
  buildTresoInputsV6FromV5,
  buildTresoInputsV4FromLegacy,
  buildTresoInputsV4FromV2,
  buildTresoInputsV4FromV3,
  buildTresoInputsV3FromLegacy,
  buildTresoInputsV3FromV2,
} from '@/engine/tresorerie/migrations/tresorerieV2Migration';
import { getAllocationPocketLabel } from '@/engine/tresorerie/allocationLabels';

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
      dividendsSchedule: [{ amount: 18000, startYear: 2027 }],
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
        associates: [
          {
            id: 'associe-1',
            label: 'Associé historique',
            ownershipLots: [{ right: 'pleine_propriete', capitalPct: 80, economicRightsPct: 80 }],
            roles: ['associe_sans_statut'],
            cca: {
              currentBalance: 30000,
              exceptionalContributions: [],
              annualContribution: { amount: 6000, startYear: 2028, endYear: 2030 },
              remunerationRate: 0,
            },
            remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
          },
        ],
        loans: [],
        subsidiaries: [
          {
            id: 'filiale-1',
            label: 'Filiale historique',
            holdingOwnershipPct: 70,
            motherDaughterEligible: true,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [{ amount: 10000, startYear: 2028 }],
            dividendsSchedule: [{ amount: 15000, startYear: 2028 }],
          },
        ],
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
        pockets: [
          {
            id: 'legacy',
            kind: 'distribution',
            durationYears: 3,
            annualReturnRate: 0.03,
            enjoymentDelayMonths: 0,
            initialAllocationPct: 0,
            annualAllocationPct: 100,
            repeatAtTerm: false,
          },
        ],
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
    expect(v4.foyer).toEqual({ selectedAssociateId: 'associe-1' });
    expect(
      v4.company.associates.map((associate) => associate.profile?.projectionStartYear),
    ).toEqual([2026, 2026]);
  });

  it('migre une rémunération V4 vers deux paliers de revenus V5', () => {
    const v4 = buildTresoInputsV4FromLegacy(LEGACY_INPUTS);
    const v5 = buildTresoInputsV5FromV4({
      ...v4,
      company: {
        ...v4.company,
        projectionStartYear: 2026,
        associates: [
          {
            ...v4.company.associates[0],
            remuneration: {
              source: 'holding',
              loadedAnnualCost: 80_000,
              socialChargeRate: 0.3,
              startYear: 2026,
              endYear: 2030,
              annualNeedAfterStop: 40_000,
            },
          },
        ],
      },
    });

    expect(v5.version).toBe(5);
    expect(v5.company.associates[0].revenuePhases).toEqual([
      {
        id: 'phase-legacy-1',
        startYear: 2026,
        source: 'holding',
        subsidiaryId: undefined,
        loadedAnnualCost: 80_000,
        socialChargeRate: 0.3,
        annualNetIncomeNeed: 0,
        useCcaForCompletion: true,
      },
      {
        id: 'phase-legacy-2',
        startYear: 2031,
        source: 'none',
        loadedAnnualCost: 0,
        socialChargeRate: 0.3,
        annualNetIncomeNeed: 42_000,
        useCcaForCompletion: true,
      },
    ]);
    expect(v5.company.associates[0].remuneration).toBeUndefined();
  });

  it('garantit un palier par défaut en V5 quand aucune rémunération ni besoin ne sont saisis', () => {
    const v4 = buildTresoInputsV4FromLegacy({
      ...LEGACY_INPUTS,
      besoinsRetraiteAnnuels: 0,
    });
    const v5 = buildTresoInputsV5FromV4({
      ...v4,
      company: {
        ...v4.company,
        projectionStartYear: 2028,
        associates: [
          {
            ...v4.company.associates[0],
            profile: v4.company.associates[0].profile
              ? { ...v4.company.associates[0].profile, annualIncomeNeed: 0 }
              : undefined,
            remuneration: {
              source: 'holding',
              loadedAnnualCost: 0,
              socialChargeRate: 0,
            },
          },
        ],
      },
    });

    expect(v5.company.associates[0].revenuePhases).toEqual([
      {
        id: 'phase-default',
        startYear: 2028,
        source: 'none',
        loadedAnnualCost: 0,
        socialChargeRate: 0,
        annualNetIncomeNeed: 0,
        useCcaForCompletion: true,
      },
    ]);
  });

  it('conserve un état V5 déjà normalisé', () => {
    const v5 = buildTresoInputsV5FromV4(buildTresoInputsV4FromLegacy(LEGACY_INPUTS));

    expect(buildTresoInputsV5FromV4(v5 as any)).toEqual(v5);
  });

  it('migre les paliers V5 vers des sous-phases V6 et découpe les apports CCA par intersection', () => {
    const v5 = buildTresoInputsV5FromV4(buildTresoInputsV4FromLegacy(LEGACY_INPUTS));
    const associate = v5.company.associates[0];
    const v6 = buildTresoInputsV6FromV5({
      ...v5,
      company: {
        ...v5.company,
        projectionStartYear: 2026,
        legalReserveInitial: undefined,
        associates: [
          {
            ...associate,
            cca: {
              currentBalance: 10_000,
              remunerationRate: 0.04,
              annualContribution: { amount: 6_000, startYear: 2027, endYear: 2033 },
              exceptionalContributions: [{ amount: 25_000, year: 2029 }],
            },
            revenuePhases: [
              {
                id: 'phase-1',
                startYear: 2026,
                source: 'holding',
                loadedAnnualCost: 80_000,
                socialChargeRate: 0.3,
                annualNetIncomeNeed: 0,
                useCcaForCompletion: true,
              },
              {
                id: 'phase-2',
                startYear: 2031,
                source: 'none',
                loadedAnnualCost: 0,
                socialChargeRate: 0,
                annualNetIncomeNeed: 42_000,
                useCcaForCompletion: false,
              },
            ],
          },
        ],
      },
    });

    expect(v6.version).toBe(6);
    expect(v6.company.legalReserveInitial).toBe(0);
    expect(v6.company.associates[0].cca).toEqual({
      currentBalance: 10_000,
      remunerationRate: 0.04,
    });
    expect(v6.company.associates[0].revenuePhases).toEqual([
      expect.objectContaining({
        id: 'phase-1',
        startYear: 2026,
        endYear: 2030,
        remuneration: expect.objectContaining({ enabled: true, source: 'holding' }),
        distribution: expect.objectContaining({ enabled: false, dividendsStrategy: 'aucun' }),
        ccaRepayment: expect.objectContaining({ enabled: false, strategy: 'aucun' }),
        ccaContribution: {
          enabled: true,
          annual: { amount: 6_000, startYear: 2027, endYear: 2030 },
          exceptional: { amount: 25_000, year: 2029 },
        },
      }),
      expect.objectContaining({
        id: 'phase-2',
        startYear: 2031,
        endYear: 2040,
        remuneration: expect.objectContaining({ enabled: false, source: 'none' }),
        distribution: expect.objectContaining({
          enabled: true,
          annualNetIncomeNeed: 42_000,
          dividendsStrategy: 'montant_cible',
          dividendsTargetAmountNet: 42_000,
        }),
        ccaRepayment: expect.objectContaining({
          enabled: false,
          strategy: 'montant_cible',
          targetAmount: 42_000,
        }),
        ccaContribution: {
          enabled: true,
          annual: { amount: 6_000, startYear: 2031, endYear: 2033 },
        },
      }),
    ]);
  });
});
