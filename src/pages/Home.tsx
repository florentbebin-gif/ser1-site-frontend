import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { ModeToggleView } from '../components/ModeToggle';
import { HomeGuide } from '../features/home/HomeGuide';
import { HOME_PRIMARY_ACTIONS } from '../features/home/homeGuideModel';
import { useUserMode } from '../settings/userMode';
import { IconChevronRight, IconFileText, IconPlus } from '../icons/ui';
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
      <main className="home-main" data-testid="home-main">
        <section className="home-hero" data-testid="home-hero-section">
          <p className="home-hero__eyebrow">AUDIT & STRATÉGIE</p>
          <h1 className="home-hero__title" data-testid="home-hero-title">
            Nouvelle stratégie patrimoniale
          </h1>
          <p className="home-hero__subtitle">
            Audit manuel ou dossier documentaire, puis simulateurs structurés par parcours.
          </p>

          <div className="home-actions" aria-label="Entrées principales">
            {HOME_PRIMARY_ACTIONS.map((action) =>
              action.to ? (
                <Link
                  key={action.id}
                  to={action.to}
                  className="home-action"
                  data-testid="home-primary-action-strategy"
                >
                  <span className="home-action__icon" aria-hidden="true">
                    <IconPlus className="home-action__svg" />
                  </span>
                  <span className="home-action__copy">
                    <span className="home-action__title">{action.title}</span>
                    <span className="home-action__subtitle">{action.subtitle}</span>
                  </span>
                  <IconChevronRight className="home-action__chevron" />
                </Link>
              ) : (
                <button
                  key={action.id}
                  type="button"
                  className="home-action home-action--disabled"
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
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        <section className="home-context" aria-label="Contexte de travail">
          <div className="home-context-card" data-testid="home-status-card">
            <span className="home-context-card__label">Dossier chargé</span>
            <span className="home-context-card__value" data-testid="home-loaded-filename">
              {loadedFilename || '-'}
            </span>
            <span className="home-context-card__hint" data-testid="home-status-disclaimer">
              Les données seront effacées à la fermeture du navigateur ou de l’onglet.
            </span>
          </div>

          <div className="home-context-card" data-testid="home-mode-card">
            <ModeToggleView
              isExpert={isExpert}
              isLoading={isLoading}
              onToggle={handleModeToggle}
              testId="home-mode-toggle"
            />
          </div>
        </section>

        <HomeGuide mode={mode} />
      </main>
    </div>
  );
}
