import React from 'react';

import { SessionExpiredBanner } from '../ui/SessionExpiredBanner';
import {
  IconHome,
  IconSave,
  IconFolder,
  IconTrash,
  IconLogout,
  IconSettings,
} from '../../icons/ui';

export function AppLayout({
  layoutState,
  routeFlags,
  actions,
  children,
}) {
  const {
    warningVisible,
    sessionExpired,
    minutesRemaining,
    notification,
    session,
    isRecoveryMode,
    path,
    contextLabel,
  } = layoutState;

  const {
    isSimRoute,
    isSettingsRoute,
    isAuditRoute,
    isStrategyRoute,
    isPlacementRoute,
    isCreditRoute,
    isIrRoute,
  } = routeFlags;

  const {
    onNavigate,
    onLogout,
    onGlobalSave,
    onGlobalLoad,
    onGlobalReset,
    onPageReset,
  } = actions;
  return (
    <>
      {/* P0-06: Session TTL banners */}
      <SessionExpiredBanner
        visible={warningVisible && !sessionExpired}
        minutesRemaining={minutesRemaining}
        isWarning
      />
      <SessionExpiredBanner visible={sessionExpired} />

      {/* Notification toast */}
      {notification && (
        <div className={`ser1-notification ser1-notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="topbar">
        <div className="brandbar">
          <span className="brand-name">SER1</span>
          {contextLabel && <span className="breadcrumb-separator"> | </span>}
          {contextLabel && <span className="breadcrumb-context">{contextLabel}</span>}
        </div>

        <div className="top-actions">
          {session && !isRecoveryMode && (
            <>
              {/* HOME */}
              {(isSimRoute || isSettingsRoute) && (
                <button
                  className="chip icon-btn"
                  onClick={() => onNavigate('/')} 
                  title="Retour à l'accueil"
                >
                  <IconHome className="icon" />
                </button>
              )}

              {/* SAVE */}
              {(isSimRoute || path === '/') && (
                <button
                  className={path === '/' ? 'chip icon-btn with-label' : 'chip icon-btn'}
                  onClick={onGlobalSave}
                  title="Sauvegarder le dossier"
                >
                  <IconSave className="icon icon--save" />
                  {path === '/' && <span className="btn-label">Sauvegarder</span>}
                </button>
              )}

              {/* CHARGER */}
              {(isSimRoute || path === '/') && (
                <button
                  className={path === '/' ? 'chip icon-btn with-label' : 'chip icon-btn'}
                  onClick={onGlobalLoad}
                  title="Charger un dossier"
                >
                  <IconFolder className="icon" />
                  {path === '/' && <span className="btn-label">Charger</span>}
                </button>
              )}

              {/* RESET GLOBAL — uniquement sur la page d'accueil */}
              {path === '/' && (
                <button
                  className="chip icon-btn with-label"
                  onClick={onGlobalReset}
                  title="Réinitialiser tous les simulateurs"
                >
                  <IconTrash className="icon" />
                  <span className="btn-label">Réinitialiser</span>
                </button>
              )}

              {/* RESET Placement */}
              {isPlacementRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => onPageReset('placement')}
                  title="Réinitialiser la simulation"
                >
                  <IconTrash className="icon" />
                </button>
              )}
              {/* RESET Crédit */}
              {isCreditRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => onPageReset('credit')}
                  title="Réinitialiser la simulation"
                >
                  <IconTrash className="icon" />
                </button>
              )}
              {/* RESET IR */}
              {isIrRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => onPageReset('ir')}
                  title="Réinitialiser la simulation IR"
                >
                  <IconTrash className="icon" />
                </button>
              )}
              {/* RESET Audit */}
              {isAuditRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => onPageReset('audit')}
                  title="Réinitialiser l'audit"
                >
                  <IconTrash className="icon" />
                </button>
              )}
              {/* RESET Strategie */}
              {isStrategyRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => onPageReset('strategy')}
                  title="Réinitialiser la stratégie"
                >
                  <IconTrash className="icon" />
                </button>
              )}

              {/* PARAMÈTRES — juste avant Déconnexion */}
              <button
                className="chip icon-btn"
                onClick={() => onNavigate('/settings')}
                title="Paramètres"
              >
                <IconSettings className="icon" />
              </button>

              {/* DÉCONNEXION */}
              <button
                className="chip icon-btn"
                onClick={onLogout}
                title="Se déconnecter"
              >
                <IconLogout className="icon" />
              </button>
            </>
          )}
        </div>
      </div>

      {children}
    </>
  );
}

export default AppLayout;
