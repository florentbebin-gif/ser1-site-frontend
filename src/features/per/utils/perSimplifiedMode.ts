import type { PerHistoricalBasis } from '@/engine/per';

type PerSimplifiableState = {
  mode: 'versement-n' | 'declaration-n1' | null;
  historicalBasis: PerHistoricalBasis | null;
  needsCurrentYearEstimate: boolean;
};

export const PER_SIMPLIFIED_PRESET = {
  mode: 'versement-n',
  historicalBasis: 'current-avis',
  needsCurrentYearEstimate: false,
} as const satisfies PerSimplifiableState;

export function applyPerSimplifiedPreset<T extends PerSimplifiableState>(state: T): T {
  return {
    ...state,
    ...PER_SIMPLIFIED_PRESET,
  };
}

export function isPerSimplifiedPresetState(state: PerSimplifiableState): boolean {
  return state.mode === PER_SIMPLIFIED_PRESET.mode
    && state.historicalBasis === PER_SIMPLIFIED_PRESET.historicalBasis
    && state.needsCurrentYearEstimate === PER_SIMPLIFIED_PRESET.needsCurrentYearEstimate;
}
