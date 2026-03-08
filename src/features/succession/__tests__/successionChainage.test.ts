import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import type { SuccessionCivilContext, SuccessionLiquidationContext } from '../successionDraft';
import { buildSuccessionChainageAnalysis } from '../successionChainage';

function makeCivil(overrides: Partial<SuccessionCivilContext>): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makeLiquidation(overrides: Partial<SuccessionLiquidationContext>): SuccessionLiquidationContext {
  return {
    actifEpoux1: 400000,
    actifEpoux2: 200000,
    actifCommun: 300000,
    nbEnfants: 2,
    ...overrides,
  };
}

describe('buildSuccessionChainageAnalysis', () => {
  it('retourne un chaînage applicable avec total de droits', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({}),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
    expect(analysis.totalDroits).toBeGreaterThanOrEqual(0);
  });

  it('l’inversion de l’ordre modifie les masses en étape 1 quand actifs propres asymétriques', () => {
    const epoux1First = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 100000 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    const epoux2First = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 100000 }),
      regimeUsed: 'separation_biens',
      order: 'epoux2',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(epoux1First.step1?.actifTransmis).not.toBe(epoux2First.step1?.actifTransmis);
  });

  it('émet un warning et des droits nuls sans enfant', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ nbEnfants: 0 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.totalDroits).toBe(0);
    expect(analysis.warnings.some((w) => w.includes('Aucun enfant'))).toBe(true);
  });

  it('répartit une branche représentée entre petits-enfants et avertit', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ nbEnfants: 1 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun', deceased: true },
      ],
      familyMembers: [
        { id: 'PG1', type: 'petit_enfant', parentEnfantId: 'E2' },
        { id: 'PG2', type: 'petit_enfant', parentEnfantId: 'E2' },
      ],
    });

    expect(analysis.totalDroits).toBeGreaterThan(0);
    expect(analysis.warnings.some((w) => w.includes('représentation successorale simplifiée'))).toBe(true);
  });

  it("n'attribue au 1er décès que les descendants de la branche du défunt", () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 300000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'epoux1' },
        { id: 'E2', rattachement: 'epoux2' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E1']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E2']);
  });

  it('conserve un enfant commun dans les deux étapes et limite un enfant propre à sa branche', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 450000, actifEpoux2: 250000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'epoux1' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E1', 'E2']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E1']);
  });
});

