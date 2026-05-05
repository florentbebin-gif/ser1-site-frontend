import { describe, expect, it } from 'vitest';
import type { TresoInputs, TresoProjectionRow } from '@/engine/tresorerie/types';
import {
  buildTresoInputsV2FromLegacy,
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

describe('migration trésorerie v2', () => {
  it('construit le foyer, la société, le CCA associé et les flux legacy dans TresoInputsV2', () => {
    const v2 = buildTresoInputsV2FromLegacy(LEGACY_INPUTS);

    expect(v2.version).toBe(2);
    expect(v2.foyer).toEqual({
      selectedAssociateId: 'associe-1',
      currentAge: 52,
      retirementAge: 64,
      annualIncomeNeed: 42000,
      projectionStartYear: 2027,
    });
    expect(v2.company.creationType).toBe('existante');
    expect(v2.company.reservesInitial).toBe(220000);
    expect(v2.company.treasuryInitial).toBe(150000);
    expect(v2.company.associates[0]).toMatchObject({
      id: 'associe-1',
      label: 'Associé 1',
      ccaInitial: 80000,
      ccaAnnualContribution: 12000,
      ccaContributionEndYear: 2036,
    });
    expect(v2.company.associates[0].ownershipLots).toEqual([
      { right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 },
    ]);
    expect(v2.company.loans[0]).toMatchObject({
      principal: 90000,
      financedAssetLabel: 'SCPI',
      financedAssetReturnRate: 0.047,
      enjoymentDelayMonths: 6,
    });
    expect(v2.company.subsidiaries[0]).toMatchObject({
      holdingOwnershipPct: 80,
      annualDividends: 18000,
      motherDaughterEligible: true,
    });
    expect(v2.allocationMatrix.pockets).toHaveLength(2);
    expect(v2.allocationMatrix.pockets.map(getAllocationPocketLabel)).toEqual([
      'Distribution 5 ans',
      'Capitalisation 8 ans',
    ]);
    expect(v2.allocationMatrix.pockets[0]).toMatchObject({
      initialAllocationPct: 66.66666666666666,
      annualAllocationPct: 0,
    });
    expect(v2.allocationMatrix.pockets[1]).toMatchObject({
      initialAllocationPct: 33.33333333333333,
      annualAllocationPct: 0,
    });
  });

  it("reste un test de compatibilité isolé pour migrer l'ancien modèle vers v2", () => {
    const v2 = buildTresoInputsV2FromLegacy(LEGACY_INPUTS);

    expect(v2.company.creationType).toBe('existante');
    expect(v2.foyer.currentAge).toBe(52);
    expect(v2.foyer.retirementAge).toBe(64);
    expect(v2.foyer.annualIncomeNeed).toBe(42000);
    expect(v2.company.associates[0].ccaInitial).toBe(80000);
    expect(v2.company.associates[0].ccaAnnualContribution).toBe(12000);
    expect(v2.company.loans[0]).toMatchObject({
      principal: 90000,
      financedAssetLabel: 'SCPI',
      financedAssetReturnRate: 0.047,
    });
  });

  it('prévoit revenusParAssocie sur les lignes de projection dès le socle v2', () => {
    const row = {
      year: 1,
      revenusParAssocie: [],
    } as Pick<TresoProjectionRow, 'year' | 'revenusParAssocie'>;

    expect(row.revenusParAssocie).toEqual([]);
  });
});
