import { computeAutoPartsWithChildren } from '../../../engine/ir/parts';
import type { IrChild } from '../../../engine/ir/types';

export interface PerChildDraft {
  id: number;
  mode: 'charge' | 'shared';
}

export function derivePerNombreParts({
  situationFamiliale,
  isole,
  children,
}: {
  situationFamiliale: 'celibataire' | 'marie';
  isole: boolean;
  children: PerChildDraft[];
}): number {
  const irChildren: IrChild[] = children.map((child) => ({ mode: child.mode }));

  return computeAutoPartsWithChildren({
    status: situationFamiliale === 'marie' ? 'couple' : 'single',
    isIsolated: isole,
    children: irChildren,
  });
}
