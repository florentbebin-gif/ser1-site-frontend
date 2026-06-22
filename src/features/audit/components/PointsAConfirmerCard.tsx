import type { ReactElement } from 'react';

import { IconChevronRight, IconInfo } from '@/icons/ui';

import type { AuditLandingDestination, AuditPointAConfirmer } from '../auditLandingViewModel';

interface PointsAConfirmerCardProps {
  points: AuditPointAConfirmer[];
  onOpenAudit: (destination: AuditLandingDestination) => void;
}

export function PointsAConfirmerCard({
  points,
  onOpenAudit,
}: PointsAConfirmerCardProps): ReactElement {
  const visiblePoints = points.slice(0, 3);

  return (
    <section
      className="audit-card audit-points"
      aria-labelledby="audit-card-points"
      data-state={points.length === 0 ? 'empty' : 'active'}
    >
      <header className="audit-points__head">
        <span className="audit-card__icon audit-card__icon--warning" aria-hidden="true">
          <IconInfo className="audit-card__icon-svg" />
        </span>
        <div className="audit-points__title-group">
          <h2 className="audit-card__title" id="audit-card-points">
            Points à confirmer
          </h2>
        </div>
        <span className="audit-points__count" aria-label={`${points.length} point(s) à confirmer`}>
          {points.length}
        </span>
      </header>
      <div className="audit-card__divider sim-divider sim-divider--soft" aria-hidden="true" />

      {points.length === 0 ? (
        <p className="audit-points__empty">Aucun point prioritaire.</p>
      ) : (
        <ul className="audit-points__list">
          {visiblePoints.map((point) => {
            const action = point.action;

            return (
              <li className="audit-points__item" data-tone={point.tone} key={point.id}>
                <span className="audit-points__marker" aria-hidden="true" />
                <div className="audit-points__body">
                  <p className="audit-points__label">{point.label}</p>
                </div>
                {action && (
                  <button
                    type="button"
                    className="audit-points__action"
                    onClick={() => onOpenAudit(action.destination)}
                  >
                    <span>Compléter</span>
                    <IconChevronRight className="audit-points__action-icon" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
