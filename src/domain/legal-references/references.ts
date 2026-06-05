import referencesData from './references.json';
import type { LegalReference, LegalReferenceId, LegalReferenceSettingKey } from './types';

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

export function getOptionalLegalReference(id: LegalReferenceId): LegalReference | null {
  return LEGAL_REFERENCE_BY_ID.get(id) ?? null;
}

export function listLegalReferencesForSimulator(
  simulatorId: string,
  references: readonly LegalReference[] = LEGAL_REFERENCES,
): LegalReference[] {
  return references.filter((reference) => reference.relatedSimulatorIds?.includes(simulatorId));
}

export function listLegalReferencesForSetting(
  settingKey: LegalReferenceSettingKey,
  references: readonly LegalReference[] = LEGAL_REFERENCES,
): LegalReference[] {
  return references.filter((reference) => reference.relatedSettings?.includes(settingKey));
}

export function listLegalReferencesForProduct(
  productId: string,
  references: readonly LegalReference[] = LEGAL_REFERENCES,
): LegalReference[] {
  return references.filter((reference) => reference.relatedCatalogProducts?.includes(productId));
}
