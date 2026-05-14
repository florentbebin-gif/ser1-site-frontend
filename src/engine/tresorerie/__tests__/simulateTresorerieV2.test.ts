import { describe, expect, it } from 'vitest';
import { simulateTresorerieV2 } from '../simulateTresorerieV2';
import type {
  AllocationMatrixInput,
  CompanyInput,
  FoyerInput,
  TresoFiscalParams,
  TresoInputsV2,
} from '../types';

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

interface V2Overrides {
  foyer?: Partial<FoyerInput>;
  company?: Partial<CompanyInput>;
  allocationMatrix?: Partial<AllocationMatrixInput>;
}

function baseV2(overrides: V2Overrides = {}): TresoInputsV2 {
  const foyer = {
    selectedAssociateId: 'associe-us',
    currentAge: 64,
    retirementAge: 65,
    annualIncomeNeed: 0,
    projectionStartYear: 2026,
    ...overrides.foyer,
  };
  const inputs: TresoInputsV2 = {
    version: 2,
    foyer,
    company: {
      creationType: 'existante',
      legalForm: 'sas',
      shareCapital: 20_000,
      sharePremium: 0,
      reservesInitial: 0,
      treasuryInitial: 50_000,
      annualStructureCosts: 0,
      reducedCorporateTaxEligible: true,
      associates: [
        {
          id: 'associe-us',
          label: 'Associé 1',
          kind: 'pp',
          ownershipLots: [{ right: 'usufruit', capitalPct: 0, economicRightsPct: 100 }],
          roles: ['associe_sans_statut'],
          cca: {
            currentBalance: 0,
            exceptionalContributions: [],
            annualContribution: { amount: 0, startYear: 2026 },
            remunerationRate: 0,
          },
          remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
        },
        {
          id: 'associe-np',
          label: 'Associé 2',
          kind: 'pp',
          ownershipLots: [{ right: 'nue_propriete', capitalPct: 100, economicRightsPct: 0 }],
          roles: ['associe_sans_statut'],
          cca: {
            currentBalance: 0,
            exceptionalContributions: [],
            annualContribution: { amount: 0, startYear: 2026 },
            remunerationRate: 0,
          },
          remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
        },
      ],
      loans: [],
      subsidiaries: [],
      ...overrides.company,
    },
    allocationMatrix: {
      sweepThreshold: 0,
      pockets: [],
      ...overrides.allocationMatrix,
    },
  };
  return {
    ...inputs,
    company: {
      ...inputs.company,
      associates: inputs.company.associates.map(associate => associate.profile || associate.kind === 'pm'
        ? associate
        : {
          ...associate,
          kind: associate.kind ?? 'pp',
          profile: {
            currentAge: inputs.foyer.currentAge,
            retirementAge: inputs.foyer.retirementAge,
            annualIncomeNeed: inputs.foyer.annualIncomeNeed,
            projectionStartYear: inputs.company.projectionStartYear ?? inputs.foyer.projectionStartYear,
          },
        }),
    },
  };
}

describe('simulateTresorerie — modèle société v2', () => {
  it('affecte les dividendes à l’usufruitier et pas au nu-propriétaire', () => {
    const rows = simulateTresorerieV2(baseV2({
      foyer: { annualIncomeNeed: 7_500 },
      company: { reservesInitial: 20_000 },
    }), PARAMS, 2);

    const retraite = rows[1];
    const revenusUs = retraite.revenusParAssocie.filter(r => r.associateId === 'associe-us');
    const revenusNp = retraite.revenusParAssocie.filter(r => r.associateId === 'associe-np');

    expect(revenusUs.reduce((sum, r) => sum + r.grossDividends, 0)).toBeCloseTo(10_000, 2);
    expect(revenusUs.reduce((sum, r) => sum + r.netRevenue, 0)).toBeCloseTo(7_500, 2);
    expect(revenusNp.reduce((sum, r) => sum + r.grossDividends, 0)).toBe(0);
    expect(retraite.revenusNets).toBeCloseTo(7_500, 2);
  });

  it('constitue le CCA initial et annuel par associé puis rembourse le créancier déclaré', () => {
    const rows = simulateTresorerieV2(baseV2({
      foyer: { annualIncomeNeed: 8_000 },
      company: {
        associates: [
          {
            id: 'associe-us',
            label: 'Associé 1',
            kind: 'pp',
            ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
            roles: ['associe_sans_statut'],
            cca: {
              currentBalance: 10_000,
              exceptionalContributions: [],
              annualContribution: { amount: 5_000, startYear: 2026, endYear: 2026 },
              remunerationRate: 0,
            },
            remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
          },
        ],
      },
    }), PARAMS, 2);

    expect(rows[0].apportCCA).toBe(5_000);
    expect(rows[0].ccaRestant).toBe(15_000);
    expect(rows[1].retraitsCCA).toBe(8_000);
    expect(rows[1].revenusParAssocie).toEqual(expect.arrayContaining([
      expect.objectContaining({
        associateId: 'associe-us',
        source: 'cca',
        ccaRepaid: 8_000,
        netRevenue: 8_000,
      }),
    ]));
  });

  it('soumet toute la base au taux normal quand l’IS réduit est décoché', () => {
    const rows = simulateTresorerieV2(baseV2({
      company: {
        reducedCorporateTaxEligible: false,
        subsidiaries: [
          {
            id: 'filiale-1',
            label: 'Filiale 1',
            holdingOwnershipPct: 100,
            motherDaughterEligible: false,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [{ amount: 20_000, startYear: 2026 }],
            dividendsSchedule: [],
          },
        ],
      },
    }), PARAMS, 1);

    expect(rows[0].baseIS).toBe(20_000);
    expect(rows[0].is).toBe(5_000);
  });

  it('agrège les emprunts société, y compris un emprunt existant et son actif financé', () => {
    const rows = simulateTresorerieV2(baseV2({
      company: {
        loans: [
          {
            id: 'pret-ancien',
            label: 'Emprunt existant',
            principal: 120_000,
            annualRate: 0.03,
            durationMonths: 120,
            startDate: '2024-01',
            existingLoan: true,
            deductibleInterest: true,
            financedAssetKind: 'scpi',
            financedAssetLabel: 'SCPI existante',
            financedAssetReturnRate: 0.05,
            enjoymentDelayMonths: 0,
          },
          {
            id: 'pret-nouveau',
            label: 'Emprunt nouveau',
            principal: 60_000,
            annualRate: 0.04,
            durationMonths: 60,
            startDate: '2026-07',
            existingLoan: false,
            deductibleInterest: true,
          },
        ],
      },
    }), PARAMS, 1);

    expect(rows[0].annuiteCreditIS).toBeGreaterThan(0);
    expect(rows[0].interetsCreditIS).toBeGreaterThan(0);
    expect(rows[0].revenusActifFinance).toBeCloseTo(6_000, 2);
    expect(rows[0].resultatFiscalAvantIS).toBeLessThanOrEqual(rows[0].resultatComptableAvantIS);
  });

  it('traite les filiales, la quote-part mère-fille et l’intégration estimée comme options distinctes', () => {
    const rows = simulateTresorerieV2(baseV2({
      company: {
        subsidiaries: [
          {
            id: 'filiale-mf',
            label: 'Filiale mère-fille',
            holdingOwnershipPct: 100,
            motherDaughterEligible: true,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [{ amount: 12_000, startYear: 2026 }],
            dividendsSchedule: [{ amount: 20_000, startYear: 2026 }],
          },
          {
            id: 'filiale-integ',
            label: 'Filiale intégrée estimée',
            holdingOwnershipPct: 100,
            motherDaughterEligible: false,
            fiscalIntegrationEstimateEnabled: true,
            estimatedFiscalResult: -3_000,
            servicesSchedule: [],
            dividendsSchedule: [],
          },
        ],
      },
    }), PARAMS, 1);

    expect(rows[0].dividendesFiliales).toBe(20_000);
    expect(rows[0].quotePartTaxable).toBe(1_000);
    expect(rows[0].resultatFiscalAvantIS).toBe(10_000);
  });

  it('paye les charges sociales TNS en N+1 sur les dividendes au-dessus du seuil', () => {
    const rows = simulateTresorerieV2(baseV2({
      foyer: { annualIncomeNeed: 24_000 },
      company: {
        shareCapital: 20_000,
        reservesInitial: 80_000,
        associates: [
          {
            id: 'associe-us',
            label: 'Associé 1',
            kind: 'pp',
            ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
            roles: ['gerant_tns'],
            cca: {
              currentBalance: 0,
              exceptionalContributions: [],
              annualContribution: { amount: 0, startYear: 2026 },
              remunerationRate: 0,
            },
            remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0.40 },
          },
        ],
      },
    }), PARAMS, 3);

    expect(rows[1].chargesStructure).toBe(0);
    expect(rows[1].revenusParAssocie).toEqual(expect.arrayContaining([
      expect.objectContaining({
        associateId: 'associe-us',
        source: 'charges_sociales_tns',
        tnsSocialCharges: 12_000,
      }),
    ]));
    expect(rows[2].chargesStructure).toBeCloseTo(12_000, 2);
  });

  it('applique le régime standard en auto quand la durée de détention n’est pas prouvée', () => {
    const rows = simulateTresorerieV2(baseV2({
      company: {
        subsidiaries: [
          {
            id: 'filiale-cession',
            label: 'Filiale cédée',
            holdingOwnershipPct: 100,
            motherDaughterEligible: false,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [],
            dividendsSchedule: [],
            disposal: {
              year: 2027,
              estimatedPrice: 50_000,
              taxBasis: 30_000,
              fees: 0,
              regime: 'auto',
            },
          },
        ],
      },
    }), PARAMS, 2);

    expect(rows[0].resultatFiscalAvantIS).toBe(0);
    expect(rows[1].resultatFiscalAvantIS).toBe(20_000);
    expect(rows[1].tresorerieFin).toBeGreaterThan(rows[0].tresorerieFin);
  });

  it('compense les plus et moins-values long terme avant d’appliquer la quote-part taxable', () => {
    const rows = simulateTresorerieV2(baseV2({
      company: {
        subsidiaries: [
          {
            id: 'filiale-gain',
            label: 'Filiale gain',
            holdingOwnershipPct: 100,
            motherDaughterEligible: true,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [],
            dividendsSchedule: [],
            disposal: {
              year: 2027,
              estimatedPrice: 180_000,
              taxBasis: 80_000,
              fees: 0,
              regime: 'pvlt',
              acquisitionYear: 2020,
            },
          },
          {
            id: 'filiale-perte',
            label: 'Filiale perte',
            holdingOwnershipPct: 100,
            motherDaughterEligible: true,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [],
            dividendsSchedule: [],
            disposal: {
              year: 2027,
              estimatedPrice: 20_000,
              taxBasis: 100_000,
              fees: 0,
              regime: 'pvlt',
              acquisitionYear: 2020,
            },
          },
        ],
      },
    }), PARAMS, 2);

    expect(rows[1].cessionFilialesPlusValueBrute).toBe(100_000);
    expect(rows[1].cessionFilialesQuotePartTaxable).toBe(12_000);
    expect(rows[1].resultatComptableAvantIS).toBe(20_000);
  });

  it('balaye la trésorerie disponible en fin d’exercice sans produire de revenus sur l’exercice écoulé', () => {
    const rows = simulateTresorerieV2(baseV2({
      company: {
        treasuryInitial: 50_000,
        subsidiaries: [
          {
            id: 'filiale-services',
            label: 'Filiale services',
            holdingOwnershipPct: 100,
            motherDaughterEligible: false,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [{ amount: 80_000, startYear: 2026 }],
            dividendsSchedule: [],
          },
        ],
      },
      allocationMatrix: {
        sweepThreshold: 50_000,
        pockets: [
          {
            id: 'distribution-1',
            kind: 'distribution',
            durationYears: 5,
            annualReturnRate: 0.10,
            enjoymentDelayMonths: 0,
            initialAllocationPct: 0,
            annualAllocationPct: 100,
            repeatAtTerm: false,
          },
        ],
      },
    }), PARAMS, 2);

    expect(rows[0].revenuDistrib).toBe(0);
    expect(rows[0].tresorerieFin).toBeCloseTo(50_000, 2);
    expect(rows[1].capitalDistrib).toBeCloseTo(64_000, 2);
    expect(rows[1].revenuDistrib).toBeCloseTo(6_400, 2);
  });

  it('force le réinvestissement dans la même poche quand la répétition au terme est active', () => {
    const rows = simulateTresorerieV2(baseV2({
      company: {
        treasuryInitial: 20_000,
      },
      allocationMatrix: {
        sweepThreshold: 0,
        pockets: [
          {
            id: 'distribution-repeat',
            kind: 'distribution',
            durationYears: 1,
            annualReturnRate: 0.10,
            enjoymentDelayMonths: 0,
            initialAllocationPct: 100,
            annualAllocationPct: 0,
            repeatAtTerm: true,
          },
        ],
      },
    }), PARAMS, 2);

    expect(rows[0].capitalDistrib).toBe(20_000);
    expect(rows[0].tresorerieFin).toBeCloseTo(2_000 - rows[0].is, 2);
    expect(rows[1].capitalDistrib).toBe(20_000);
    expect(rows[1].revenuDistrib).toBeCloseTo(2_000, 2);
  });

  it('utilise uniquement la matrice portée par le modèle v2', () => {
    const inputs = baseV2({
      company: { treasuryInitial: 40_000 },
      allocationMatrix: {
        sweepThreshold: 0,
        pockets: [
          {
            id: 'distribution-v2',
            kind: 'distribution',
            durationYears: 5,
            annualReturnRate: 0.05,
            enjoymentDelayMonths: 0,
            initialAllocationPct: 100,
            annualAllocationPct: 0,
            repeatAtTerm: false,
          },
        ],
      },
    });

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);

    expect(rows[0].capitalDistrib).toBe(40_000);
    expect(rows[0].revenuDistrib).toBe(2_000);
    expect(rows[0].capitalCapi).toBe(0);
    expect(rows[0].gainCapiN).toBe(0);
  });

  it('normalise les allocations initiales et annuelles au-delà de 100 %', () => {
    const rows = simulateTresorerieV2(baseV2({
      company: {
        treasuryInitial: 100_000,
        subsidiaries: [
          {
            id: 'filiale-services',
            label: 'Filiale services',
            holdingOwnershipPct: 100,
            motherDaughterEligible: false,
            fiscalIntegrationEstimateEnabled: false,
            servicesSchedule: [{ amount: 100_000, startYear: 2026 }],
            dividendsSchedule: [],
          },
        ],
      },
      allocationMatrix: {
        sweepThreshold: 0,
        pockets: [
          {
            id: 'distribution-1',
            kind: 'distribution',
            durationYears: 5,
            annualReturnRate: 0,
            enjoymentDelayMonths: 0,
            initialAllocationPct: 80,
            annualAllocationPct: 80,
            repeatAtTerm: false,
          },
          {
            id: 'distribution-2',
            kind: 'distribution',
            durationYears: 5,
            annualReturnRate: 0,
            enjoymentDelayMonths: 0,
            initialAllocationPct: 80,
            annualAllocationPct: 80,
            repeatAtTerm: false,
          },
        ],
      },
    }), PARAMS, 2);

    expect(rows[0].capitalDistrib).toBe(100_000);
    expect(rows[0].tresorerieDebut).toBe(0);
    expect(rows[0].tresorerieFin).toBe(0);
    expect(rows[1].capitalDistrib).toBeGreaterThan(100_000);
    expect(rows[1].tresorerieFin).toBeGreaterThanOrEqual(0);
  });

});

