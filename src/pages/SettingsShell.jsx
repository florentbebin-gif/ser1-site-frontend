import React, { useMemo, useState } from 'react';
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

  // Routes visibles selon permissions
  const visibleTabs = useMemo(() => {
    return getVisibleSettingsRoutes(isAdmin);
  }, [isAdmin]);

  // Composant actif à render
  const ActiveComponent = useMemo(() => {
    const found = SETTINGS_ROUTES.find((t) => t.key === activeTab);
    return found ? found.component : SETTINGS_ROUTES[0].component;
  }, [activeTab]);

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>

        <div className="settings-nav">
          {visibleTabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                className={`settings-pill${isActive ? ' is-active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState({}, '', `/settings${tab.path ? `/${tab.path}` : ''}`);
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 16 }}>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
