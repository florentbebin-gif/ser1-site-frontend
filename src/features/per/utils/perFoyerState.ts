import { derivePerNombreParts, type PerChildDraft } from './perParts';

export type PerSituationFamiliale = 'celibataire' | 'marie';

export interface PerNormalizedFoyer {
  situationFamiliale: PerSituationFamiliale;
  nombreParts: number;
  isole: boolean;
  children: PerChildDraft[];
  mutualisationConjoints: boolean;
}

export function normalizePerChildren(children: PerChildDraft[] | null | undefined): PerChildDraft[] {
  return Array.isArray(children)
    ? children
      .filter((child): child is PerChildDraft => Boolean(child) && (child.mode === 'charge' || child.mode === 'shared'))
      .map((child, index) => ({
        id: Number.isFinite(child.id) ? child.id : index + 1,
        mode: child.mode,
      }))
    : [];
}

export function normalizePerFoyer({
  situationFamiliale,
  isole,
  children,
  mutualisationConjoints,
}: {
  situationFamiliale: PerSituationFamiliale;
  isole: boolean;
  children: PerChildDraft[] | null | undefined;
  mutualisationConjoints: boolean;
}): PerNormalizedFoyer {
  const normalizedChildren = normalizePerChildren(children);
  const normalizedIsole = situationFamiliale === 'marie' ? false : isole;
  const normalizedMutualisation = situationFamiliale === 'marie'
    ? mutualisationConjoints
    : false;

  return {
    situationFamiliale,
    isole: normalizedIsole,
    children: normalizedChildren,
    mutualisationConjoints: normalizedMutualisation,
    nombreParts: derivePerNombreParts({
      situationFamiliale,
      isole: normalizedIsole,
      children: normalizedChildren,
    }),
  };
}

export function getNextPerChildId(children: PerChildDraft[]): number {
  return children.reduce((maxId, child) => Math.max(maxId, child.id), 0) + 1;
}
