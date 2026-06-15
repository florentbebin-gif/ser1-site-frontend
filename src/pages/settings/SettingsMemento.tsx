import { Suspense, lazy, type ReactElement } from 'react';

import { useUserRole } from '@/auth/useUserRole';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { MementoGlobalSaveBar, MementoSaveProvider } from '@/hooks/settings/mementoSaveRegistry';

import MementoAdminSection from './memento/MementoAdminSection';
import MementoReadView from './memento/MementoReadView';

const MementoAuditView = lazy(() => import('./memento/MementoAuditView'));

export default function SettingsMemento(): ReactElement {
  const { isAdmin } = useUserRole();

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
        </section>

        <MementoReadView showStatus={isAdmin} isAdmin={isAdmin} />
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
