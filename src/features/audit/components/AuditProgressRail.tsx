import type { ReactElement } from 'react';

import { IconCheck, IconClock, IconInfo, IconLock } from '@/icons/ui';

import type { AuditProgressSection, AuditSectionStatus } from '../auditLandingViewModel';

interface AuditProgressRailProps {
  sections: AuditProgressSection[];
}

export function AuditProgressRail({ sections }: AuditProgressRailProps): ReactElement {
  const currentSectionId =
    sections.find((section) => section.availability === 'available' && section.status !== 'complet')
      ?.id ?? sections.find((section) => section.availability === 'available')?.id;

  return (
    <section
      className="audit-progress-rail sim-tile-flat"
      aria-labelledby="audit-progress-rail-title"
    >
      <h2 id="audit-progress-rail-title" className="audit-progress-rail__title">
        Avancement du dossier
      </h2>
      <ol className="audit-progress-rail__list">
        {sections.map((section) => (
          <li
            key={section.id}
            className="audit-progress-rail__item"
            data-availability={section.availability}
            data-status={section.status ?? 'gated'}
            aria-current={section.id === currentSectionId ? 'step' : undefined}
            aria-label={`${section.label} — ${section.statusLabel}`}
          >
            <span className="audit-progress-rail__glyph" aria-hidden="true">
              <ProgressGlyph status={section.status} gated={section.availability === 'gated'} />
            </span>
            <span className="audit-progress-rail__label">{section.label}</span>
            <span className="audit-progress-rail__status">{section.statusLabel}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProgressGlyph({
  status,
  gated,
}: {
  status: AuditSectionStatus | null;
  gated: boolean;
}): ReactElement {
  if (gated) return <IconLock className="audit-progress-rail__glyph-svg" />;
  if (status === 'complet') return <IconCheck className="audit-progress-rail__glyph-svg" />;
  if (status === 'partiel') return <IconClock className="audit-progress-rail__glyph-svg" />;
  return <IconInfo className="audit-progress-rail__glyph-svg" />;
}
