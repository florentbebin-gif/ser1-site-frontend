import type { ReactElement } from 'react';

import type {
  MementoBusinessPriority,
  MementoEntry,
  MementoStatus,
} from '@/domain/settings-memento';
import { getOptionalSimulatorDefinition } from '@/domain/simulators/registry';

export const MEMENTO_STATUS_LABELS: Record<MementoStatus, string> = {
  couvert: 'Couvert',
  partiel: 'Partiel',
  planned: 'Planifié',
  absent: 'Absent',
  a_verifier: 'À vérifier',
  blocked_missing_official_source: 'Source officielle manquante',
};

export const MEMENTO_PRIORITY_LABELS: Record<MementoBusinessPriority, string> = {
  critique: 'Priorité critique',
  structurant: 'Priorité structurante',
  utile: 'Priorité utile',
  complementaire: 'Priorité complémentaire',
};

const STATUS_WITHOUT_OWNER_LINK = new Set<MementoStatus>([
  'planned',
  'absent',
  'blocked_missing_official_source',
]);

const MEMENTO_OWNER_PAGE_LABELS: Record<NonNullable<MementoEntry['ownerPagePath']>, string> = {
  '/settings/memento': 'Mémento',
  '/settings/base-contrat-retraite': 'Base CG retraite',
};

export function canRenderMementoOwnerLink(status: MementoStatus): boolean {
  return !STATUS_WITHOUT_OWNER_LINK.has(status);
}

interface MementoEntryRowProps {
  entry: MementoEntry;
}

function ownerPageLabel(path: MementoEntry['ownerPagePath']): string {
  if (path === null) return 'Page propriétaire à qualifier';

  return MEMENTO_OWNER_PAGE_LABELS[path];
}

function officialReferencesLabel(entry: MementoEntry): string {
  const referenceCount = entry.refIds.length + entry.claimKeys.length;
  if (referenceCount === 0) return 'Références officielles à qualifier';

  return `${referenceCount} référence${referenceCount > 1 ? 's' : ''} officielle${
    referenceCount > 1 ? 's' : ''
  }`;
}

function simulatorLabels(entry: MementoEntry): string {
  if (entry.relatedSimulatorIds.length === 0) return 'Aucun simulateur lié';

  return entry.relatedSimulatorIds
    .map((simulatorId) => getOptionalSimulatorDefinition(simulatorId)?.shortLabel ?? simulatorId)
    .join(', ');
}

export default function MementoEntryRow({ entry }: MementoEntryRowProps): ReactElement {
  const ownerLinkPath =
    entry.ownerPagePath !== null && canRenderMementoOwnerLink(entry.status)
      ? entry.ownerPagePath
      : null;

  return (
    <article className="settings-memento-row settings-memento-row--entry">
      <div className="settings-memento-row__main">
        <div className="settings-memento-row__heading">
          <h4 className="settings-memento-row__title">{entry.label}</h4>
          <span
            className={`settings-memento-priority settings-memento-priority--${entry.priority}`}
          >
            {MEMENTO_PRIORITY_LABELS[entry.priority]}
          </span>
          <span className={`settings-memento-status settings-memento-status--${entry.status}`}>
            {MEMENTO_STATUS_LABELS[entry.status]}
          </span>
        </div>
        <p className="settings-memento-row__description">{entry.description}</p>
        <p className="settings-memento-row__reason">{entry.statusReason}</p>
        <div className="settings-memento-row__facts" aria-label="Repères métier">
          <span>{ownerPageLabel(entry.ownerPagePath)}</span>
          <span>{officialReferencesLabel(entry)}</span>
          <span>{simulatorLabels(entry)}</span>
        </div>
      </div>

      <div className="settings-memento-row__owner">
        {ownerLinkPath !== null ? (
          <a className="settings-memento-owner-link" href={ownerLinkPath}>
            Ouvrir la page propriétaire
          </a>
        ) : (
          <span className="settings-memento-owner-placeholder">
            {ownerPageLabel(entry.ownerPagePath)}
          </span>
        )}
      </div>
    </article>
  );
}
