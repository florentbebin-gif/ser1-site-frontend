import React from 'react';

import { SessionExpiredBanner } from '../ui/SessionExpiredBanner';

// -----------------------
// Icônes SVG "maison"
// (T2) Déplacées depuis App.jsx avec le layout.
// (T3) Elles seront extraites vers src/icons/ui/ (ou src/icons/app/).
// -----------------------
const IconHome = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 11.5 12 4l8 7.5v7.5a1 1 0 0 1-1 1h-4.5a1 1 0 0 1-1-1v-4h-3v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSave = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 4h10l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 4v4h6V4M9 20v-5h6v5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconFolder = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4.2l1.6 2h8.7a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrash = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLogout = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M15 12H4M11 8l-4 4 4 4M15 4h4v16h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSettings = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a7.6 7.6 0 0 0 .1-6l-2.2-.4a5.8 5.8 0 0 0-1.1-1.9l.4-2.1a7.6 7.6 0 0 0-6 0l.4 2.1a5.8 5.8 0 0 0-1.1 1.9l-2.2.4a7.6 7.6 0 0 0 .1 6l2.2.4a5.8 5.8 0 0 0 1.1 1.9l-.4 2.1a7.6 7.6 0 0 0 6 0l-.4-2.1a5.8 5.8 0 0 0 1.1-1.9z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function AppLayout({
  warningVisible,
  sessionExpired,
  minutesRemaining,
  notification,
  session,
  isRecoveryMode,
  path,
  contextLabel,
  isSimRoute,
  isSettingsRoute,
  isAuditRoute,
  isStrategyRoute,
  isPlacementRoute,
  isCreditRoute,
  isIrRoute,
  onNavigate,
  onLogout,
  onGlobalSave,
  onGlobalLoad,
  onGlobalReset,
  onPageReset,
  children,
}) {
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
