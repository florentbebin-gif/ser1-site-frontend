import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { supabase, DEBUG_AUTH } from './supabaseClient';
import { PrivateRoute } from './auth';
import { useTheme } from './settings/ThemeProvider';
import { APP_ROUTES, getRouteMetadata } from './routes/appRoutes';
import { triggerPageReset, triggerGlobalReset } from './utils/reset';
import { saveGlobalState, loadGlobalStateWithDialog } from './utils/globalStorage';
import { useFiscalContext } from './hooks/useFiscalContext';
import { fingerprintSettingsData } from './utils/exportFingerprint';
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

  // Dossier fiscal (mode stale) — pour construire l'identité fiscale lors des sauvegardes
  const { fiscalContext, meta: fiscalMeta } = useFiscalContext();

  // Identité fiscale : hashes stables + updated_at pour les 3 tables
  const fiscalIdentity = React.useMemo(() => ({
    tax: {
      updatedAt: fiscalMeta.taxUpdatedAt,
      hash: fingerprintSettingsData(fiscalContext._raw_tax),
    },
    ps: {
      updatedAt: fiscalMeta.psUpdatedAt,
      hash: fingerprintSettingsData(fiscalContext._raw_ps),
    },
    fiscality: {
      updatedAt: fiscalMeta.fiscalityUpdatedAt,
      hash: fingerprintSettingsData(fiscalContext._raw_fiscality),
    },
  }), [fiscalContext, fiscalMeta]);

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

  // Sauvegarde globale (injecte l'identité fiscale courante dans le .ser1)
  const handleGlobalSave = useCallback(async () => {
    const result = await saveGlobalState({ fiscalIdentity });

    if (result.cancelled) return;

    if (result.success) {
      showNotification(result.message, 'success');
    } else if (result.message) {
      showNotification(result.message, 'error');
    }
  }, [showNotification, fiscalIdentity]);

  // Chargement global (compare l'identité fiscale sauvegardée à celle en cours)
  const handleGlobalLoad = useCallback(async () => {
    const result = await loadGlobalStateWithDialog();

    if (result.cancelled) return;

    if (result.success) {
      showNotification(result.message, 'success');
      navigate('/');

      // Avertissement si les paramètres fiscaux ont changé depuis la sauvegarde
      const loaded = result.loadedFiscalIdentity;
      if (loaded && loaded.tax && loaded.ps && loaded.fiscality) {
        const mismatch =
          (loaded.tax.hash != null && loaded.tax.hash !== fiscalIdentity.tax.hash) ||
          (loaded.ps.hash != null && loaded.ps.hash !== fiscalIdentity.ps.hash) ||
          (loaded.fiscality.hash != null && loaded.fiscality.hash !== fiscalIdentity.fiscality.hash);
        if (mismatch) {
          setTimeout(() => {
            showNotification(
              'Attention : les paramètres fiscaux ont été mis à jour depuis la sauvegarde. Les résultats peuvent changer.',
              'info',
            );
          }, 4500);
        }
      }
    } else if (result.message) {
      showNotification(result.message, 'error');
    }
  }, [navigate, showNotification, fiscalIdentity]);

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
const routeMeta = getRouteMetadata(path);

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
        layoutState={{
          warningVisible,
          sessionExpired,
          minutesRemaining,
          notification,
          session,
          isRecoveryMode,
          path,
        }}
        routeMeta={routeMeta}
        actions={{
          onNavigate: navigate,
          onLogout: handleLogout,
          onGlobalSave: handleGlobalSave,
          onGlobalLoad: handleGlobalLoad,
          onGlobalReset: handleGlobalReset,
          onPageReset: triggerPageReset,
        }}
      >
        <Routes>
          {APP_ROUTES.map(renderRouteEntry)}
        </Routes>
      </AppLayout>

    </SessionGuardContext.Provider>
  );
}
