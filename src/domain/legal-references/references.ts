import referencesData from './references.json';
import type { LegalReference, LegalReferenceId } from './types';

export const LEGAL_REFERENCES = referencesData as readonly LegalReference[];

export const LEGAL_REFERENCE_BY_ID = new Map<LegalReferenceId, LegalReference>(
  LEGAL_REFERENCES.map((reference) => [reference.id, reference]),
);

export function getLegalReference(id: LegalReferenceId): LegalReference {
  const reference = LEGAL_REFERENCE_BY_ID.get(id);
  if (!reference) {
    throw new Error(`Référence juridique introuvable : ${id}`);
  }
  return reference;
}

export function listLegalReferencesForSimulator(simulatorId: string): LegalReference[] {
  return LEGAL_REFERENCES.filter((reference) =>
    reference.relatedSimulatorIds?.includes(simulatorId),
  );
}
