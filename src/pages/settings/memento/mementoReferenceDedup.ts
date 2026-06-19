import type { LegalReferenceId } from '@/domain/legal-references';
import type { MementoEntry } from '@/domain/settings-memento/types';
import { SETTINGS_UI_REFERENCE_GROUPS } from '@/domain/settings-references/uiReferenceGroups';

import { readEntrySectionsForKey } from './mementoEntrySections';

function uniqueReferenceIds(refIds: readonly LegalReferenceId[]): LegalReferenceId[] {
  return Array.from(new Set(refIds));
}

export function getEntrySectionRenderedReferenceIds(entry: MementoEntry): LegalReferenceId[] {
  if (readEntrySectionsForKey(entry.key).length === 0) return [];

  const claimKeys = new Set(entry.claimKeys);
  if (claimKeys.size === 0) return [];

  return uniqueReferenceIds(
    SETTINGS_UI_REFERENCE_GROUPS.filter((group) =>
      group.claimKeys.some((claimKey) => claimKeys.has(claimKey)),
    ).flatMap((group) => group.refIds),
  );
}

export function getEntrySourceVisibleReferenceIds(entry: MementoEntry): LegalReferenceId[] {
  const renderedBySection = new Set(getEntrySectionRenderedReferenceIds(entry));

  return entry.refIds.filter((refId) => !renderedBySection.has(refId));
}

export function hasEntryReferencesRenderedBySection(entry: MementoEntry): boolean {
  const renderedBySection = new Set(getEntrySectionRenderedReferenceIds(entry));

  return entry.refIds.some((refId) => renderedBySection.has(refId));
}
