import type { ReactElement } from 'react';

import { IconCheck, IconClock, IconInfo, IconLock } from '@/icons/ui';

import type { AuditProgressSection, AuditSectionStatus } from '../auditLandingViewModel';

interface AuditProgressRailProps {
  sections: AuditProgressSection[];
  currentSectionId?: string;
  onSelectSection?: (sectionId: string) => void;
}

export function AuditProgressRail({
  sections,
  currentSectionId: selectedSectionId,
  onSelectSection,
}: AuditProgressRailProps): ReactElement {
  const currentSectionId =
    selectedSectionId ??
    sections.find((section) => section.isNavigable && section.status !== 'complet')?.id ??
    sections.find((section) => section.isNavigable)?.id ??
    sections.find((section) => section.availability === 'available' && section.status !== 'complet')
      ?.id ??
    sections.find((section) => section.availability === 'available')?.id;

  return (
    <section
      className="audit-progress-rail sim-tile-flat"
      aria-labelledby="audit-progress-rail-title"
    >
      <h2 id="audit-progress-rail-title" className="audit-progress-rail__title">
        Avancement du dossier
      </h2>
      <ol className="audit-progress-rail__list">
        {sections.map((section) => {
          const content = (
            <>
              <span className="audit-progress-rail__glyph" aria-hidden="true">
                <ProgressGlyph status={section.status} gated={section.availability === 'gated'} />
              </span>
              <span className="audit-progress-rail__label">{section.label}</span>
              <span className="audit-progress-rail__status">{section.statusLabel}</span>
            </>
          );
          const isCurrent = section.id === currentSectionId;
          const canNavigate = section.isNavigable && onSelectSection;

          return (
            <li
              key={section.id}
              className="audit-progress-rail__item"
              data-availability={section.availability}
              data-status={section.status ?? 'gated'}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {canNavigate ? (
                <button
                  type="button"
                  className="audit-progress-rail__button"
                  aria-label={`${section.label} — ${section.statusLabel}`}
                  onClick={() => onSelectSection(section.id)}
                >
                  {content}
                </button>
              ) : (
                <span
                  className="audit-progress-rail__content"
                  aria-label={`${section.label} — ${section.statusLabel}`}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
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
