import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

import type { MementoChapterId } from '@/domain/settings-memento/types';

import {
  getMementoSettingsSection,
  type MementoSettingsSection,
  type MementoSettingsSectionId,
} from './mementoSettingsSections';

const BaseContratSettingsPanel = lazy(() => import('../BaseContrat/BaseContratSettingsPanel'));
const PrelevementsSettingsPanel = lazy(() => import('../Prelevements/PrelevementsSettingsPanel'));
const PrevoyanceRegimesSettingsPanel = lazy(
  () => import('../PrevoyanceRegimes/PrevoyanceRegimesSettingsPanel'),
);

export interface MementoValueSection {
  section: MementoSettingsSection;
  Panel: LazyExoticComponent<ComponentType>;
}

export const MEMENTO_VALUE_PANEL_BY_SECTION: Partial<
  Record<MementoSettingsSectionId, LazyExoticComponent<ComponentType>>
> = {
  prelevements: PrelevementsSettingsPanel,
  'base-contrat': BaseContratSettingsPanel,
  'prevoyance-regimes': PrevoyanceRegimesSettingsPanel,
};

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

export const MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER: Partial<
  Record<MementoChapterId, readonly MementoSettingsSectionId[]>
> = {
  placements: ['prelevements'],
  retraite: ['prelevements'],
  prevoyance: ['prevoyance-regimes'],
};

function valueSectionsForIds(
  sectionIds: readonly MementoSettingsSectionId[] | undefined,
): MementoValueSection[] {
  return (sectionIds ?? []).flatMap((sectionId) => {
    const Panel = MEMENTO_VALUE_PANEL_BY_SECTION[sectionId];
    if (!Panel) return [];

    return [
      {
        section: getMementoSettingsSection(sectionId),
        Panel,
      },
    ];
  });
}

export function readValueSectionsForChapter(chapterId: MementoChapterId): MementoValueSection[] {
  return valueSectionsForIds(MEMENTO_READ_SETTINGS_SECTION_IDS_BY_CHAPTER[chapterId]);
}

export function auditSettingsSectionsForChapter(
  chapterId: MementoChapterId,
): readonly MementoSettingsSection[] {
  return (MEMENTO_AUDIT_SETTINGS_SECTION_IDS_BY_CHAPTER[chapterId] ?? []).map((sectionId) =>
    getMementoSettingsSection(sectionId),
  );
}
