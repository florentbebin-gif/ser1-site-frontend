/**
 * AuthProvider - Version simplifiée
 * 
 * Principe : faire confiance à Supabase pour gérer les sessions.
 * - autoRefreshToken: true dans supabaseClient.js gère le refresh automatique
 * - onAuthStateChange écoute les changements d'état
 * - Pas de listeners focus/visibility qui causent des déconnexions
 * - Pas de refresh manuel agressif
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, DEBUG_AUTH } from '../supabaseClient';

export type AuthRole = 'admin' | 'user' | null;

export interface AuthState {
  authReady: boolean;
  session: Session | null;
  user: User | null;
  role: AuthRole;
  isAdmin: boolean;
  authRevision: number;
  // Gardé pour compatibilité mais ne change plus automatiquement
  appAwakeRevision: number;
  ensureSession: (_reason?: string) => Promise<Session | null>;
}

const AuthContext = createContext<AuthState | null>(null);

function computeRole(user: User | null): AuthRole {
  if (!user) return null;
  const role = (user.user_metadata?.role || user.app_metadata?.role || 'user') as string;
  return role === 'admin' ? 'admin' : 'user';
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authRevision, setAuthRevision] = useState(0);
  // Gardé pour compatibilité mais fixé à 0 - ne déclenche plus de rechargements
  const [appAwakeRevision] = useState(0);

  // Mise à jour de l'état depuis une session
  const updateFromSession = useCallback((newSession: Session | null, source: string) => {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.debug('[Auth] updateFromSession', {
        source,
        hasSession: !!newSession,
        userId: newSession?.user?.id,
      });
    }

    setSession(newSession);
    setUser(newSession?.user ?? null);
    setAuthRevision((r) => r + 1);
    setAuthReady(true);
  }, []);

  // ensureSession simplifié - juste récupérer la session actuelle
  const ensureSession = useCallback(async (_reason: string = 'unknown'): Promise<Session | null> => {
    if (DEBUG_AUTH) {
      // eslint-disable-next-line no-console
      console.debug('[Auth] ensureSession', { _reason });
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (DEBUG_AUTH) {
        // eslint-disable-next-line no-console
        console.debug('[Auth] ensureSession:result', {
          _reason,
          hasSession: !!currentSession,
          expiresAt: currentSession?.expires_at,
        });
      }

      return currentSession;
    } catch (e) {
      if (DEBUG_AUTH) {
        console.warn('[Auth] ensureSession:error', { _reason, message: (e as Error)?.message });
      }
      return null;
    }
  }, []);

  // Initialisation et écoute des changements d'état
  useEffect(() => {
    let mounted = true;

    // Récupérer la session initiale
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          updateFromSession(initialSession, 'init');
        }
      } catch (e) {
        if (DEBUG_AUTH) {
          console.warn('[Auth] init:error', { message: (e as Error)?.message });
        }
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    initSession();

    // Écouter les changements d'authentification
    // Supabase appelle ce callback automatiquement lors de :
    // - Connexion/déconnexion
    // - Refresh du token (automatique grâce à autoRefreshToken: true)
    // - Changement de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      if (DEBUG_AUTH) {
        // eslint-disable-next-line no-console
        console.debug('[Auth] onAuthStateChange', {
          event,
          hasSession: !!newSession,
          userId: newSession?.user?.id,
        });
      }

      updateFromSession(newSession, `onAuthStateChange:${event}`);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateFromSession]);

  const role = useMemo(() => computeRole(user), [user]);
  const isAdmin = role === 'admin';

  const value = useMemo<AuthState>(() => ({
    authReady,
    session,
    user,
    role,
    isAdmin,
    authRevision,
    appAwakeRevision,
    ensureSession,
  }), [authReady, session, user, role, isAdmin, authRevision, appAwakeRevision, ensureSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
