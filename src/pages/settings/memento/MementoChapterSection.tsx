import type { ReactElement } from 'react';

import SettingsSectionCard from '@/components/settings/SettingsSectionCard';
import { SettingsIcon } from '@/components/settings/SettingsTitleWithIcon';
import type {
  MementoChapter,
  MementoEntry,
  SimulatorCoverageEntry,
} from '@/domain/settings-memento';
import { getSettingsRegistryEntry, type SettingsOwnerPagePath } from '@/domain/settings-registry';
import { getOptionalSimulatorDefinition } from '@/domain/simulators/registry';
import type { SimulatorDefinition, SimulatorLifecycle } from '@/domain/simulators/types';

import MementoEntryRow, {
  canRenderMementoOwnerLink,
  MEMENTO_STATUS_LABELS,
} from './MementoEntryRow';

const SIMULATOR_LIFECYCLE_LABELS: Record<SimulatorLifecycle, string> = {
  active: 'Actif',
  hub: 'Hub',
  placeholder: 'Placeholder',
  planned: 'Planifié',
  expertOnly: 'Expert',
  internalOnly: 'Interne',
};

const LIFECYCLES_WITHOUT_OWNER_LINK = new Set<SimulatorLifecycle>([
  'planned',
  'internalOnly',
  'placeholder',
]);

interface MementoChapterSectionProps {
  chapter: MementoChapter;
  entries: readonly MementoEntry[];
  coverage: readonly SimulatorCoverageEntry[];
  defaultOpen?: boolean;
}

function ChapterIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <SettingsIcon name="layers" />
    </svg>
  );
}

function coverageTargetId(entry: SimulatorCoverageEntry): string {
  switch (entry.target.kind) {
    case 'registry':
      return entry.target.simulatorId;
    case 'subtype':
      return `${entry.target.parentSimulatorId}-${entry.target.subtypeLabel
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()}`;
    case 'roadmap-only':
      return entry.target.roadmapId;
  }
}

function coverageSimulatorDefinition(entry: SimulatorCoverageEntry): SimulatorDefinition | null {
  switch (entry.target.kind) {
    case 'registry':
      return getOptionalSimulatorDefinition(entry.target.simulatorId);
    case 'subtype':
      return getOptionalSimulatorDefinition(entry.target.parentSimulatorId);
    case 'roadmap-only':
      return null;
  }
}

function coverageTargetLabel(
  entry: SimulatorCoverageEntry,
  definition: SimulatorDefinition | null,
): string {
  switch (entry.target.kind) {
    case 'registry':
      return definition?.fullLabel ?? entry.target.simulatorId;
    case 'subtype':
      return `${definition?.fullLabel ?? entry.target.parentSimulatorId} — ${entry.target.subtypeLabel}`;
    case 'roadmap-only':
      return entry.target.roadmapLabel;
  }
}

function uniqueOwnerPaths(definition: SimulatorDefinition | null): SettingsOwnerPagePath[] {
  if (!definition) return [];

  const ownerPaths: SettingsOwnerPagePath[] = [];
  for (const settingsKey of definition.settingsKeys) {
    const ownerPath = getSettingsRegistryEntry(settingsKey).ownerSettingsPage;
    if (!ownerPaths.includes(ownerPath)) ownerPaths.push(ownerPath);
  }
  return ownerPaths;
}

function canRenderCoverageOwnerLinks(
  entry: SimulatorCoverageEntry,
  definition: SimulatorDefinition | null,
): boolean {
  if (!canRenderMementoOwnerLink(entry.expectedStatus)) return false;
  if (!definition) return false;
  return !LIFECYCLES_WITHOUT_OWNER_LINK.has(definition.lifecycle);
}

function MementoCoverageRow({ entry }: { entry: SimulatorCoverageEntry }): ReactElement {
  const definition = coverageSimulatorDefinition(entry);
  const ownerPaths = canRenderCoverageOwnerLinks(entry, definition)
    ? uniqueOwnerPaths(definition)
    : [];
  const targetLabel = coverageTargetLabel(entry, definition);
  const lifecycle = definition?.lifecycle ?? null;

  return (
    <article
      className="settings-memento-row settings-memento-row--coverage"
      data-testid={`memento-coverage-${coverageTargetId(entry)}`}
    >
      <div className="settings-memento-row__main">
        <div className="settings-memento-row__heading">
          <h4 className="settings-memento-row__title">{entry.sectionLabel}</h4>
          <span
            className={`settings-memento-status settings-memento-status--${entry.expectedStatus}`}
          >
            {MEMENTO_STATUS_LABELS[entry.expectedStatus]}
          </span>
          {lifecycle && (
            <span className={`settings-memento-lifecycle settings-memento-lifecycle--${lifecycle}`}>
              {SIMULATOR_LIFECYCLE_LABELS[lifecycle]}
            </span>
          )}
          {!lifecycle && (
            <span className="settings-memento-lifecycle settings-memento-lifecycle--roadmap">
              Roadmap
            </span>
          )}
        </div>
        <p className="settings-memento-row__description">{targetLabel}</p>
        {entry.note && <p className="settings-memento-row__reason">{entry.note}</p>}
      </div>

      <div className="settings-memento-row__owner">
        {ownerPaths.length > 0 ? (
          ownerPaths.map((ownerPath) => (
            <a key={ownerPath} className="settings-memento-owner-link" href={ownerPath}>
              {ownerPath}
            </a>
          ))
        ) : (
          <span className="settings-memento-owner-placeholder">Aucune action settings</span>
        )}
      </div>
    </article>
  );
}

export default function MementoChapterSection({
  chapter,
  entries,
  coverage,
  defaultOpen = false,
}: MementoChapterSectionProps): ReactElement {
  const rowCount = entries.length + coverage.length;

  return (
    <SettingsSectionCard
      title={`${chapter.label} (${rowCount})`}
      subtitle={chapter.description}
      icon={<ChapterIcon />}
      collapsible
      defaultOpen={defaultOpen}
    >
      <div className="settings-memento-section">
        {entries.length > 0 && (
          <div className="settings-memento-section__group">
            <p className="settings-memento-section__label">Entrées métier</p>
            <div className="settings-memento-section__rows">
              {entries.map((entry) => (
                <MementoEntryRow key={entry.key} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {coverage.length > 0 && (
          <div className="settings-memento-section__group">
            <p className="settings-memento-section__label">Couverture simulateurs</p>
            <div className="settings-memento-section__rows">
              {coverage.map((entry) => (
                <MementoCoverageRow key={coverageTargetId(entry)} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </div>
    </SettingsSectionCard>
  );
}
