import { useMemo, useState, type ReactElement } from 'react';

import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import {
  MEMENTO_CHAPTERS,
  MEMENTO_ENTRIES,
  MEMENTO_STATUS_VALUES,
  SIMULATOR_MEMENTO_COVERAGE,
  type MementoChapter,
  type MementoChapterId,
  type MementoEntry,
  type MementoStatus,
  type SimulatorCoverageEntry,
} from '@/domain/settings-memento';

import MementoChapterSection from './memento/MementoChapterSection';
import { MEMENTO_STATUS_LABELS } from './memento/MementoEntryRow';

type StatusFilter = 'all' | MementoStatus;
type ChapterFilter = 'all' | MementoChapterId;

interface FilteredChapter {
  chapter: MementoChapter;
  entries: readonly MementoEntry[];
  coverage: readonly SimulatorCoverageEntry[];
}

const MEMENTO_ENTRY_LIST: readonly MementoEntry[] = MEMENTO_ENTRIES;
const SIMULATOR_COVERAGE_LIST: readonly SimulatorCoverageEntry[] = SIMULATOR_MEMENTO_COVERAGE;

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function coverageTargetSearchText(entry: SimulatorCoverageEntry): string {
  switch (entry.target.kind) {
    case 'registry':
      return entry.target.simulatorId;
    case 'subtype':
      return `${entry.target.parentSimulatorId} ${entry.target.subtypeLabel}`;
    case 'roadmap-only':
      return `${entry.target.roadmapId} ${entry.target.roadmapLabel}`;
  }
}

function entryMatchesSearch(entry: MementoEntry, search: string): boolean {
  if (!search) return true;
  return normalizeSearchText(
    [
      entry.key,
      entry.label,
      entry.description,
      entry.status,
      entry.statusReason,
      entry.ownerPagePath ?? '',
      ...entry.relatedSimulatorIds,
    ].join(' '),
  ).includes(search);
}

function coverageMatchesSearch(entry: SimulatorCoverageEntry, search: string): boolean {
  if (!search) return true;
  return normalizeSearchText(
    [
      entry.sectionLabel,
      entry.expectedStatus,
      entry.note ?? '',
      coverageTargetSearchText(entry),
    ].join(' '),
  ).includes(search);
}

function entryMatchesFilters(
  entry: MementoEntry,
  chapter: MementoChapter,
  search: string,
  statusFilter: StatusFilter,
  chapterFilter: ChapterFilter,
): boolean {
  if (chapterFilter !== 'all' && entry.chapterId !== chapterFilter) return false;
  if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
  return entryMatchesSearch(entry, search) || normalizeSearchText(chapter.label).includes(search);
}

function coverageMatchesFilters(
  entry: SimulatorCoverageEntry,
  chapter: MementoChapter,
  search: string,
  statusFilter: StatusFilter,
  chapterFilter: ChapterFilter,
): boolean {
  if (chapterFilter !== 'all' && entry.chapterId !== chapterFilter) return false;
  if (statusFilter !== 'all' && entry.expectedStatus !== statusFilter) return false;
  return (
    coverageMatchesSearch(entry, search) || normalizeSearchText(chapter.label).includes(search)
  );
}

function buildFilteredChapters(
  searchValue: string,
  statusFilter: StatusFilter,
  chapterFilter: ChapterFilter,
): FilteredChapter[] {
  const search = normalizeSearchText(searchValue);

  return MEMENTO_CHAPTERS.map((chapter) => {
    const entries = MEMENTO_ENTRY_LIST.filter(
      (entry) =>
        entry.chapterId === chapter.id &&
        entryMatchesFilters(entry, chapter, search, statusFilter, chapterFilter),
    );
    const coverage = SIMULATOR_COVERAGE_LIST.filter(
      (entry) =>
        entry.chapterId === chapter.id &&
        coverageMatchesFilters(entry, chapter, search, statusFilter, chapterFilter),
    );

    return { chapter, entries, coverage };
  }).filter(({ entries, coverage }) => entries.length + coverage.length > 0);
}

function formatVisibleRowCount(count: number): string {
  return `${count} ligne${count > 1 ? 's' : ''} visible${count > 1 ? 's' : ''}`;
}

export default function SettingsMemento(): ReactElement {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>('all');

  const filteredChapters = useMemo(
    () => buildFilteredChapters(searchValue, statusFilter, chapterFilter),
    [chapterFilter, searchValue, statusFilter],
  );
  const visibleRowCount = filteredChapters.reduce(
    (total, section) => total + section.entries.length + section.coverage.length,
    0,
  );

  return (
    <div className="settings-page settings-memento-page" data-testid="settings-memento">
      <section className="settings-premium-card settings-memento-hero">
        <div className="settings-premium-header settings-premium-header--row">
          <div className="settings-action-text settings-memento-hero__body">
            <h2 className="settings-premium-title">
              <SettingsTitleWithIcon icon="book">
                Mémento patrimonial & social
              </SettingsTitleWithIcon>
            </h2>
            <p className="settings-premium-subtitle">
              Grille de couverture métier des chapitres, pages settings propriétaires et
              simulateurs, sans porter de valeurs fiscales ou sociales.
            </p>
          </div>
          <div className="settings-memento-hero__meta" aria-live="polite">
            {formatVisibleRowCount(visibleRowCount)}
          </div>
        </div>
      </section>

      <section className="settings-premium-card settings-memento-filters" aria-label="Filtres">
        <label className="settings-memento-filter" htmlFor="settings-memento-search">
          <span>Recherche mémento</span>
          <input
            id="settings-memento-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Chapitre, simulateur, statut..."
          />
        </label>

        <label className="settings-memento-filter" htmlFor="settings-memento-status">
          <span>Statut</span>
          <select
            id="settings-memento-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">Tous les statuts</option>
            {MEMENTO_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {MEMENTO_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="settings-memento-filter" htmlFor="settings-memento-chapter">
          <span>Chapitre</span>
          <select
            id="settings-memento-chapter"
            value={chapterFilter}
            onChange={(event) => setChapterFilter(event.target.value as ChapterFilter)}
          >
            <option value="all">Tous les chapitres</option>
            {MEMENTO_CHAPTERS.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="settings-stack settings-memento-stack">
        {filteredChapters.length > 0 ? (
          filteredChapters.map((section) => (
            <MementoChapterSection
              key={section.chapter.id}
              chapter={section.chapter}
              entries={section.entries}
              coverage={section.coverage}
              defaultOpen
            />
          ))
        ) : (
          <section className="settings-premium-card settings-memento-empty">
            Aucun chapitre ne correspond aux filtres.
          </section>
        )}
      </div>
    </div>
  );
}
