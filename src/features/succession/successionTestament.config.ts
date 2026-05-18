import type {
  SuccessionBeneficiaryRef,
  SuccessionDevolutionContext,
  SuccessionParticularLegacyEntry,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from './successionDraft.types';

function createParticularLegacyId(): string {
  return `leg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSuccessionParticularLegacyEntry(
  beneficiaryRef: SuccessionBeneficiaryRef | null = null,
): SuccessionParticularLegacyEntry {
  return {
    id: createParticularLegacyId(),
    beneficiaryRef,
    amount: 0,
  };
}

export function cloneSuccessionTestamentConfig(
  config: SuccessionTestamentConfig,
): SuccessionTestamentConfig {
  return {
    ...config,
    particularLegacies: config.particularLegacies.map((entry) => ({ ...entry })),
  };
}

export function cloneSuccessionTestamentsBySide(
  testamentsBySide: SuccessionDevolutionContext['testamentsBySide'],
): SuccessionDevolutionContext['testamentsBySide'] {
  return {
    epoux1: cloneSuccessionTestamentConfig(testamentsBySide.epoux1),
    epoux2: cloneSuccessionTestamentConfig(testamentsBySide.epoux2),
  };
}

export function getCounterpartSide(side: SuccessionPrimarySide): SuccessionPrimarySide {
  return side === 'epoux1' ? 'epoux2' : 'epoux1';
}

export function getTestamentConfigForSide(
  context: Pick<SuccessionDevolutionContext, 'testamentsBySide'>,
  side: SuccessionPrimarySide,
): SuccessionTestamentConfig {
  return context.testamentsBySide[side];
}

export function hasActiveTestamentForSide(
  context: Pick<SuccessionDevolutionContext, 'testamentsBySide'>,
  side: SuccessionPrimarySide,
): boolean {
  return getTestamentConfigForSide(context, side).active;
}

export function getAscendantsSurvivantsForSide(
  context: Pick<SuccessionDevolutionContext, 'ascendantsSurvivantsBySide'>,
  side: SuccessionPrimarySide,
): boolean {
  return context.ascendantsSurvivantsBySide[side];
}
