import type { PerHistoricalBasis } from '../../../engine/per';

export type PerVisibleStep = 1 | 2 | 3 | 4 | 5;
export type PerVisibleMode = 'versement-n' | 'declaration-n1' | null;

export function buildVisibleSteps(
  mode: PerVisibleMode,
  historicalBasis: PerHistoricalBasis | null,
  _needsCurrentYearEstimate: boolean,
): PerVisibleStep[] {
  if (!mode) {
    return [1];
  }

  if (mode === 'declaration-n1') {
    return [1, 2, 3];
  }

  if (historicalBasis === 'previous-avis-plus-n1') {
    return [1, 2, 3, 4];
  }

  if (historicalBasis === 'current-avis') {
    return [1, 2, 3];
  }

  return [1];
}
