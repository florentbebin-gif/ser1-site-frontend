import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { PrivateRoute, useAuth, useUserRole } from './auth';
import Login from './pages/Login';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import SetPassword from './pages/SetPassword';
import Placement from './pages/PlacementV2';
import { triggerPageReset, triggerGlobalReset } from './utils/reset';
import { saveGlobalState, loadGlobalStateWithDialog } from './utils/globalStorage';
import {
  triggerPlacementSaveEvent,
  triggerPlacementLoadEvent,
} from './utils/placementEvents';
import Credit from './pages/Credit';
import Settings from './pages/Settings';
import SettingsImpots from './pages/Sous-Settings/SettingsImpots';
import SettingsPrelevements from './pages/Sous-Settings/SettingsPrelevements';
import SettingsFiscalites from './pages/Sous-Settings/SettingsFiscalites';
import SettingsBaseContrats from './pages/Sous-Settings/SettingsBaseContrats';
import SettingsTableMortalite from './pages/Sous-Settings/SettingsTableMortalite';
import SettingsComptes from './pages/Sous-Settings/SettingsComptes';
import Ir from './pages/Ir';
import { AuditWizard } from './features/audit';
import StrategyPage from './pages/StrategyPage';
import IssueReportButton from './components/IssueReportButton';

// -----------------------
// Icônes SVG "maison"
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

export default function App() {
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    // Nettoyer les anciennes clés localStorage (migration vers sessionStorage)
    const oldKeys = [
      'ser1:sim:placement',
      'ser1:sim:credit',
      'ser1:sim:ir',
      'ser1:sim:strategy',
      'ser1:loadedFilename',
      'ser1:lastSavedFilename',
    ];
    oldKeys.forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });

    return undefined;
  }, []);

  const handleLogout = async () => {
    // Effacer toutes les données des simulateurs avant déconnexion
    triggerGlobalReset();
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Notification temporaire
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Sauvegarde globale
  const handleGlobalSave = useCallback(async () => {
    const result = await saveGlobalState();
    
    if (result.cancelled) return;
    
    if (result.success) {
      showNotification(result.message, 'success');
    } else if (result.message) {
      showNotification(result.message, 'error');
    }
  }, [showNotification]);

  // Chargement global
  const handleGlobalLoad = useCallback(async () => {
    const result = await loadGlobalStateWithDialog();
    
    if (result.cancelled) return;
    
    if (result.success) {
      showNotification(result.message, 'success');
      navigate('/');
    } else if (result.message) {
      showNotification(result.message, 'error');
    }
  }, [navigate, showNotification]);

  // Reset global avec confirmation
  const handleGlobalReset = useCallback(() => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir réinitialiser tous les simulateurs ?\n\nCette action effacera toutes les données saisies (Audit, Placement, Crédit, IR, Stratégie).\n\nLes paramètres de l\'application ne seront pas affectés.'
    );
    if (confirmed) {
      triggerGlobalReset();
      showNotification('Tous les simulateurs ont été réinitialisés.', 'success');
      setTimeout(() => window.location.reload(), 1000);
    }
  }, [showNotification]);

const isRecoveryMode = window.location.hash.includes('type=recovery');
const path = window.location.pathname;
const isSimRoute = path.startsWith('/sim') || path === '/audit' || path === '/strategy';
const isSettingsRoute = path.startsWith('/settings');
const isAuditRoute = path === '/audit';
const isStrategyRoute = path === '/strategy';
const isPlacementRoute = path === '/sim/placement';
const isCreditRoute = path === '/sim/credit';
const isIrRoute = path === '/sim/ir';

// Mapping route → libellé contexte (breadcrumb passive)
const getContextLabel = (pathname) => {
  if (pathname === '/') return 'Accueil';
  if (pathname === '/audit') return 'Audit';
  if (pathname === '/potentiel') return 'Potentiel';
  if (pathname === '/transfert') return 'Transfert';
  if (pathname === '/sim/ir') return 'Impôt';
  if (pathname === '/sim/placement') return 'Placement';
  if (pathname === '/sim/credit') return 'Crédit';
  if (pathname.startsWith('/settings')) return 'Paramètres';
  if (pathname === '/strategy') return 'Stratégie';
  return null;
};
const contextLabel = getContextLabel(path);

  return (
    <>
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
                  onClick={() => navigate('/')}
                  title="Retour à l'accueil"
                >
                  <IconHome className="icon" />
                </button>
              )}

              {/* SAVE */}
              {(isSimRoute || path === '/') && (
                <button
                  className={path === '/' ? 'chip icon-btn with-label' : 'chip icon-btn'}
                  onClick={handleGlobalSave}
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
                  onClick={handleGlobalLoad}
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
                  onClick={handleGlobalReset}
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
                  onClick={() => triggerPageReset('placement')}
                  title="Réinitialiser la simulation"
                >
                  <IconTrash className="icon" />
                </button>
              )}
              {/* RESET Crédit */}
              {isCreditRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => triggerPageReset('credit')}
                  title="Réinitialiser la simulation"
                >
                  <IconTrash className="icon" />
                </button>
                )}
              {isIrRoute && (
                <button
                className="chip icon-btn"
                onClick={() => triggerPageReset('ir')}
                title="Réinitialiser la simulation IR"
                >
                  <IconTrash className="icon" />
                </button>
                )}
              {isAuditRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => triggerPageReset('audit')}
                  title="Réinitialiser l'audit"
                >
                  <IconTrash className="icon" />
                </button>
              )}
              {isStrategyRoute && (
                <button
                  className="chip icon-btn"
                  onClick={() => triggerPageReset('strategy')}
                  title="Réinitialiser la stratégie"
                >
                  <IconTrash className="icon" />
                </button>
              )}

              {/* PARAMÈTRES — juste avant Déconnexion */}
              <button
                className="chip icon-btn"
                onClick={() => navigate('/settings')}
                title="Paramètres"
              >
                <IconSettings className="icon" />
              </button>

              {/* DÉCONNEXION */}
              <button
                className="chip icon-btn"
                onClick={handleLogout}
                title="Se déconnecter"
              >
                <IconLogout className="icon" />
              </button>
            </>
          )}
        </div>
      </div>

      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login onLogin={() => navigate('/')} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/reset-password" element={<SetPassword />} />

        {/* Routes protégées */}
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        
        {/* Audit patrimonial */}
        <Route path="/audit" element={<PrivateRoute><AuditWizard /></PrivateRoute>} />
        <Route path="/strategy" element={<PrivateRoute><StrategyPage /></PrivateRoute>} />

        {/* Simulateurs */}
        <Route path="/sim/placement" element={<PrivateRoute><Placement /></PrivateRoute>} />
        <Route path="/sim/credit" element={<PrivateRoute><Credit /></PrivateRoute>} />
        <Route path="/sim/ir" element={<PrivateRoute><Ir /></PrivateRoute>} />

        {/* Paramètres (protégés) */}
        <Route path="/settings" element={<PrivateRoute><Settings isAdmin={isAdmin} /></PrivateRoute>} />
        <Route path="/settings/impots" element={<PrivateRoute><SettingsImpots isAdmin={isAdmin} /></PrivateRoute>} />
        <Route path="/settings/prelevements-sociaux" element={<PrivateRoute><SettingsPrelevements isAdmin={isAdmin} /></PrivateRoute>}/>
        <Route path="/settings/fiscalites-contrats" element={<PrivateRoute><SettingsFiscalites isAdmin={isAdmin} /></PrivateRoute>}/>
        <Route path="/settings/base-contrat" element={<PrivateRoute><SettingsBaseContrats isAdmin={isAdmin} /></PrivateRoute>}/>
        <Route path="/settings/table-mortalite" element={<PrivateRoute><SettingsTableMortalite isAdmin={isAdmin} /></PrivateRoute>}/>
        <Route path="/settings/comptes" element={<PrivateRoute><SettingsComptes /></PrivateRoute>} />

        {/* Redirections de compatibilité */}
        <Route path="/placement" element={<Navigate to="/sim/placement" replace />}/>
        <Route path="/credit" element={<Navigate to="/sim/credit" replace />} />
      </Routes>

      {/* Bouton "Signaler un problème" sur les pages de simulation */}
      {session && (isSimRoute || isAuditRoute || isStrategyRoute) && !isRecoveryMode && (
        <IssueReportButton />
      )}
    </>
  );
}
