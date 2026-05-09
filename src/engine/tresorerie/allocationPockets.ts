import type {
  AllocationMatrixInput,
  AllocationPocketInput,
  AllocationStrategyMode,
} from './types';

export function sortAllocationPockets(pockets: AllocationPocketInput[]): AllocationPocketInput[] {
  return [...pockets];
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
