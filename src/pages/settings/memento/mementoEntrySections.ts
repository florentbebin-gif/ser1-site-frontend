import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import type { MementoChapterId } from '@/domain/settings-memento/types';

export interface MementoEntrySectionProps {
  entryKey: string;
}

export interface MementoChapterWrapperProps {
  children: ReactNode;
}

const MementoDmtgEntrySection = lazy(() => import('./MementoDmtgEntrySection'));
const MementoDmtgChapterProvider = lazy(() => import('../DmtgSuccession/DmtgSuccessionProvider'));
const MementoComptablesSocietesEntrySection = lazy(
  () => import('./MementoComptablesSocietesEntrySection'),
);
const MementoComptablesSocietesChapterProvider = lazy(
  () => import('../ComptablesSocietes/ComptablesSocietesProvider'),
);
const MementoImpotsEntrySection = lazy(() => import('./MementoImpotsEntrySection'));
const MementoImpotsChapterProvider = lazy(() => import('../Impots/ImpotsProvider'));
const MementoPrelevementsEntrySection = lazy(() => import('./MementoPrelevementsEntrySection'));
const MementoPrelevementsChapterProvider = lazy(
  () => import('../Prelevements/PrelevementsProvider'),
);

type EntrySectionComponent = LazyExoticComponent<ComponentType<MementoEntrySectionProps>>;
type ChapterWrapperComponent = LazyExoticComponent<ComponentType<MementoChapterWrapperProps>>;

const READ_ENTRY_SECTIONS: Partial<Record<string, readonly EntrySectionComponent[]>> = {
  'transmission.succession-dmtg': [MementoDmtgEntrySection],
  'transmission.donations-anterieures': [MementoDmtgEntrySection],
  'transmission.assurance-vie-deces': [MementoDmtgEntrySection],
  'transmission.liberalites': [MementoDmtgEntrySection],
  'civil.reserve-quotite': [MementoDmtgEntrySection],
  'civil.devolution-conjoint-survivant': [MementoDmtgEntrySection],
  'civil.regime-matrimonial': [MementoDmtgEntrySection],
  'societe.is': [MementoComptablesSocietesEntrySection],
  'societe.groupe-mere-fille-qpfc': [MementoComptablesSocietesEntrySection],
  'societe.compte-courant-associe': [MementoComptablesSocietesEntrySection],
  'dirigeant.dividendes-tns': [
    MementoComptablesSocietesEntrySection,
    MementoPrelevementsEntrySection,
  ],
  'dirigeant.charges-sociales-tns': [MementoPrelevementsEntrySection],
  'placements.ps-pfu-revenus-capital': [MementoPrelevementsEntrySection],
  'retraite.globale': [MementoPrelevementsEntrySection],
  'fiscalite-foyer.ir': [MementoImpotsEntrySection],
  'fiscalite-foyer.ifi': [MementoImpotsEntrySection],
};

const READ_CHAPTER_WRAPPERS: Partial<Record<MementoChapterId, readonly ChapterWrapperComponent[]>> =
  {
    transmission: [MementoDmtgChapterProvider],
    'fiscalite-foyer': [MementoImpotsChapterProvider],
    societe: [MementoComptablesSocietesChapterProvider],
    placements: [MementoPrelevementsChapterProvider],
    retraite: [MementoPrelevementsChapterProvider],
    dirigeant: [MementoComptablesSocietesChapterProvider, MementoPrelevementsChapterProvider],
  };

export function readEntrySectionsForKey(entryKey: string): readonly EntrySectionComponent[] {
  return READ_ENTRY_SECTIONS[entryKey] ?? [];
}

export function readEntrySectionForKey(entryKey: string): EntrySectionComponent | undefined {
  return readEntrySectionsForKey(entryKey)[0];
}

export function readChapterWrappersForChapter(
  chapterId: MementoChapterId,
): readonly ChapterWrapperComponent[] {
  return READ_CHAPTER_WRAPPERS[chapterId] ?? [];
}

export function readChapterWrapperForChapter(
  chapterId: MementoChapterId,
): ChapterWrapperComponent | undefined {
  return readChapterWrappersForChapter(chapterId)[0];
}
