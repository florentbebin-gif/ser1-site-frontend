import type { ReactElement } from 'react';

import type { MementoEntry, MementoStatus } from '@/domain/settings-memento';

export const MEMENTO_STATUS_LABELS: Record<MementoStatus, string> = {
  couvert: 'Couvert',
  partiel: 'Partiel',
  planned: 'Planifié',
  absent: 'Absent',
  a_verifier: 'À vérifier',
  blocked_missing_official_source: 'Source officielle manquante',
};

const STATUS_WITHOUT_OWNER_LINK = new Set<MementoStatus>([
  'planned',
  'absent',
  'blocked_missing_official_source',
]);

export function canRenderMementoOwnerLink(status: MementoStatus): boolean {
  return !STATUS_WITHOUT_OWNER_LINK.has(status);
}

interface MementoEntryRowProps {
  entry: MementoEntry;
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
          <span className={`settings-memento-status settings-memento-status--${entry.status}`}>
            {MEMENTO_STATUS_LABELS[entry.status]}
          </span>
        </div>
        <p className="settings-memento-row__description">{entry.description}</p>
        <p className="settings-memento-row__reason">{entry.statusReason}</p>
      </div>

      <div className="settings-memento-row__owner">
        {ownerLinkPath !== null ? (
          <a className="settings-memento-owner-link" href={ownerLinkPath}>
            Ouvrir la page propriétaire
          </a>
        ) : (
          <span className="settings-memento-owner-placeholder">
            {entry.ownerPagePath ?? 'Aucune page propriétaire'}
          </span>
        )}
      </div>
    </article>
  );
}
