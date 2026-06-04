import type { AllocationMatrixInput, AllocationPocketInput } from './types';

export const MAX_ACTIVE_POCKETS = 5;

export type AllocationKey = 'initialAllocationPct' | 'annualAllocationPct';

export function normalizeAllocationPockets(
  pockets: AllocationPocketInput[],
): AllocationPocketInput[] {
  return [...pockets].slice(0, MAX_ACTIVE_POCKETS);
}

export function selectAllocationPocketsForSimulation(
  matrix: AllocationMatrixInput,
): AllocationPocketInput[] {
  return normalizeAllocationPockets(matrix.pockets);
}

/**
 * Base investissable d'une allocation = trésorerie initiale nette de la trésorerie
 * protégée (solde minimum bancaire + BFR). Jamais négative.
 */
export function computeAllocatableBase(treasuryInitial: number, protectedCash: number): number {
  return Math.max(0, treasuryInitial - Math.max(0, protectedCash));
}

/**
 * Répartit un montant entre les poches selon une clé d'allocation.
 *
 * Source de vérité unique consommée par le moteur (`createLotsFromAllocation`),
 * l'UI (board + barre d'allocation) et les exports PPTX (cartes + timeline) :
 * normalisation (cap 5 poches) puis clamp proportionnel quand le total des
 * pourcentages dépasse 100 % (`scale = 100 / totalPct`). Le résultat est indexé
 * par `pocket.id` et contient toutes les poches normalisées (montant 0 inclus).
 */
export function distributeAmountByAllocation(
  pockets: AllocationPocketInput[],
  amount: number,
  allocationKey: AllocationKey,
): Map<string, number> {
  const normalized = normalizeAllocationPockets(pockets);
  const amounts = new Map<string, number>();
  const totalPct = normalized.reduce((sum, pocket) => sum + Math.max(0, pocket[allocationKey]), 0);
  const scale = totalPct > 100 ? 100 / totalPct : 1;

  for (const pocket of normalized) {
    const pct = Math.max(0, pocket[allocationKey]);
    const allocated = amount > 0 && totalPct > 0 ? (amount * pct * scale) / 100 : 0;
    amounts.set(pocket.id, allocated);
  }

  return amounts;
}

/**
 * Montant initial investi par poche, à partir de la base investissable.
 * Vue partagée UI/export (board, barre d'allocation, cartes PPTX, timeline PPTX).
 */
export function computePocketInitialAmounts(
  pockets: AllocationPocketInput[],
  allocatableBase: number,
): Map<string, number> {
  return distributeAmountByAllocation(pockets, allocatableBase, 'initialAllocationPct');
}
