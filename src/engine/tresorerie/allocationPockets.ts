import type {
  AllocationMatrixInput,
  AllocationPocketInput,
  AllocationStrategyMode,
} from './types';

export function sortAllocationPockets(pockets: AllocationPocketInput[]): AllocationPocketInput[] {
  return pockets
    .map((pocket, index) => ({ pocket, index }))
    .sort((a, b) => {
      const priority = (a.pocket.withdrawalPriority ?? Number.MAX_SAFE_INTEGER)
        - (b.pocket.withdrawalPriority ?? Number.MAX_SAFE_INTEGER);
      if (priority !== 0) return priority;
      return a.index - b.index;
    })
    .map(item => item.pocket);
}

export function normalizeAllocationPockets(pockets: AllocationPocketInput[]): AllocationPocketInput[] {
  return sortAllocationPockets(pockets).slice(0, 5);
}

export function getEffectiveAllocationMode(pockets: AllocationPocketInput[]): AllocationStrategyMode {
  return normalizeAllocationPockets(pockets).length <= 1 ? 'single' : 'strategy';
}

export function selectAllocationPocketsForSimulation(
  matrix: AllocationMatrixInput,
): AllocationPocketInput[] {
  return normalizeAllocationPockets(matrix.pockets);
}
