// Fallback simplifié quand seul le nombre d'enfants est connu (Excel case).
// Hypothèse : enfants comptés en garde exclusive; bonus parent isolé seulement si >=1 enfant.
interface EffectivePartsInput {
  status: string;
  isIsolated?: boolean;
  childrenCount: number;
}

export function computeEffectiveParts({ status, isIsolated, childrenCount }: EffectivePartsInput): number {
  const baseParts = status === 'couple' ? 2 : 1;

  const childrenParts = Array.from({ length: Math.max(0, childrenCount) }).reduce(
    (sum: number, _, idx: number) => sum + (idx < 2 ? 0.5 : 1),
    0
  );

  const hasChild = Math.max(0, childrenCount) > 0;
  const isolatedBonus = status === 'single' && isIsolated && hasChild ? 0.5 : 0;

  const computedParts = baseParts + childrenParts + isolatedBonus;

  return Math.max(baseParts, Math.round(computedParts * 4) / 4);
}
