import type { PerHistoricalBasis } from '../../../engine/per';

export type PerProjectionScopeMode = 'versement-n' | 'declaration-n1' | null;
export type PerProjectionScopeStep = 1 | 2 | 3 | 4 | 5;

interface PerProjectionScopeParams {
  step: PerProjectionScopeStep;
  mode: PerProjectionScopeMode;
  historicalBasis: PerHistoricalBasis | null;
  needsCurrentYearEstimate: boolean;
}

export function shouldUseProjectionForCalculation({
  step,
  mode,
  historicalBasis,
  needsCurrentYearEstimate,
}: PerProjectionScopeParams): boolean {
  if (mode !== 'versement-n' || historicalBasis === null) {
    return false;
  }

  if (historicalBasis === 'current-avis') {
    return step >= 3;
  }

  return needsCurrentYearEstimate && step >= 4;
}
