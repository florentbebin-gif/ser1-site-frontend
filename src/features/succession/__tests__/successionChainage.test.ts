import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  type SuccessionCivilContext,
  type SuccessionDevolutionContextInput,
  type SuccessionLiquidationContext,
} from '../successionDraft';
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

function makeDevolution(overrides: SuccessionDevolutionContextInput = {}) {
  return {
    ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
    ...overrides,
    testamentsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide,
      ...overrides.testamentsBySide,
      epoux1: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux1,
        ...overrides.testamentsBySide?.epoux1,
        particularLegacies: overrides.testamentsBySide?.epoux1?.particularLegacies ?? [],
      },
      epoux2: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux2,
        ...overrides.testamentsBySide?.epoux2,
        particularLegacies: overrides.testamentsBySide?.epoux2?.particularLegacies ?? [],
      },
    },
  };
}

describe('buildSuccessionChainageAnalysis', () => {
  it('returns an applicable chainage with total rights', () => {
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

  it('changes step 1 mass when death order is inverted on asymmetrical own assets', () => {
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

  it('emits a warning and zero rights without children', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ nbEnfants: 0 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.totalDroits).toBe(0);
    expect(analysis.warnings.some((warning) => warning.includes('Aucun enfant'))).toBe(true);
  });

  it('splits a represented branch across grandchildren and emits a warning', () => {
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
    expect(analysis.warnings.some((warning) => warning.includes('representation successorale simplifiee'))).toBe(true);
  });

  it('keeps only the deceased branch descendants at step 1', () => {
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

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['conjoint', 'E1']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E2']);
  });

  it('keeps a common child on both steps and limits a separate child to its branch', () => {
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

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['conjoint', 'E1', 'E2']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E1']);
  });

  it('keeps stable labels in a symmetric blended family', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 450000, actifEpoux2: 350000, actifCommun: 0, nbEnfants: 3 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'epoux1' },
        { id: 'E2', rattachement: 'commun' },
        { id: 'E3', rattachement: 'epoux2' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.label)).toEqual(['Conjoint survivant', 'E1', 'E2']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.label)).toEqual(['E2', 'E3']);
  });

  it('values total usufruct at step 1 and does not carry it into step 2', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        dateNaissanceEpoux1: '1955-06-01',
        dateNaissanceEpoux2: '1957-05-12',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      patrimonial: {
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'usufruit_total',
      },
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.partConjoint).toBe(200000);
    expect(analysis.step1?.partEnfants).toBe(300000);
    expect(analysis.step2?.actifTransmis).toBe(200000);
    expect(analysis.warnings.some((warning) => warning.includes('usufruit total valorise'))).toBe(true);
  });

  it('uses the testament of the side selected by death order', () => {
    const baseInput = {
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 280000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens' as const,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' as const },
        { id: 'E2', rattachement: 'commun' as const },
      ],
      familyMembers: [],
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_titre_universel',
            beneficiaryRef: 'enfant:E1',
            quotePartPct: 25,
            particularLegacies: [],
          },
          epoux2: {
            active: true,
            dispositionType: 'legs_titre_universel',
            beneficiaryRef: 'enfant:E2',
            quotePartPct: 25,
            particularLegacies: [],
          },
        },
      }),
    };

    const epoux1First = buildSuccessionChainageAnalysis({
      ...baseInput,
      order: 'epoux1',
    });
    const epoux2First = buildSuccessionChainageAnalysis({
      ...baseInput,
      order: 'epoux2',
    });

    expect(epoux1First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1')?.brut).toBeGreaterThan(
      epoux1First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E2')?.brut ?? 0,
    );
    expect(epoux2First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E2')?.brut).toBeGreaterThan(
      epoux2First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1')?.brut ?? 0,
    );
  });

  it('ignores at step 2 a testament still aimed at the already deceased spouse', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 250000, actifCommun: 0, nbEnfants: 1 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
      ],
      familyMembers: [],
      devolution: makeDevolution({
        testamentsBySide: {
          epoux2: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux1',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
    });

    expect(analysis.step2?.beneficiaries.some((beneficiary) => beneficiary.id === 'conjoint')).toBe(false);
    expect(analysis.warnings.some((warning) => warning.includes('deja decede ignore au second deces'))).toBe(true);
  });
});
