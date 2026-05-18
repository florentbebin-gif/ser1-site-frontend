import type { SuccessionChainOrder, SuccessionChainageAnalysis } from './successionChainage.types';

export function buildEmptyAnalysis(
  order: SuccessionChainOrder,
  warning: string,
): SuccessionChainageAnalysis {
  return {
    applicable: false,
    order,
    firstDecedeLabel: order === 'epoux1' ? 'Epoux 1' : 'Epoux 2',
    secondDecedeLabel: order === 'epoux1' ? 'Epoux 2' : 'Epoux 1',
    step1: null,
    step2: null,
    societeAcquets: null,
    participationAcquets: null,
    preciput: null,
    interMassClaims: null,
    affectedLiabilities: null,
    totalDroits: 0,
    warnings: [warning],
  };
}
