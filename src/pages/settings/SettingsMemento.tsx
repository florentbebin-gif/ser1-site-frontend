import { Suspense, lazy, useEffect, useState, type ReactElement } from 'react';

import { useUserRole } from '@/auth/useUserRole';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';

import MementoReadView from './memento/MementoReadView';
import MementoViewTabs, { type MementoViewId } from './memento/MementoViewTabs';

const MementoCalculatorSettingsView = lazy(() => import('./memento/MementoCalculatorSettingsView'));
const MementoAuditView = lazy(() => import('./memento/MementoAuditView'));

export default function SettingsMemento(): ReactElement {
  const { isAdmin } = useUserRole();
  const [activeView, setActiveView] = useState<MementoViewId>('lire');

  useEffect(() => {
    if (!isAdmin && activeView === 'audit') {
      setActiveView('lire');
    }
  }, [activeView, isAdmin]);

  return (
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
              Lecture patrimoniale, paramètres calculateurs et audit des sources restent séparés
              pour garder le conseil lisible.
            </p>
          </div>
        </div>
      </section>

      <MementoViewTabs activeView={activeView} showAudit={isAdmin} onChange={setActiveView} />

      <section
        id={`settings-memento-panel-${activeView}`}
        role="tabpanel"
        aria-labelledby={`settings-memento-tab-${activeView}`}
        className="settings-memento-active-view"
      >
        {activeView === 'lire' ? <MementoReadView /> : null}
        {activeView === 'parametres' ? (
          <Suspense
            fallback={<p className="settings-memento-empty">Chargement des paramètres...</p>}
          >
            <MementoCalculatorSettingsView />
          </Suspense>
        ) : null}
        {activeView === 'audit' && isAdmin ? (
          <Suspense fallback={<p className="settings-memento-empty">Chargement de l’audit...</p>}>
            <MementoAuditView />
          </Suspense>
        ) : null}
      </section>
    </div>
  );
}
