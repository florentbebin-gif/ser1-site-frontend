import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '../auth/useUserRole';
import {
  SETTINGS_ROUTES,
  getActiveSettingsKey,
  getVisibleSettingsRoutes,
} from '../constants/settingsRoutes';

export default function SettingsShell() {
  const { isAdmin } = useUserRole();

  // Initialiser à partir de l'URL
  const initialTab = useMemo(() => {
    const path = (typeof window !== 'undefined' && window.location?.pathname) || '';
    return getActiveSettingsKey(path);
  }, []);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);
  const tabRefs = useRef({});

  // Redirect legacy /settings/fiscalites → /settings/base-contrat
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/settings/fiscalites')) {
      window.history.replaceState({}, '', '/settings/base-contrat');
    }
  }, []);

  // Synchroniser l'onglet actif avec l'URL lors du Back/Forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const newTab = getActiveSettingsKey(path);
      setActiveTab(newTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Routes visibles selon permissions
  const visibleTabs = useMemo(() => {
    return getVisibleSettingsRoutes(isAdmin);
  }, [isAdmin]);

  // Composant actif à render
  const ActiveComponent = useMemo(() => {
    const found = SETTINGS_ROUTES.find((t) => t.key === activeTab);
    return found ? found.component : SETTINGS_ROUTES[0].component;
  }, [activeTab]);

  // Détecter si le scroll est possible dans chaque direction
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const hasScrollLeft = el.scrollLeft > 0;
    const hasScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    setCanScrollLeft(hasScrollLeft);
    setCanScrollRight(hasScrollRight);
  };

  // Scroll programmatique
  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  // Initialiser et écouter le scroll
  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [visibleTabs]);

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>

        <nav className="settings-tab-nav" aria-label="Paramètres">
          <button
            type="button"
            className="settings-tab-scroll-btn settings-tab-scroll-btn--left"
            aria-label="Faire défiler les onglets à gauche"
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
                    ref={(el) => { tabRefs.current[tab.key] = el; }}
                    className={`settings-tab${isActive ? ' is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      setActiveTab(tab.key);
                      if (typeof window !== 'undefined') {
                        window.history.replaceState({}, '', `/settings${tab.path ? `/${tab.path}` : ''}`);
                      }
                      // Ramener l'onglet en vue s'il est partiellement caché
                      setTimeout(() => {
                        tabRefs.current[tab.key]?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
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
            aria-label="Faire défiler les onglets à droite"
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
