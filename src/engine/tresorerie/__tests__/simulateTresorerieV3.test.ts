import { describe, expect, it } from 'vitest';
import { simulateTresorerieV2 } from '../simulateTresorerieV2';
import type { TresoFiscalParams, TresoInputsV3 } from '../types';

const PARAMS: TresoFiscalParams = {
  isNormalRate: 0.25,
  isReducedRate: 0.15,
  isReducedThreshold: 40_000,
  motherDaughterStandardQpfcRate: 0.05,
  motherDaughterGroupQpfcRate: 0.01,
  participationDisposalQpfcRate: 0.12,
  pfuRateIR: 0.10,
  psRate: 0.15,
  pfuTotal: 0.25,
  dividendesAbattement: 0,
  irScale: [],
  tnsDividendBasePct: 0.10,
};

function baseV3(): TresoInputsV3 {
  return {
    version: 3,
    selectedAssociateId: 'associe-us',
    foyer: {
      selectedAssociateId: 'associe-us',
      currentAge: 40,
      retirementAge: 70,
      annualIncomeNeed: 0,
      projectionStartYear: 2026,
    },
    company: {
      creationType: 'existante',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 20_000,
      sharePremium: 0,
      reservesInitial: 0,
      treasuryInitial: 50_000,
      annualStructureCosts: 0,
      incomeStatement: {
        annualRevenue: 0,
        annualStructureCosts: 0,
        workingCapitalRequirement: 0,
      },
      reducedCorporateTaxEligible: true,
      associates: [{
        id: 'associe-us',
        label: 'Associé 1',
        kind: 'pp',
        profile: {
          currentAge: 50,
          retirementAge: 65,
          annualIncomeNeed: 0,
          projectionStartYear: 2026,
        },
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        ccaInitial: 0,
        ccaAnnualContribution: 0,
        cca: {
          currentBalance: 0,
          exceptionalContributions: [],
          annualContribution: { amount: 0, startYear: 2026, endYear: 2026 },
          remunerationRate: 0,
        },
        remunerationAnnualCost: 0,
      }],
      loans: [],
      subsidiaries: [],
    },
    allocationMatrix: {
      sweepThreshold: 0,
      pockets: [],
    },
  };
}

describe('simulateTresorerie — modèle société v3', () => {
  it('utilise le profil de l’associé PP sélectionné plutôt que le bloc foyer legacy', () => {
    const inputs = baseV3();
    inputs.company.reservesInitial = 20_000;
    inputs.company.associates[0].profile = {
      currentAge: 64,
      retirementAge: 65,
      annualIncomeNeed: 7_500,
      projectionStartYear: 2026,
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 2);

    expect(rows[1].revenusNets).toBeCloseTo(7_500, 2);
  });

  it('intègre le chiffre d’affaires et les coûts de structure du compte de résultat', () => {
    const inputs = baseV3();
    inputs.company.incomeStatement = {
      annualRevenue: 100_000,
      annualStructureCosts: 12_000,
      workingCapitalRequirement: 0,
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].chargesStructure).toBe(12_000);
    expect(rows[0].resultatFiscalAvantIS).toBe(88_000);
  });

  it('ne charge la holding que si la rémunération associée vient de la holding', () => {
    const inputs = baseV3();
    inputs.company.incomeStatement = {
      annualRevenue: 100_000,
      annualStructureCosts: 0,
      workingCapitalRequirement: 0,
    };
    inputs.company.associates[0].remuneration = {
      source: 'subsidiary',
      subsidiaryId: 'filiale-1',
      loadedAnnualCost: 40_000,
      socialChargeRate: 0.25,
      endYear: 2026,
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].chargesStructure).toBe(0);
    expect(rows[0].revenusParAssocie).toEqual(expect.arrayContaining([
      expect.objectContaining({
        associateId: 'associe-us',
        source: 'remuneration',
        remuneration: 30_000,
        netRevenue: 30_000,
      }),
    ]));
  });

  it('conserve le BFR comme trésorerie non investissable avant le balayage annuel', () => {
    const inputs = baseV3();
    inputs.company.treasuryInitial = 50_000;
    inputs.company.incomeStatement = {
      annualRevenue: 100_000,
      annualStructureCosts: 0,
      workingCapitalRequirement: 40_000,
    };
    inputs.allocationMatrix = {
      sweepThreshold: 10_000,
      pockets: [{
        id: 'court-terme',
        label: 'Court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        durationYears: 5,
        annualReturnRate: 0,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 0,
        annualAllocationPct: 100,
        repeatAtTerm: false,
      }],
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].tresorerieFin).toBeCloseTo(50_000, 2);
  });

  it('bloque les détentions capital ou économiques supérieures à 100 %', () => {
    const inputs = baseV3();
    inputs.company.associates = [
      {
        ...inputs.company.associates[0],
        id: 'associe-1',
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 70, economicRightsPct: 70 }],
      },
      {
        ...inputs.company.associates[0],
        id: 'associe-2',
        label: 'Associé 2',
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 40, economicRightsPct: 40 }],
      },
    ];

    expect(() => simulateTresorerieV2(inputs, PARAMS, 1))
      .toThrow('Détention capital supérieure à 100 %');
  });

  it('neutralise le besoin retraite quand l’associé actif est une PM', () => {
    const inputs = baseV3();
    inputs.selectedAssociateId = 'associe-us';
    inputs.foyer.annualIncomeNeed = 12_000;
    inputs.company.reservesInitial = 30_000;
    inputs.company.associates[0] = {
      ...inputs.company.associates[0],
      kind: 'pm',
      profile: undefined,
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 2);

    expect(rows[1].revenusNets).toBe(0);
    expect(rows[1].dividendesAssociesBruts).toBe(0);
  });

  it('accepte une filiale repositionnée sous une autre filiale dans la projection', () => {
    const inputs = baseV3();
    inputs.company.subsidiaries = [
      {
        id: 'filiale-1',
        label: 'Filiale A',
        parentEntityId: 'societe',
        ownershipPct: 80,
        displayOrder: 0,
        holdingOwnershipPct: 80,
        annualServicesRevenue: 0,
        annualDividends: 10_000,
        motherDaughterEligible: true,
        fiscalIntegrationEstimateEnabled: false,
      },
      {
        id: 'filiale-2',
        label: 'Filiale B',
        parentEntityId: 'filiale-1',
        ownershipPct: 60,
        displayOrder: 1,
        holdingOwnershipPct: 60,
        annualServicesRevenue: 0,
        annualDividends: 5_000,
        motherDaughterEligible: true,
        fiscalIntegrationEstimateEnabled: false,
      },
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].dividendesFiliales).toBe(15_000);
    expect(rows[0].quotePartTaxable).toBe(750);
  });

  it('déduit une stratégie multi-poches dès que plusieurs poches existent', () => {
    const inputs = baseV3();
    inputs.company.treasuryInitial = 100_000;
    inputs.allocationMatrix = {
      sweepThreshold: 0,
      pockets: [
        {
          id: 'distribution',
          label: 'Court terme',
          kind: 'distribution',
          horizon: 'court_terme',
          durationYears: 5,
          annualReturnRate: 0,
          enjoymentDelayMonths: 0,
          initialAllocationPct: 100,
          annualAllocationPct: 0,
          repeatAtTerm: false,
        },
        {
          id: 'capitalisation',
          label: 'Long terme',
          kind: 'capitalisation',
          horizon: 'long_terme',
          durationYears: 5,
          annualReturnRate: 0,
          enjoymentDelayMonths: 0,
          initialAllocationPct: 100,
          annualAllocationPct: 0,
          repeatAtTerm: false,
        },
      ],
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].capitalDistrib).toBe(50_000);
    expect(rows[0].capitalCapi).toBe(50_000);
  });

  it('ignore la priorité legacy et construit les lots sur les poches actives', () => {
    const inputs = baseV3();
    inputs.company.treasuryInitial = 100_000;
    inputs.allocationMatrix = {
      sweepThreshold: 0,
      pockets: [
        {
          id: 'capitalisation',
          label: 'Long terme',
          kind: 'capitalisation',
          horizon: 'long_terme',
          durationYears: 5,
          annualReturnRate: 0,
          enjoymentDelayMonths: 0,
          initialAllocationPct: 100,
          annualAllocationPct: 0,
          repeatAtTerm: false,
        },
        {
          id: 'distribution',
          label: 'Court terme',
          kind: 'distribution',
          horizon: 'court_terme',
          durationYears: 5,
          annualReturnRate: 0,
          enjoymentDelayMonths: 0,
          initialAllocationPct: 100,
          annualAllocationPct: 0,
          repeatAtTerm: false,
        },
      ],
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].capitalDistrib).toBe(50_000);
    expect(rows[0].capitalCapi).toBe(50_000);
  });

  it('conserve une trésorerie non placée quand aucune poche n’est renseignée', () => {
    const inputs = baseV3();
    inputs.company.treasuryInitial = 100_000;
    inputs.allocationMatrix = {
      sweepThreshold: 0,
      pockets: [],
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].capitalDistrib).toBe(0);
    expect(rows[0].capitalCapi).toBe(0);
    expect(rows[0].tresorerieDebut).toBe(100_000);
  });

  it('réinvestit un produit répété seulement au-dessus du compte bancaire minimum et du BFR', () => {
    const inputs = baseV3();
    inputs.company.treasuryInitial = 100_000;
    inputs.company.incomeStatement = {
      annualRevenue: 0,
      annualStructureCosts: 0,
      workingCapitalRequirement: 20_000,
    };
    inputs.allocationMatrix = {
      sweepThreshold: 70_000,
      minimumBankBalance: 70_000,
      pockets: [{
        id: 'court-terme',
        label: 'Court terme',
        kind: 'distribution',
        horizon: 'court_terme',
        durationYears: 1,
        annualReturnRate: 0,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 100,
        annualAllocationPct: 0,
        repeatAtTerm: true,
      }],
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 2);

    expect(rows[0].tresorerieFin).toBeCloseTo(90_000, 2);
    expect(rows[0].deficitTresorerieBancaire).toBe(0);
    expect(rows[1].capitalDistrib).toBeCloseTo(10_000, 2);
  });

  it('crédite la cession PVLT sur la banque sans balayage immédiat', () => {
    const inputs = baseV3();
    inputs.company.reducedCorporateTaxEligible = false;
    inputs.company.treasuryInitial = 0;
    inputs.company.subsidiaries = [{
      id: 'filiale-1',
      label: 'Filiale 1',
      parentEntityId: 'societe',
      ownershipPct: 100,
      displayOrder: 0,
      holdingOwnershipPct: 100,
      annualServicesRevenue: 0,
      annualDividends: 0,
      motherDaughterEligible: true,
      fiscalIntegrationEstimateEnabled: false,
      disposalYear: 2026,
      estimatedDisposalPrice: 100_000,
      taxBasis: 40_000,
      disposal: {
        year: 2026,
        estimatedPrice: 100_000,
        taxBasis: 40_000,
        fees: 0,
        regime: 'pvlt',
      },
    }];
    inputs.allocationMatrix = {
      sweepThreshold: 0,
      minimumBankBalance: 0,
      pockets: [{
        id: 'balayage',
        label: 'Balayage annuel',
        kind: 'distribution',
        horizon: 'court_terme',
        durationYears: 3,
        annualReturnRate: 0,
        enjoymentDelayMonths: 0,
        initialAllocationPct: 0,
        annualAllocationPct: 100,
        repeatAtTerm: false,
      }],
    };

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].quotePartTaxable).toBeCloseTo(7_200, 2);
    expect(rows[0].is).toBeCloseTo(1_800, 2);
    expect(rows[0].tresorerieFin).toBeCloseTo(98_200, 2);
  });

  it('arrête les prestations et dividendes filiale à partir de l’année suivant la cession', () => {
    const inputs = baseV3();
    inputs.company.treasuryInitial = 0;
    inputs.company.subsidiaries = [{
      id: 'filiale-1',
      label: 'Filiale 1',
      parentEntityId: 'societe',
      ownershipPct: 100,
      displayOrder: 0,
      holdingOwnershipPct: 100,
      annualServicesRevenue: 12_000,
      annualDividends: 10_000,
      motherDaughterEligible: true,
      fiscalIntegrationEstimateEnabled: false,
      disposal: {
        year: 2026,
        estimatedPrice: 0,
        taxBasis: 0,
        fees: 0,
        regime: 'standard',
      },
    }];

    const rows = simulateTresorerieV2(inputs, PARAMS, 2);

    expect(rows[0].dividendesFiliales).toBe(10_000);
    expect(rows[0].resultatComptableAvantIS).toBeGreaterThan(0);
    expect(rows[1].dividendesFiliales).toBe(0);
    expect(rows[1].resultatComptableAvantIS).toBe(0);
  });

  it('calcule les intérêts de CCA et limite leur déduction au taux maximum fiscal', () => {
    const inputs = baseV3();
    inputs.company.treasuryInitial = 200_000;
    inputs.company.associates[0].cca = {
      currentBalance: 100_000,
      exceptionalContributions: [],
      annualContribution: { amount: 0, startYear: 2026, endYear: 2026 },
      remunerationRate: 0.10,
    };

    const rows = simulateTresorerieV2(inputs, {
      ...PARAMS,
      maxDeductibleCcaInterestRate: 0.04,
    }, 1);

    expect(rows[0].interetsCCA).toBe(10_000);
    expect(rows[0].interetsCCADeductibles).toBe(4_000);
    expect(rows[0].interetsCCANonDeductibles).toBe(6_000);
    expect(rows[0].revenusParAssocie).toEqual(expect.arrayContaining([
      expect.objectContaining({
        associateId: 'associe-us',
        source: 'cca_interets',
        netRevenue: 10_000,
      }),
    ]));
  });
});
