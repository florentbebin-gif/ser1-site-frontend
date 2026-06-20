import React from 'react';
import { Link } from 'react-router';

import { DossierContextCards } from '../components/ui/dossier/DossierContextCards';
import {
  HomeAuditGauge,
  HomeFoyerAvatars,
  HomeGuide,
  HOME_PRIMARY_ACTIONS,
  ReferenceAuditBanner,
  useHomeDossierSummary,
} from '../features/home';
import { useReferenceAuditNotification } from '../hooks/useReferenceAuditNotification';
import { useUserMode } from '../settings/userMode';
import {
  IconArrowRight,
  IconClipboardCheck,
  IconGauge,
  IconInfo,
  IconScanLine,
  IconUpload,
} from '../icons/ui';
import './Home.css';

export default function Home(): React.ReactElement {
  const { mode } = useUserMode();
  const referenceAuditNotification = useReferenceAuditNotification();
  const dossier = useHomeDossierSummary();
  const primaryAction = dossier.state.primaryAction;
  const scanAction = dossier.state.scanAction;
  const dossierProgress = dossier.state.progress;
  const scanColumnClassName = [
    'home-scan-column',
    dossierProgress ? 'home-scan-column--with-gauge' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="home-layout" data-testid="home-layout">
      <aside className="home-side-rail" aria-label="Contexte de travail">
        <DossierContextCards />
      </aside>

      <main className="home-main" data-testid="home-main">
        <section className="home-start" data-testid="home-start-section">
          <header className="home-hero">
            <div className="home-hero__eyebrow-row">
              <span className="home-hero__icon" aria-hidden="true">
                <IconGauge className="home-hero__icon-svg" />
              </span>
              <p className="home-hero__eyebrow">Bonjour,</p>
            </div>
            <h1 className="home-hero__title">Où allons-nous aujourd&rsquo;hui&nbsp;?</h1>
            <p className="home-hero__subtitle">
              Pilotez l&rsquo;analyse patrimoniale, structurez vos enjeux et avancez avec méthode
              vers des recommandations éclairées.
            </p>
          </header>

          <div className="home-actions" aria-label="Entrées principales">
            {HOME_PRIMARY_ACTIONS.map((action) =>
              action.id === 'strategy' ? (
                <Link
                  key={action.id}
                  to={action.to ?? '/audit'}
                  className="home-action home-action--primary"
                  data-testid="home-primary-action-strategy"
                >
                  {dossier.hasDossier && (
                    <span className="home-action__foyer">
                      <HomeFoyerAvatars principal={dossier.principal} conjoint={dossier.conjoint} />
                    </span>
                  )}
                  <span className="home-action__head">
                    <span className="home-action__icon" aria-hidden="true">
                      <IconClipboardCheck className="home-action__svg" />
                    </span>
                    <span className="home-action__title">{primaryAction.title}</span>
                  </span>
                  <span className="home-action__subtitle">{action.subtitle}</span>
                  <span className="home-action__cta">
                    {primaryAction.cta}
                    <IconArrowRight className="home-action__cta-icon" />
                  </span>
                </Link>
              ) : (
                <div key={action.id} className={scanColumnClassName}>
                  {dossierProgress && (
                    <HomeAuditGauge
                      percent={dossierProgress.percent}
                      label={dossierProgress.label}
                      ariaLabel={dossierProgress.ariaLabel}
                    />
                  )}
                  <button
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
                      <span className="home-action__title">{scanAction.title}</span>
                    </span>
                    <span className="home-action__subtitle">{scanAction.subtitle}</span>
                    <span className="home-action__cta">
                      {scanAction.cta}
                      <IconUpload className="home-action__cta-icon" />
                    </span>
                  </button>
                </div>
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

        <footer className="home-help">
          <IconInfo className="home-help__icon" aria-hidden="true" />
          <p className="home-help__text">
            Besoin d&rsquo;aide&nbsp;? Consultez nos{' '}
            <Link to="/settings/memento" className="home-help__link">
              guides
            </Link>{' '}
            ou contactez votre{' '}
            <Link to="/settings?focus=assistance" className="home-help__link">
              support
            </Link>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
