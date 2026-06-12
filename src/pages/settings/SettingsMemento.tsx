import { useMemo, useState, type ReactElement } from 'react';

import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import {
  MEMENTO_BUSINESS_PRIORITY_VALUES,
  MEMENTO_CHAPTERS,
  MEMENTO_ENTRIES,
  MEMENTO_STATUS_VALUES,
  MEMENTO_USER_INTENTS,
  SIMULATOR_MEMENTO_COVERAGE,
  chaptersForIntent,
  type MementoBusinessPriority,
  type MementoChapter,
  type MementoChapterId,
  type MementoEntry,
  type MementoStatus,
  type MementoUserIntent,
  type SimulatorCoverageEntry,
} from '@/domain/settings-memento';

import MementoChapterSection from './memento/MementoChapterSection';
import { MEMENTO_PRIORITY_LABELS, MEMENTO_STATUS_LABELS } from './memento/MementoEntryRow';
import {
  getMementoSettingsMigrationSection,
  type MementoSettingsMigrationSection,
  type MementoSettingsSectionId,
} from './memento/mementoSettingsSections';

type StatusFilter = 'all' | MementoStatus;
type ChapterFilter = 'all' | MementoChapterId;
type PriorityFilter = 'all' | MementoBusinessPriority;
type IntentFilter = 'all' | MementoUserIntent;

interface FilteredChapter {
  chapter: MementoChapter;
  entries: readonly MementoEntry[];
  coverage: readonly SimulatorCoverageEntry[];
  settingsSections: readonly MementoSettingsMigrationSection[];
}

const MEMENTO_ENTRY_LIST: readonly MementoEntry[] = MEMENTO_ENTRIES;
const SIMULATOR_COVERAGE_LIST: readonly SimulatorCoverageEntry[] = SIMULATOR_MEMENTO_COVERAGE;

const MEMENTO_CHAPTER_SETTINGS_SECTION_IDS: Partial<
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
      entry.priority,
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
  priorityFilter: PriorityFilter,
): boolean {
  if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
  if (priorityFilter !== 'all' && entry.priority !== priorityFilter) return false;
  return entryMatchesSearch(entry, search) || normalizeSearchText(chapter.label).includes(search);
}

function coverageMatchesFilters(
  entry: SimulatorCoverageEntry,
  chapter: MementoChapter,
  search: string,
  statusFilter: StatusFilter,
): boolean {
  if (statusFilter !== 'all' && entry.expectedStatus !== statusFilter) return false;
  return (
    coverageMatchesSearch(entry, search) || normalizeSearchText(chapter.label).includes(search)
  );
}

function chapterMatchesFilters(
  chapter: MementoChapter,
  chapterFilter: ChapterFilter,
  intentChapterIds: ReadonlySet<MementoChapterId> | null,
): boolean {
  if (chapterFilter !== 'all' && chapter.id !== chapterFilter) return false;
  return intentChapterIds === null || intentChapterIds.has(chapter.id);
}

function settingsSectionsForChapter(
  chapterId: MementoChapterId,
): readonly MementoSettingsMigrationSection[] {
  return (MEMENTO_CHAPTER_SETTINGS_SECTION_IDS[chapterId] ?? []).map((sectionId) =>
    getMementoSettingsMigrationSection(sectionId),
  );
}

function buildFilteredChapters(
  searchValue: string,
  statusFilter: StatusFilter,
  chapterFilter: ChapterFilter,
  priorityFilter: PriorityFilter,
  intentFilter: IntentFilter,
): FilteredChapter[] {
  const search = normalizeSearchText(searchValue);
  const intentChapterIds =
    intentFilter === 'all' ? null : new Set<MementoChapterId>(chaptersForIntent(intentFilter));
  const hasContentFilter = search !== '' || statusFilter !== 'all' || priorityFilter !== 'all';

  return MEMENTO_CHAPTERS.map((chapter) => {
    if (!chapterMatchesFilters(chapter, chapterFilter, intentChapterIds)) {
      return { chapter, entries: [], coverage: [], settingsSections: [] };
    }

    const entries = MEMENTO_ENTRY_LIST.filter(
      (entry) =>
        entry.chapterId === chapter.id &&
        entryMatchesFilters(entry, chapter, search, statusFilter, priorityFilter),
    );
    const coverage = SIMULATOR_COVERAGE_LIST.filter(
      (entry) =>
        entry.chapterId === chapter.id &&
        coverageMatchesFilters(entry, chapter, search, statusFilter),
    );
    const settingsSections = settingsSectionsForChapter(chapter.id);

    return { chapter, entries, coverage, settingsSections };
  }).filter(
    ({ entries, coverage, settingsSections }) =>
      entries.length + coverage.length > 0 || (!hasContentFilter && settingsSections.length > 0),
  );
}

function formatHeroCount(entryCount: number, coverageCount: number): string {
  const entryLabel = `${entryCount} entrée${entryCount > 1 ? 's' : ''}`;
  const coverageLabel = `${coverageCount} contrôle${coverageCount > 1 ? 's' : ''}`;
  return `${entryLabel} métier · ${coverageLabel}`;
}

export default function SettingsMemento(): ReactElement {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [intentFilter, setIntentFilter] = useState<IntentFilter>('all');
  const [openChapterId, setOpenChapterId] = useState<MementoChapterId | null>(null);

  const filteredChapters = useMemo(
    () =>
      buildFilteredChapters(searchValue, statusFilter, chapterFilter, priorityFilter, intentFilter),
    [chapterFilter, intentFilter, priorityFilter, searchValue, statusFilter],
  );
  const visibleEntryCount = filteredChapters.reduce(
    (total, section) => total + section.entries.length,
    0,
  );
  const visibleCoverageCount = filteredChapters.reduce(
    (total, section) => total + section.coverage.length,
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
              Lecture courte par domaine, raccordée aux paramètres qui alimentent les simulateurs.
              Les valeurs restent dans les sources centralisées.
            </p>
          </div>
          <div className="settings-memento-hero__meta" aria-live="polite">
            {formatHeroCount(visibleEntryCount, visibleCoverageCount)}
          </div>
        </div>
      </section>

      <section
        className="settings-premium-card settings-memento-filters"
        aria-label="Filtres du mémento"
      >
        <label className="settings-memento-filter" htmlFor="settings-memento-search">
          <span>Recherche mémento</span>
          <input
            id="settings-memento-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Chapitre, page, statut..."
          />
        </label>

        <label className="settings-memento-filter" htmlFor="settings-memento-intent">
          <span>Intention métier</span>
          <select
            id="settings-memento-intent"
            value={intentFilter}
            onChange={(event) => setIntentFilter(event.target.value as IntentFilter)}
          >
            <option value="all">Toutes les intentions</option>
            {MEMENTO_USER_INTENTS.map((intent) => (
              <option key={intent.id} value={intent.id}>
                {intent.label}
              </option>
            ))}
          </select>
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

        <label className="settings-memento-filter" htmlFor="settings-memento-priority">
          <span>Priorité métier</span>
          <select
            id="settings-memento-priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
          >
            <option value="all">Toutes les priorités</option>
            {MEMENTO_BUSINESS_PRIORITY_VALUES.map((priority) => (
              <option key={priority} value={priority}>
                {MEMENTO_PRIORITY_LABELS[priority]}
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
              settingsSections={section.settingsSections}
              isOpen={openChapterId === section.chapter.id}
              onToggle={() =>
                setOpenChapterId((current) =>
                  current === section.chapter.id ? null : section.chapter.id,
                )
              }
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
