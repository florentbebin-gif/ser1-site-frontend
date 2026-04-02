import { DEFAULT_DMTG, type RegimeMatrimonial } from '../../../engine/civil';
import type {
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDevolutionContextInput,
  SuccessionEnfant,
  SuccessionLiquidationContext,
} from '../successionDraft';
import { DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT } from '../successionDraft';
import { buildSuccessionDevolutionAnalysis } from '../successionDevolution';
import {
  buildSuccessionDirectDisplayAnalysis,
  computeSuccessionDirectEstateBasis,
} from '../successionDisplay';

export function makeCivil(overrides: Partial<SuccessionCivilContext> = {}): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'celibataire',
    regimeMatrimonial: null as RegimeMatrimonial | null,
    pacsConvention: 'separation',
    ...overrides,
  };
}

export function makeDevolution(
  overrides: SuccessionDevolutionContextInput = {},
): SuccessionDevolutionContext {
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
    ascendantsSurvivantsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
      ...overrides.ascendantsSurvivantsBySide,
    },
  };
}

export function makeLiquidation(
  overrides: Partial<SuccessionLiquidationContext> = {},
): SuccessionLiquidationContext {
  return {
    actifEpoux1: 0,
    actifEpoux2: 0,
    actifCommun: 0,
    nbEnfants: 0,
    ...overrides,
  };
}

export function buildDirectAnalysis(options: {
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
  devolutionContext?: SuccessionDevolutionContext;
  enfantsContext?: SuccessionEnfant[];
  familyMembers?: Parameters<typeof buildSuccessionDevolutionAnalysis>[5];
  order?: 'epoux1' | 'epoux2';
  actifNetSuccession?: number;
}) {
  const devolutionContext = options.devolutionContext ?? makeDevolution({});
  const enfantsContext = options.enfantsContext ?? [];
  const familyMembers = options.familyMembers ?? [];
  const order = options.order ?? 'epoux1';
  const basis = computeSuccessionDirectEstateBasis(options.civil, options.liquidation, order);
  const actifNetSuccession = options.actifNetSuccession ?? basis.actifNetSuccession;
  const devolution = buildSuccessionDevolutionAnalysis(
    options.civil,
    options.liquidation.nbEnfants,
    devolutionContext,
    actifNetSuccession,
    enfantsContext,
    familyMembers,
    { simulatedDeceased: order },
  );

  return buildSuccessionDirectDisplayAnalysis({
    civil: options.civil,
    devolution,
    devolutionContext,
    dmtgSettings: DEFAULT_DMTG,
    enfantsContext,
    familyMembers,
    order,
    actifNetSuccession,
    baseWarnings: basis.warnings,
  });
}
