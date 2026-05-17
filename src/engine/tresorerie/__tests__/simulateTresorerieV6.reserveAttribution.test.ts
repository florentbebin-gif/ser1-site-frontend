import { describe, expect, it } from 'vitest';
import { simulateTresorerieV2 } from '../simulateTresorerieV2';
import type { TresoFiscalParams, TresoInputsV6 } from '../types';

const PARAMS: TresoFiscalParams = {
  isNormalRate: 0.25,
  isReducedRate: 0.15,
  isReducedThreshold: 40_000,
  motherDaughterStandardQpfcRate: 0.05,
  motherDaughterGroupQpfcRate: 0.01,
  participationDisposalQpfcRate: 0.12,
  pfuRateIR: 0.1,
  psRate: 0.15,
  pfuTotal: 0.25,
  dividendesAbattement: 0,
  irScale: [],
  tnsDividendBasePct: 0.1,
};

/**
 * Scénario de référence : démembrement classique.
 * - Associé 1 : 10 % PP + 90 % usufruit (droits économiques courants = 100 %)
 * - Associé 2 : 90 % nue-propriété (droits économiques courants = 0 %)
 * - Réserves initiales = 200 000 € (au-delà de la capacité distribuable annuelle)
 * - Distribution max sur 1 an.
 *
 * Le test vérifie la clé de répartition selon `usufructuaryReserveAttribution`.
 */
function buildDemembrementInputs(usufructuaryReserveAttribution?: boolean): TresoInputsV6 {
  return {
    version: 6,
    selectedAssociateId: 'associe-1',
    foyer: { selectedAssociateId: 'associe-1' },
    company: {
      projectionStartYear: 2026,
      creationType: 'existante',
      legalForm: 'sas',
      companyKind: 'holding_patrimoniale',
      shareCapital: 100_000,
      sharePremium: 0,
      reservesInitial: 200_000,
      legalReserveInitial: 10_000, // plafond atteint, pas de dotation
      treasuryInitial: 500_000,
      annualStructureCosts: 0,
      incomeStatement: {
        annualRevenue: 100_000,
        annualStructureCosts: 0,
        workingCapitalRequirement: 0,
      },
      reducedCorporateTaxEligible: true,
      usufructuaryReserveAttribution,
      associates: [
        {
          id: 'associe-1',
          label: 'Associé 1',
          kind: 'pp',
          profile: {
            currentAge: 50,
            retirementAge: 90,
            annualIncomeNeed: 0,
            projectionStartYear: 2026,
          },
          ownershipLots: [
            { right: 'pleine_propriete', capitalPct: 10, economicRightsPct: 10 },
            { right: 'usufruit', capitalPct: 0, economicRightsPct: 90 },
          ],
          roles: ['associe_sans_statut'],
          cca: { currentBalance: 0, remunerationRate: 0 },
          revenuePhases: [
            {
              id: 'phase-1',
              startYear: 2026,
              endYear: 2026,
              remuneration: {
                enabled: false,
                source: 'none',
                loadedAnnualCost: 0,
                socialChargeRate: 0,
              },
              distribution: {
                enabled: true,
                annualNetIncomeNeed: 0,
                dividendsStrategy: 'max_treso',
              },
              ccaContribution: { enabled: false },
              ccaRepayment: { enabled: false, strategy: 'aucun' },
            },
          ],
        },
        {
          id: 'associe-2',
          label: 'Associé 2',
          kind: 'pp',
          profile: {
            currentAge: 60,
            retirementAge: 90,
            annualIncomeNeed: 0,
            projectionStartYear: 2026,
          },
          ownershipLots: [{ right: 'nue_propriete', capitalPct: 90, economicRightsPct: 0 }],
          roles: ['associe_sans_statut'],
          cca: { currentBalance: 0, remunerationRate: 0 },
          revenuePhases: [
            {
              id: 'phase-2',
              startYear: 2026,
              endYear: 2026,
              remuneration: {
                enabled: false,
                source: 'none',
                loadedAnnualCost: 0,
                socialChargeRate: 0,
              },
              distribution: { enabled: false, annualNetIncomeNeed: 0, dividendsStrategy: 'aucun' },
              ccaContribution: { enabled: false },
              ccaRepayment: { enabled: false, strategy: 'aucun' },
            },
          ],
        },
      ],
      loans: [],
      subsidiaries: [],
    },
    allocationMatrix: {
      sweepThreshold: 0,
      minimumBankBalance: 0,
      pockets: [],
    },
  };
}

describe('simulateTresorerie — attribution des réserves démembrées', () => {
  it('par défaut (usufructuaryReserveAttribution non défini), l’usufruitier appréhende l’intégralité', () => {
    const rows = simulateTresorerieV2(buildDemembrementInputs(undefined), PARAMS, 1);

    const row = rows[0];
    const a1 = row.revenusParAssocie?.find((r) => r.associateId === 'associe-1');
    const a2 = row.revenusParAssocie?.find((r) => r.associateId === 'associe-2');

    // Résultat courant + réserves doivent revenir à l'usufruitier (clé getEconomicRightsPct)
    // → associé 1 reçoit 100 % des dividendes, associé 2 = 0
    expect(a2?.grossDividends ?? 0).toBe(0);
    expect(a1?.grossDividends ?? 0).toBeGreaterThan(0);
  });

  it('checkbox cochée (true) : associé en US appréhende 100 % des dividendes (résultat + réserves)', () => {
    const rows = simulateTresorerieV2(buildDemembrementInputs(true), PARAMS, 1);

    const row = rows[0];
    const a1 = row.revenusParAssocie?.find((r) => r.associateId === 'associe-1');
    const a2 = row.revenusParAssocie?.find((r) => r.associateId === 'associe-2');

    expect(a2?.grossDividends ?? 0).toBe(0);
    expect(a1?.grossDividends ?? 0).toBeGreaterThan(0);
  });

  it('checkbox décochée (false) : résultat courant via économique (100 % asso 1), réserves via PP (10 % asso 1 sur la part réserves)', () => {
    const rows = simulateTresorerieV2(buildDemembrementInputs(false), PARAMS, 1);

    const row = rows[0];
    const a1 = row.revenusParAssocie?.find((r) => r.associateId === 'associe-1');
    const a2 = row.revenusParAssocie?.find((r) => r.associateId === 'associe-2');

    // Σ PP = 10 % (asso 1 uniquement). Les réserves vont donc à 100 % à l'associé 1 en PP.
    // L'associé 2 reste à 0 (il n'a aucune PP).
    expect(a2?.grossDividends ?? 0).toBe(0);
    expect(a1?.grossDividends ?? 0).toBeGreaterThan(0);

    // L'associé 1 reçoit moins qu'avec usufructuaryReserveAttribution=true uniquement si
    // les réserves seules ne sont pas distribuables (cas Σ PP = 0). Ici Σ PP > 0 donc
    // les réserves sont quand même distribuables à 100 % vers le seul PP.
  });

  it('checkbox décochée + aucun PP : les réserves ne sont pas distribuables', () => {
    const inputs = buildDemembrementInputs(false);
    // Force Σ PP = 0 : on remplace la PP de l'associé 1 par 100 % usufruit
    inputs.company.associates[0].ownershipLots = [
      { right: 'usufruit', capitalPct: 0, economicRightsPct: 100 },
    ];
    inputs.company.associates[1].ownershipLots = [
      { right: 'nue_propriete', capitalPct: 100, economicRightsPct: 0 },
    ];

    const rows = simulateTresorerieV2(inputs, PARAMS, 1);
    const row = rows[0];
    const a1 = row.revenusParAssocie?.find((r) => r.associateId === 'associe-1');

    // Reserves initial 200k mais Σ PP = 0 → seul le résultat courant (≈79 000 €) est distribué.
    // Aucune réserve ne peut être consommée.
    expect(a1?.grossDividends ?? 0).toBeCloseTo(79_000, 2);
  });

  it('société full PP (sans démembrement) : checkbox sans effet', () => {
    const inputs = buildDemembrementInputs(undefined);
    inputs.company.associates[0].ownershipLots = [
      { right: 'pleine_propriete', capitalPct: 50, economicRightsPct: 50 },
    ];
    inputs.company.associates[1].ownershipLots = [
      { right: 'pleine_propriete', capitalPct: 50, economicRightsPct: 50 },
    ];
    inputs.company.associates[1].revenuePhases[0].distribution.enabled = true;
    inputs.company.associates[1].revenuePhases[0].distribution.dividendsStrategy = 'max_treso';

    const inputsAvecCheckboxFalse: TresoInputsV6 = {
      ...inputs,
      company: { ...inputs.company, usufructuaryReserveAttribution: false },
    };
    const inputsAvecCheckboxTrue: TresoInputsV6 = {
      ...inputs,
      company: { ...inputs.company, usufructuaryReserveAttribution: true },
    };

    const rowsFalse = simulateTresorerieV2(inputsAvecCheckboxFalse, PARAMS, 1);
    const rowsTrue = simulateTresorerieV2(inputsAvecCheckboxTrue, PARAMS, 1);

    const a1False = rowsFalse[0].revenusParAssocie?.find((r) => r.associateId === 'associe-1');
    const a1True = rowsTrue[0].revenusParAssocie?.find((r) => r.associateId === 'associe-1');
    expect(a1False?.grossDividends).toBeCloseTo(a1True?.grossDividends ?? -1, 2);
  });
});
