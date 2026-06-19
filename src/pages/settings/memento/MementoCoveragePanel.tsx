import type { ReactElement } from 'react';

import type { SimulatorCoverageEntry } from '@/domain/settings-memento/simulatorCoverage';
import { getSettingsRegistryEntry, type SettingsOwnerPagePath } from '@/domain/settings-registry';
import { getOptionalSimulatorDefinition } from '@/domain/simulators/registry';
import type { SimulatorDefinition, SimulatorLifecycle } from '@/domain/simulators/types';

import { canRenderMementoOwnerLink } from './MementoEntryRow';
import { MEMENTO_STATUS_LABELS } from './mementoStatusLabels';

interface MementoCoveragePanelProps {
  coverage: readonly SimulatorCoverageEntry[];
}

const SIMULATOR_LIFECYCLE_LABELS: Record<SimulatorLifecycle, string> = {
  active: 'E - Simulateur : actif',
  hub: 'E - Simulateur : hub',
  placeholder: 'E - Simulateur : placeholder',
  planned: 'E - Simulateur : planifié',
  expertOnly: 'E - Simulateur : expert',
  internalOnly: 'E - Simulateur : interne',
};

const LIFECYCLES_WITHOUT_OWNER_LINK = new Set<SimulatorLifecycle>([
  'planned',
  'internalOnly',
  'placeholder',
]);

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
              E - Simulateur : roadmap
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

export default function MementoCoveragePanel({
  coverage,
}: MementoCoveragePanelProps): ReactElement {
  return (
    <div className="settings-memento-section__rows">
      {coverage.map((entry) => (
        <MementoCoverageRow key={coverageTargetId(entry)} entry={entry} />
      ))}
    </div>
  );
}
