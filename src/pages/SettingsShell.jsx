import React, { useMemo, useState } from 'react';
import { useUserRole } from '../auth/useUserRole';
import Settings from './Settings';
import SettingsImpots from './Sous-Settings/SettingsImpots';
import SettingsPrelevements from './Sous-Settings/SettingsPrelevements';
import SettingsFiscalites from './Sous-Settings/SettingsFiscalites';
import SettingsBaseContrats from './Sous-Settings/SettingsBaseContrats';
import SettingsTableMortalite from './Sous-Settings/SettingsTableMortalite';
import SettingsComptes from './Sous-Settings/SettingsComptes';

const TABS = [
  { key: 'general', label: 'Généraux', component: Settings },
  { key: 'impots', label: 'Impôts', component: SettingsImpots },
  { key: 'prelevements', label: 'Prélèvements sociaux', component: SettingsPrelevements },
  { key: 'fiscalites', label: 'Fiscalités contrats', component: SettingsFiscalites },
  { key: 'baseContrats', label: 'Base contrats', component: SettingsBaseContrats },
  { key: 'tableMortalite', label: 'Table de mortalité', component: SettingsTableMortalite },
  { key: 'comptes', label: 'Comptes', component: SettingsComptes, adminOnly: true },
];

export default function SettingsShell() {
  const { isAdmin } = useUserRole();

  // Initialiser à partir de l'URL
  const initialTab = useMemo(() => {
    const path = (typeof window !== 'undefined' && window.location?.pathname) || '';
    if (path.includes('/settings/impots')) return 'impots';
    if (path.includes('/settings/prelevements')) return 'prelevements';
    if (path.includes('/settings/fiscalites')) return 'fiscalites';
    if (path.includes('/settings/base-contrat')) return 'baseContrats';
    if (path.includes('/settings/table-mortalite')) return 'tableMortalite';
    if (path.includes('/settings/comptes')) return 'comptes';
    return 'general';
  }, []);

  const [activeTab, setActiveTab] = useState(initialTab);

  // Filtrer les onglets selon admin
  const visibleTabs = useMemo(() => {
    return TABS.filter((t) => !t.adminOnly || isAdmin);
  }, [isAdmin]);

  const ActiveComponent = useMemo(() => {
    const found = TABS.find((t) => t.key === activeTab);
    return found ? found.component : Settings;
  }, [activeTab]);

  return (
    <div className="settings-page">
      <div className="section-card">
        <div className="section-title">Paramètres</div>

        <div className="settings-nav">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`settings-pill${activeTab === tab.key ? ' is-active' : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                if (typeof window !== 'undefined') {
                  window.history.replaceState({}, '', `/settings${tab.key === 'general' ? '' : `/${tab.key}`}`);
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
