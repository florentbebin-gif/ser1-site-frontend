import type { AllocationMatrixInput, AllocationPocketInput } from './types';

export function normalizeAllocationPockets(
  pockets: AllocationPocketInput[],
): AllocationPocketInput[] {
  return [...pockets].slice(0, 5);
}

export function selectAllocationPocketsForSimulation(
  matrix: AllocationMatrixInput,
): AllocationPocketInput[] {
  return normalizeAllocationPockets(matrix.pockets);
}
