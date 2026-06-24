import type { ReactElement, ReactNode } from 'react';

import type { AuditLandingViewModel } from '../auditLandingViewModel';
import { AuditProgressRail } from './AuditProgressRail';
import { DossierTravailCard } from './DossierTravailCard';

interface AuditCockpitShellProps {
  viewModel: AuditLandingViewModel;
  currentSectionId: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  onSelectSection: (sectionId: string) => void;
}

export function AuditCockpitShell({
  viewModel,
  currentSectionId,
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  onSelectSection,
}: AuditCockpitShellProps): ReactElement {
  return (
    <div className="audit-landing audit-cockpit premium-page" data-state="filled">
      <div className="audit-landing__layout">
        <aside className="audit-landing__rail" aria-label="Contexte de travail">
          <DossierTravailCard dossierClientLabel={viewModel.dossierClientLabel} />
          <AuditProgressRail
            sections={viewModel.progress}
            currentSectionId={currentSectionId}
            onSelectSection={onSelectSection}
          />
        </aside>

        <main className="audit-landing__main">
          <header className="audit-cockpit__header">
            <div className="audit-cockpit__heading">
              {eyebrow ? <p className="audit-cockpit__eyebrow">{eyebrow}</p> : null}
              <h1 className="audit-cockpit__title">{title}</h1>
              {subtitle ? <p className="audit-cockpit__subtitle">{subtitle}</p> : null}
            </div>
            {actions ? <div className="audit-cockpit__actions">{actions}</div> : null}
          </header>
          <div className="audit-landing__title-divider" aria-hidden="true" />
          {children}
        </main>
      </div>
    </div>
  );
}
