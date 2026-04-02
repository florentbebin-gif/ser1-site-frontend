import type {
  SuccessionCivilContext,
  SuccessionDevolutionContextInput,
  SuccessionLiquidationContext,
} from '../successionDraft';
import { DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT } from '../successionDraft';

export function makeCivil(overrides: Partial<SuccessionCivilContext>): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

export function makeLiquidation(
  overrides: Partial<SuccessionLiquidationContext>,
): SuccessionLiquidationContext {
  return {
    actifEpoux1: 400000,
    actifEpoux2: 200000,
    actifCommun: 300000,
    nbEnfants: 2,
    ...overrides,
  };
}

export function makeDevolution(overrides: SuccessionDevolutionContextInput = {}) {
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

export const DONATION_SETTINGS = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
  donManuel: {
    abattementRenouvellement: 15,
  },
} as const;
