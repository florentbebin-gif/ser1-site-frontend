import type { MementoChapterId } from '@/domain/settings-memento/types';

import {
  getMementoSettingsSection,
  type MementoSettingsSection,
  type MementoSettingsSectionId,
} from './mementoSettingsSections';

export const MEMENTO_AUDIT_SETTINGS_SECTION_IDS_BY_CHAPTER: Partial<
  Record<MementoChapterId, readonly MementoSettingsSectionId[]>
> = {
  'fiscalite-foyer': ['impots'],
  transmission: ['dmtg-succession'],
  placements: ['base-contrat'],
  immobilier: ['base-contrat'],
  retraite: ['prelevements'],
  'epargne-retraite': ['base-contrat'],
  prevoyance: ['prevoyance-regimes', 'base-contrat'],
  societe: ['comptables-societes'],
  dirigeant: ['prelevements', 'comptables-societes'],
  'transmission-entreprise': ['comptables-societes', 'base-contrat'],
};

export function auditSettingsSectionsForChapter(
  chapterId: MementoChapterId,
): readonly MementoSettingsSection[] {
  return (MEMENTO_AUDIT_SETTINGS_SECTION_IDS_BY_CHAPTER[chapterId] ?? []).map((sectionId) =>
    getMementoSettingsSection(sectionId),
  );
}
