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

const READ_ENTRY_SECTIONS: Partial<
  Record<string, LazyExoticComponent<ComponentType<MementoEntrySectionProps>>>
> = {
  'transmission.succession-dmtg': MementoDmtgEntrySection,
  'transmission.donations-anterieures': MementoDmtgEntrySection,
  'transmission.assurance-vie-deces': MementoDmtgEntrySection,
  'transmission.liberalites': MementoDmtgEntrySection,
  'civil.reserve-quotite': MementoDmtgEntrySection,
  'civil.devolution-conjoint-survivant': MementoDmtgEntrySection,
  'civil.regime-matrimonial': MementoDmtgEntrySection,
};

const READ_CHAPTER_WRAPPERS: Partial<
  Record<MementoChapterId, LazyExoticComponent<ComponentType<MementoChapterWrapperProps>>>
> = {
  transmission: MementoDmtgChapterProvider,
};

export function readEntrySectionForKey(
  entryKey: string,
): LazyExoticComponent<ComponentType<MementoEntrySectionProps>> | undefined {
  return READ_ENTRY_SECTIONS[entryKey];
}

export function readChapterWrapperForChapter(
  chapterId: MementoChapterId,
): LazyExoticComponent<ComponentType<MementoChapterWrapperProps>> | undefined {
  return READ_CHAPTER_WRAPPERS[chapterId];
}
