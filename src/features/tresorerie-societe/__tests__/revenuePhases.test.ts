import { describe, expect, it } from 'vitest';
import type { AssociateInput, AssociateRevenuePhaseInput } from '@/engine/tresorerie/types';
import {
  addPhase,
  buildNextPhase,
  computeComplement,
  computeNetRevenue,
  getActivePhase,
  getAssociateAnnualIncomeNeedForYear,
  getPhaseEndYear,
  removePhase,
  sortPhases,
  updatePhase,
} from '../utils/revenuePhases';

const phase = (
  patch: Partial<AssociateRevenuePhaseInput> & Pick<AssociateRevenuePhaseInput, 'id' | 'startYear'>,
): AssociateRevenuePhaseInput => ({
  source: 'none',
  loadedAnnualCost: 0,
  socialChargeRate: 0,
  annualNetIncomeNeed: 0,
  useCcaForCompletion: true,
  ...patch,
});

const associate = (patch: Partial<AssociateInput> = {}): AssociateInput => ({
  id: 'associe-1',
  label: 'Associé 1',
  kind: 'pp',
  profile: {
    currentAge: 50,
    retirementAge: 65,
    annualIncomeNeed: 30_000,
    projectionStartYear: 2026,
  },
  ownershipLots: [{ right: 'pleine_propriete', capitalPct: 100, economicRightsPct: 100 }],
  roles: ['associe_sans_statut'],
  cca: {
    currentBalance: 0,
    exceptionalContributions: [],
    annualContribution: { amount: 0, startYear: 2026 },
    remunerationRate: 0,
  },
  ...patch,
});

describe('revenuePhases', () => {
  it('trie les paliers par année de début sans muter la liste source', () => {
    const phases = [phase({ id: 'p2', startYear: 2031 }), phase({ id: 'p1', startYear: 2026 })];

    expect(sortPhases(phases).map((item) => item.id)).toEqual(['p1', 'p2']);
    expect(phases.map((item) => item.id)).toEqual(['p2', 'p1']);
  });

  it('retourne le dernier palier actif à une année donnée', () => {
    const phases = [
      phase({ id: 'p1', startYear: 2026 }),
      phase({ id: 'p3', startYear: 2035 }),
      phase({ id: 'p2', startYear: 2031 }),
    ];

    expect(getActivePhase(phases, 2025)).toBeUndefined();
    expect(getActivePhase(phases, 2026)?.id).toBe('p1');
    expect(getActivePhase(phases, 2034)?.id).toBe('p2');
    expect(getActivePhase(phases, 2040)?.id).toBe('p3');
  });

  it('déduit la fin du palier depuis le palier suivant ou l’horizon', () => {
    const phases = [phase({ id: 'p1', startYear: 2026 }), phase({ id: 'p2', startYear: 2031 })];

    expect(getPhaseEndYear(phases[0], phases, 2040)).toBe(2030);
    expect(getPhaseEndYear(phases[1], phases, 2040)).toBe(2040);
  });

  it('construit le palier suivant en héritant du dernier palier', () => {
    const next = buildNextPhase(
      [
        phase({
          id: 'p1',
          startYear: 2026,
          source: 'holding',
          loadedAnnualCost: 80_000,
          socialChargeRate: 0.3,
          annualNetIncomeNeed: 56_000,
          useCcaForCompletion: false,
        }),
      ],
      2026,
      () => 'p2',
    );

    expect(next).toMatchObject({
      id: 'p2',
      startYear: 2027,
      source: 'holding',
      loadedAnnualCost: 80_000,
      socialChargeRate: 0.3,
      annualNetIncomeNeed: 56_000,
      useCcaForCompletion: false,
    });
  });

  it('ajoute, modifie et supprime les paliers en conservant au moins un palier', () => {
    const p1 = phase({ id: 'p1', startYear: 2026 });
    const p2 = phase({ id: 'p2', startYear: 2031 });

    expect(addPhase([p2], p1).map((item) => item.id)).toEqual(['p1', 'p2']);
    expect(updatePhase([p1, p2], 'p2', { startYear: 2035 })[1].startYear).toBe(2035);
    expect(removePhase([p1, p2], 'p2')).toEqual([p1]);
    expect(removePhase([p1], 'p1')).toEqual([p1]);
  });

  it('calcule le net annuel et le complément à financer', () => {
    const item = phase({
      id: 'p1',
      startYear: 2026,
      source: 'holding',
      loadedAnnualCost: 100_000,
      socialChargeRate: 0.4,
      annualNetIncomeNeed: 75_000,
    });

    expect(computeNetRevenue(item)).toBe(60_000);
    expect(computeComplement(item)).toBe(15_000);
  });

  it('lit le besoin annuel actif depuis le palier puis retombe sur les fallbacks documentés', () => {
    const withPhases = associate({
      revenuePhases: [
        phase({ id: 'p1', startYear: 2026, annualNetIncomeNeed: 0 }),
        phase({ id: 'p2', startYear: 2031, annualNetIncomeNeed: 42_000 }),
      ],
    } as Partial<AssociateInput>);

    expect(getAssociateAnnualIncomeNeedForYear(withPhases, 30_000, 2032)).toBe(42_000);

    const withLegacyStop = associate({
      remuneration: {
        source: 'holding',
        loadedAnnualCost: 0,
        socialChargeRate: 0,
        endYear: 2030,
        annualNeedAfterStop: 36_000,
      },
    });
    expect(getAssociateAnnualIncomeNeedForYear(withLegacyStop, 30_000, 2031)).toBe(36_000);
    expect(getAssociateAnnualIncomeNeedForYear(associate(), 30_000, 2031)).toBe(30_000);
  });
});
