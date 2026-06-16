import { Suspense, lazy, useState, type ReactElement } from 'react';

import { useUserRole } from '@/auth/useUserRole';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { MementoGlobalSaveBar, MementoSaveProvider } from '@/hooks/settings/mementoSaveRegistry';

import MementoAdminSection from './memento/MementoAdminSection';
import MementoReadView from './memento/MementoReadView';

const MementoAuditView = lazy(() => import('./memento/MementoAuditView'));

export default function SettingsMemento(): ReactElement {
  const { isAdmin } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <MementoSaveProvider>
      <div className="settings-page settings-memento-page" data-testid="settings-memento">
        <section className="settings-premium-card settings-memento-hero">
          <div className="settings-premium-header settings-premium-header--row">
            <div className="settings-action-text settings-memento-hero__body">
              <h2 className="settings-premium-title">
                <SettingsTitleWithIcon icon="book">
                  Mémento patrimonial & social
                </SettingsTitleWithIcon>
              </h2>
              <p className="settings-premium-subtitle">
                Une lecture patrimoniale structurée pour préparer le conseil sans exposer les
                contrôles techniques.
              </p>
            </div>
          </div>

          <label className="settings-memento-hero__search" htmlFor="settings-memento-search-global">
            <span className="settings-memento-hero__search-label">Rechercher dans le mémento</span>
            <input
              id="settings-memento-search-global"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Chapitre, produit, notion, plafond..."
            />
          </label>
        </section>

        <MementoReadView showStatus={isAdmin} isAdmin={isAdmin} searchQuery={searchQuery} />
        <MementoGlobalSaveBar isAdmin={isAdmin} />

        {isAdmin ? (
          <div className="settings-memento-admin-zone" aria-label="Administration du mémento">
            <MementoAdminSection
              title="Audit & sources"
              subtitle="Contrôles techniques, registre settings et couverture simulateurs."
            >
              <Suspense
                fallback={<p className="settings-memento-empty">Chargement de l’audit...</p>}
              >
                <MementoAuditView />
              </Suspense>
            </MementoAdminSection>
          </div>
        ) : null}
      </div>
    </MementoSaveProvider>
  );
}
