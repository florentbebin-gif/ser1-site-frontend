import { describe, expect, it } from 'vitest';
import { simulateTresorerieV2 } from '../../../engine/tresorerie/simulateTresorerieV2';
import type { TresoFiscalParams, TresoInputsV2 } from '../../../engine/tresorerie/types';

const PARAMS: TresoFiscalParams = {
  isNormalRate: 0.25,
  isReducedRate: 0.15,
  isReducedThreshold: 42500,
  motherDaughterStandardQpfcRate: 0.05,
  motherDaughterGroupQpfcRate: 0.01,
  pfuRateIR: 0.128,
  psRate: 0.172,
  pfuTotal: 0.3,
  dividendesAbattement: 0.4,
  irScale: [],
};

const BASE: TresoInputsV2 = {
  version: 2,
  foyer: {
    selectedAssociateId: 'associe-1',
    currentAge: 50,
    retirementAge: 65,
    annualIncomeNeed: 0,
    projectionStartYear: 2025,
  },
  company: {
    creationType: 'newco',
    legalForm: 'sas',
    shareCapital: 1000,
    sharePremium: 0,
    reservesInitial: 0,
    treasuryInitial: 0,
    annualStructureCosts: 3000,
    reducedCorporateTaxEligible: true,
    associates: [
      {
        id: 'associe-1',
        label: 'Associé 1',
        kind: 'pp',
        ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
        roles: ['associe_sans_statut'],
        cca: {
          currentBalance: 0,
          exceptionalContributions: [],
          annualContribution: { amount: 16600, startYear: 2025, endYear: 2039 },
          remunerationRate: 0,
        },
        remuneration: { source: 'holding', loadedAnnualCost: 0, socialChargeRate: 0 },
      },
    ],
    loans: [],
    subsidiaries: [],
  },
  allocationMatrix: {
    sweepThreshold: 0,
    pockets: [],
  },
};

describe('Trésorerie société IS — projection moteur v2 et KPIs', () => {
  describe('structure de la projection', () => {
    it('produit exactement 40 lignes pour horizon=40', () => {
      const rows = simulateTresorerieV2(BASE, PARAMS, 40);
      expect(rows).toHaveLength(40);
    });

    it('la numérotation year commence à 1', () => {
      const rows = simulateTresorerieV2(BASE, PARAMS, 5);
      expect(rows[0].year).toBe(1);
      expect(rows[4].year).toBe(5);
    });
  });

  describe('IS et résultat', () => {
    it('IS = 0 quand la base imposable est négative (charges > revenus)', () => {
      const rows = simulateTresorerieV2(BASE, PARAMS, 1);
      expect(rows[0].is).toBe(0);
      expect(rows[0].revenuDistrib).toBe(0);
    });
  });

  describe('CCA cumulé', () => {
    it('augmente de l’apport annuel CCA chaque année en phase active', () => {
      const rows = simulateTresorerieV2(BASE, PARAMS, 3);
      expect(rows[0].ccaCumule).toBe(16600);
      expect(rows[1].ccaCumule).toBe(33200);
      expect(rows[2].ccaCumule).toBe(49800);
    });
  });

  describe('Poche de capitalisation — IS latent', () => {
    it('isLatentCapi = 0 sans poche de capitalisation', () => {
      const rows = simulateTresorerieV2(BASE, PARAMS, 5);
      expect(rows.every((r) => r.isLatentCapi === 0)).toBe(true);
    });

    it('isLatentCapi croît chaque année avec les gains (non décaissé)', () => {
      const rows = simulateTresorerieV2(
        {
          ...BASE,
          company: {
            ...BASE.company,
            treasuryInitial: 200000,
          },
          allocationMatrix: {
            sweepThreshold: 0,
            pockets: [
              {
                id: 'capitalisation-1',
                kind: 'capitalisation',
                durationYears: 20,
                annualReturnRate: 0.04,
                enjoymentDelayMonths: 0,
                initialAllocationPct: 100,
                annualAllocationPct: 0,
                repeatAtTerm: false,
              },
            ],
          },
        },
        PARAMS,
        5,
      );

      expect(rows[0].isLatentCapi).toBeGreaterThan(0);
      expect(rows[4].isLatentCapi).toBeGreaterThan(rows[0].isLatentCapi);
    });
  });

  describe('Alerte dividendes — cas warning', () => {
    it('alerteDividendesSuperieursCapacite = false sans revenus demandés', () => {
      const rows = simulateTresorerieV2(BASE, PARAMS, 1);
      expect(rows[0].alerteDividendesSuperieursCapacite).toBe(false);
    });

    it('alerte active quand le besoin de revenus dépasse la capacité distribuable', () => {
      const rows = simulateTresorerieV2(
        {
          ...BASE,
          foyer: {
            ...BASE.foyer,
            currentAge: 65,
            retirementAge: 65,
            annualIncomeNeed: 50000,
          },
          company: {
            ...BASE.company,
            associates: BASE.company.associates.map((associate) => ({
              ...associate,
              profile: {
                currentAge: 65,
                retirementAge: 65,
                annualIncomeNeed: 50000,
                projectionStartYear:
                  BASE.company.projectionStartYear ?? BASE.foyer.projectionStartYear,
              },
            })),
          },
        },
        PARAMS,
        1,
      );

      expect(rows[0].alerteDividendesSuperieursCapacite).toBe(true);
    });
  });
});
