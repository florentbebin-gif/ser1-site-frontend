import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { ModeToggleView } from '../components/ModeToggle';
import { HomeGuide } from '../features/home/HomeGuide';
import { HOME_PRIMARY_ACTIONS } from '../features/home/homeGuideModel';
import { useUserMode } from '../settings/userMode';
import { IconChevronRight, IconDownload, IconFileText, IconPlus } from '../icons/ui';
import './Home.css';

export default function Home(): React.ReactElement {
  const [loadedFilename, setLoadedFilename] = useState<string | null>(null);
  const { mode, setMode, isLoading } = useUserMode();
  const isExpert = mode === 'expert';

  useEffect(() => {
    try {
      let fileName = sessionStorage.getItem('ser1:loadedFilename');
      if (fileName) {
        fileName = fileName.replace(/\.(ser1|json)$/i, '');
      }
      setLoadedFilename(fileName || null);
    } catch {
      setLoadedFilename(null);
    }
  }, []);

  const handleModeToggle = (): void => {
    void setMode(isExpert ? 'simplifie' : 'expert');
  };

  return (
    <div className="home-layout" data-testid="home-layout">
      <aside className="home-side-rail" aria-label="Contexte de travail">
        <section className="home-side-card" data-testid="home-status-card">
          <span className="home-side-card__label">Dossier chargé</span>
          <span className="home-side-card__value" data-testid="home-loaded-filename">
            {loadedFilename || '-'}
          </span>
          <span className="home-side-card__divider" />
          <span className="home-side-card__hint" data-testid="home-status-disclaimer">
            Les données seront effacées à la fermeture du navigateur ou de l’onglet.
          </span>
        </section>

        <section className="home-side-card home-side-card--mode" data-testid="home-mode-card">
          <span className="home-side-card__label">Mode utilisateur</span>
          <ModeToggleView
            isExpert={isExpert}
            isLoading={isLoading}
            onToggle={handleModeToggle}
            testId="home-mode-toggle"
          />
        </section>
      </aside>

      <main className="home-main" data-testid="home-main">
        <section className="home-start" data-testid="home-start-section">
          <p className="home-start__eyebrow" data-testid="home-start-eyebrow">
            PAR OÙ COMMENCER
          </p>
          <div className="home-actions" aria-label="Entrées principales">
            {HOME_PRIMARY_ACTIONS.map((action) =>
              action.to ? (
                <Link
                  key={action.id}
                  to={action.to}
                  className="home-action home-action--primary"
                  data-testid="home-primary-action-strategy"
                >
                  <span className="home-action__icon" aria-hidden="true">
                    <IconPlus className="home-action__svg" />
                  </span>
                  <span className="home-action__copy">
                    <span className="home-action__title">{action.title}</span>
                    <span className="home-action__subtitle">{action.subtitle}</span>
                    <span className="home-action__cta">
                      {action.cta}
                      <IconChevronRight className="home-action__cta-icon" />
                    </span>
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
                  <span className="home-action__icon" aria-hidden="true">
                    <IconFileText className="home-action__svg" />
                  </span>
                  <span className="home-action__copy">
                    <span className="home-action__title">{action.title}</span>
                    <span className="home-action__subtitle">{action.subtitle}</span>
                    <span className="home-action__cta">
                      {action.cta}
                      <IconDownload className="home-action__cta-icon" />
                    </span>
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        <div className="home-divider" aria-hidden="true" />

        <HomeGuide mode={mode} />
      </main>
    </div>
  );
}
