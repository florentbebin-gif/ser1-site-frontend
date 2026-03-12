import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '../auth/useUserRole';
import {
  SETTINGS_ROUTES,
  getActiveSettingsKey,
  getVisibleSettingsRoutes,
} from '../constants/settingsRoutes';

interface SettingsRouteEntry {
  key: string;
  label: string;
  path: string;
  component: React.ComponentType;
  adminOnly?: boolean;
}

export default function SettingsShell(): React.ReactElement {
  const { isAdmin } = useUserRole();

  const initialTab = useMemo(() => {
    const path = (typeof window !== 'undefined' && window.location?.pathname) || '';
    return getActiveSettingsKey(path);
  }, []);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/settings/fiscalites')) {
      window.history.replaceState({}, '', '/settings/base-contrat');
    }
  }, []);

  useEffect(() => {
    const handlePopState = (): void => {
      const path = window.location.pathname;
      const newTab = getActiveSettingsKey(path);
      setActiveTab(newTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const visibleTabs = useMemo(
    () => getVisibleSettingsRoutes(isAdmin) as SettingsRouteEntry[],
    [isAdmin],
  );

  const activeComponent = useMemo(() => {
    const routes = SETTINGS_ROUTES as SettingsRouteEntry[];
    const found = routes.find((tab) => tab.key === activeTab);
    return found ? found.component : routes[0].component;
  }, [activeTab]);

  const checkScroll = (): void => {
    const element = scrollRef.current;
    if (!element) return;

    const hasScrollLeft = element.scrollLeft > 0;
    const hasScrollRight = element.scrollLeft < element.scrollWidth - element.clientWidth - 1;
    setCanScrollLeft(hasScrollLeft);
    setCanScrollRight(hasScrollRight);
  };

  const scroll = (direction: 'left' | 'right'): void => {
    const element = scrollRef.current;
    if (!element) return;

    const scrollAmount = 200;
    element.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    checkScroll();
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      element.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [visibleTabs]);

  const ActiveComponent = activeComponent;

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Parametres</div>

        <nav className="settings-tab-nav" aria-label="Parametres">
          <button
            type="button"
            className="settings-tab-scroll-btn settings-tab-scroll-btn--left"
            aria-label="Faire defiler les onglets a gauche"
            disabled={!canScrollLeft}
            onClick={() => scroll('left')}
          />
          <div className="settings-tab-scroll" ref={scrollRef}>
            <div className="settings-tab-list">
              {visibleTabs.map((tab) => {
                const isActive = tab.key === activeTab;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    ref={(element) => {
                      tabRefs.current[tab.key] = element;
                    }}
                    className={`settings-tab${isActive ? ' is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      setActiveTab(tab.key);
                      if (typeof window !== 'undefined') {
                        window.history.replaceState({}, '', `/settings${tab.path ? `/${tab.path}` : ''}`);
                      }
                      window.setTimeout(() => {
                        tabRefs.current[tab.key]?.scrollIntoView({
                          behavior: 'smooth',
                          inline: 'nearest',
                          block: 'nearest',
                        });
                      }, 50);
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="settings-tab-scroll-btn settings-tab-scroll-btn--right"
            aria-label="Faire defiler les onglets a droite"
            disabled={!canScrollRight}
            onClick={() => scroll('right')}
          />
        </nav>

        <div style={{ marginTop: 16 }}>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
