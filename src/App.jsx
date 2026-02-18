import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase, DEBUG_AUTH } from './supabaseClient';
import { PrivateRoute } from './auth';
import { useTheme } from './settings/ThemeProvider';
import { APP_ROUTES } from './routes/appRoutes';
import { triggerPageReset, triggerGlobalReset } from './utils/reset';
import { saveGlobalState, loadGlobalStateWithDialog } from './utils/globalStorage';
import { useSessionTTL } from './hooks/useSessionTTL';
import { useExportGuard } from './hooks/useExportGuard';
import { setTrackBlobUrlHandler } from './utils/createTrackedObjectURL';
import { AppLayout } from './components/layout/AppLayout';

// Fallback UI for lazy-loaded routes
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    color: 'var(--color-c9)',
    fontSize: '14px'
  }}>
    Chargement...
  </div>
);

// Wrapper component that waits for theme to be ready before rendering lazy routes
// This prevents FOUC (Flash of Unstyled Content) on route navigation
const LazyRoute = ({ children }) => {
  const { themeReady } = useTheme();
  
  // Block render until CSS variables are applied
  if (!themeReady) {
    return <PageLoader />;
  }
  
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
};

// React context to expose session/export guard to child components
export const SessionGuardContext = React.createContext({
  sessionExpired: false,
  canExport: true,
  trackBlobUrl: (_url) => {},
  resetInactivity: () => {},
});

export default function App() {
  const [session, setSession] = useState(null);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  // P0-06: Session TTL (heartbeat 30s, grâce 3min, inactivité 1h)
  const { sessionExpired, minutesRemaining, warningVisible, resetInactivity } = useSessionTTL();
  // P0-09: Export guard (disable exports when session expired)
  const { canExport, trackBlobUrl } = useExportGuard(sessionExpired);

  // Inject tracker early for all non-React export utilities.
  // Exports are triggered only after user actions, so this effect runs early enough.
  useEffect(() => {
    setTrackBlobUrlHandler(trackBlobUrl);
    return () => setTrackBlobUrlHandler(null);
  }, [trackBlobUrl]);

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

    // Initialisation robuste de la session
    async function initSession() {
      if (DEBUG_AUTH) {
        // eslint-disable-next-line no-console
        console.debug('[App] initSession:start');
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (DEBUG_AUTH) {
        // eslint-disable-next-line no-console
        console.debug('[App] initSession:done', { hasSession: !!session, userId: session?.user?.id });
      }
      setSession(session);
    }
    initSession();

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (DEBUG_AUTH) {
        // eslint-disable-next-line no-console
        console.debug('[App] onAuthStateChange', { event: _event, hasSession: !!s, userId: s?.user?.id });
      }
      setSession(s);
    });

    return () => subscription.unsubscribe();
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
  if (pathname === '/sim/ir') return 'Impôt';
  if (pathname === '/sim/placement') return 'Placement';
  if (pathname === '/sim/credit') return 'Crédit';
  if (pathname === '/sim/succession') return 'Succession';
  if (pathname === '/sim/per') return 'PER';
  if (pathname === '/sim/epargne-salariale') return 'Epargne salariale';
  if (pathname === '/sim/tresorerie-societe') return 'Trésorerie société';
  if (pathname.startsWith('/settings')) return 'Paramètres';
  if (pathname === '/strategy') return 'Stratégie';
  return null;
};
const contextLabel = getContextLabel(path);

  const sessionGuardValue = React.useMemo(() => ({
    sessionExpired, canExport, trackBlobUrl, resetInactivity,
  }), [sessionExpired, canExport, trackBlobUrl, resetInactivity]);

  const renderRouteEntry = (entry) => {
    if (entry.kind === 'redirect') {
      return (
        <Route
          key={entry.path}
          path={entry.path}
          element={<Navigate to={entry.to} replace={entry.replace !== false} />}
        />
      );
    }

    const Component = entry.component;

    // Exception minimale : Login a besoin de navigate() dans son callback onLogin.
    // On garde la config déclarative dans APP_ROUTES (onLoginNavigateTo) et on injecte ici.
    const mergedProps = {
      ...(entry.props || {}),
      ...(entry.onLoginNavigateTo
        ? { onLogin: () => navigate(entry.onLoginNavigateTo) }
        : null),
    };

    const element = <Component {...mergedProps} />;
    const maybeLazy = entry.lazy ? <LazyRoute>{element}</LazyRoute> : element;
    const maybePrivate = entry.access === 'private'
      ? <PrivateRoute>{maybeLazy}</PrivateRoute>
      : maybeLazy;

    return (
      <Route
        key={entry.path}
        path={entry.path}
        element={maybePrivate}
      />
    );
  };

  return (
    <SessionGuardContext.Provider value={sessionGuardValue}>
      <AppLayout
        warningVisible={warningVisible}
        sessionExpired={sessionExpired}
        minutesRemaining={minutesRemaining}
        notification={notification}
        session={session}
        isRecoveryMode={isRecoveryMode}
        path={path}
        contextLabel={contextLabel}
        isSimRoute={isSimRoute}
        isSettingsRoute={isSettingsRoute}
        isAuditRoute={isAuditRoute}
        isStrategyRoute={isStrategyRoute}
        isPlacementRoute={isPlacementRoute}
        isCreditRoute={isCreditRoute}
        isIrRoute={isIrRoute}
        onNavigate={navigate}
        onLogout={handleLogout}
        onGlobalSave={handleGlobalSave}
        onGlobalLoad={handleGlobalLoad}
        onGlobalReset={handleGlobalReset}
        onPageReset={triggerPageReset}
      >
        <Routes>
          {APP_ROUTES.map(renderRouteEntry)}
        </Routes>
      </AppLayout>

    </SessionGuardContext.Provider>
  );
}
