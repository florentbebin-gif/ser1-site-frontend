import React from 'react';
import { Link } from 'react-router';

import { DossierContextCards } from '../components/ui/dossier/DossierContextCards';
import { HomeGuide, HOME_PRIMARY_ACTIONS, ReferenceAuditBanner } from '../features/home';
import { useReferenceAuditNotification } from '../hooks/useReferenceAuditNotification';
import { useUserMode } from '../settings/userMode';
import { IconArrowRight, IconClipboardCheck, IconScanLine, IconUpload } from '../icons/ui';
import './Home.css';

export default function Home(): React.ReactElement {
  const { mode } = useUserMode();
  const referenceAuditNotification = useReferenceAuditNotification();

  return (
    <div className="home-layout" data-testid="home-layout">
      <aside className="home-side-rail" aria-label="Contexte de travail">
        <DossierContextCards />
      </aside>

      <main className="home-main" data-testid="home-main">
        <section className="home-start" data-testid="home-start-section">
          <div className="home-actions" aria-label="Entrées principales">
            {HOME_PRIMARY_ACTIONS.map((action) =>
              action.to ? (
                <Link
                  key={action.id}
                  to={action.to}
                  className="home-action home-action--primary"
                  data-testid="home-primary-action-strategy"
                >
                  <span className="home-action__head">
                    <span className="home-action__icon" aria-hidden="true">
                      <IconClipboardCheck className="home-action__svg" />
                    </span>
                    <span className="home-action__title">{action.title}</span>
                  </span>
                  <span className="home-action__subtitle">{action.subtitle}</span>
                  <span className="home-action__cta">
                    {action.cta}
                    <IconArrowRight className="home-action__cta-icon" />
                  </span>
                </Link>
              ) : (
                <button
                  key={action.id}
                  type="button"
                  className="home-action home-action--secondary"
                  aria-disabled="true"
                  title={action.disabledReason}
                  data-testid="home-primary-action-scan"
                >
                  <span className="home-action__head">
                    <span className="home-action__icon" aria-hidden="true">
                      <IconScanLine className="home-action__svg" />
                    </span>
                    <span className="home-action__title">{action.title}</span>
                  </span>
                  <span className="home-action__subtitle">{action.subtitle}</span>
                  <span className="home-action__cta">
                    {action.cta}
                    <IconUpload className="home-action__cta-icon" />
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        {referenceAuditNotification.isVisible && referenceAuditNotification.report && (
          <ReferenceAuditBanner
            report={referenceAuditNotification.report}
            isSubmitting={referenceAuditNotification.isSubmitting}
            error={referenceAuditNotification.error}
            onDismiss={referenceAuditNotification.acknowledge}
          />
        )}

        <div className="home-divider" aria-hidden="true" />

        <HomeGuide mode={mode} />
      </main>
    </div>
  );
}
