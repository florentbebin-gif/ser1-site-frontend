import type { ReactElement } from 'react';

import { IconChevronRight, IconInfo } from '@/icons/ui';

export type AuditPriorityTone = 'warning' | 'danger';

export interface AuditPriorityItem {
  id: string;
  label: string;
  statusLabel: string;
  tone: AuditPriorityTone;
  actionLabel?: string;
  onAction?: () => void;
}

interface PointsAConfirmerCardProps {
  title: string;
  items: AuditPriorityItem[];
  emptyLabel?: string;
  countLabel?: (count: number) => string;
  limit?: number;
}

export function PointsAConfirmerCard({
  title,
  items,
  emptyLabel = 'Aucun point prioritaire.',
  countLabel = (count) => `${count} point(s) prioritaire(s)`,
  limit = 3,
}: PointsAConfirmerCardProps): ReactElement {
  const visibleItems = items.slice(0, limit);

  return (
    <section
      className="audit-card audit-points"
      aria-labelledby="audit-card-points"
      data-state={items.length === 0 ? 'empty' : 'active'}
    >
      <header className="audit-points__head">
        <span className="audit-card__icon audit-card__icon--warning" aria-hidden="true">
          <IconInfo className="audit-card__icon-svg" />
        </span>
        <div className="audit-points__title-group">
          <h2 className="audit-card__title" id="audit-card-points">
            {title}
          </h2>
        </div>
        <span className="audit-points__count" aria-label={countLabel(items.length)}>
          {items.length}
        </span>
      </header>
      <div className="audit-card__divider sim-divider sim-divider--soft" aria-hidden="true" />

      {items.length === 0 ? (
        <p className="audit-points__empty">{emptyLabel}</p>
      ) : (
        <ul className="audit-points__list">
          {visibleItems.map((item) => (
            <li className="audit-points__item" data-tone={item.tone} key={item.id}>
              <span className="audit-points__marker" aria-hidden="true" />
              <div className="audit-points__body">
                <p className="audit-points__label">{item.label}</p>
                <p className="audit-points__status">{item.statusLabel}</p>
              </div>
              {item.onAction ? (
                <button type="button" className="audit-points__action" onClick={item.onAction}>
                  <span>{item.actionLabel ?? 'Compléter'}</span>
                  <IconChevronRight className="audit-points__action-icon" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
