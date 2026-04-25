export type PerVisibleStep = 1 | 2 | 3 | 4 | 5;
export type PerVisibleMode = 'versement-n' | 'declaration-n1' | null;

export function buildVisibleSteps(
  mode: PerVisibleMode,
  needsCurrentYearEstimate: boolean,
): PerVisibleStep[] {
  if (!mode) {
    return [1];
  }

  if (mode === 'declaration-n1') {
    return [1, 2, 3];
  }

  return needsCurrentYearEstimate ? [1, 2, 3, 4] : [1, 2, 3];
}
