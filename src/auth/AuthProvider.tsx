import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  appAwakeRevision: number;
  ensureSession: (reason?: string) => Promise<Session | null>;
}

const AuthContext = createContext<AuthState | null>(null);

function computeRole(user: User | null): AuthRole {
  if (!user) return null;
  const role = (user.user_metadata?.role || user.app_metadata?.role || 'user') as string;
  return role === 'admin' ? 'admin' : 'user';
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authRevision, setAuthRevision] = useState(0);
  const [appAwakeRevision, setAppAwakeRevision] = useState(0);

  const ensureRequestIdRef = useRef(0);
  const lastEnsureAtRef = useRef(0);
  const lastBumpAwakeAtRef = useRef(0);
  // Mutex pour éviter deux refreshSession concurrents
  const refreshingRef = useRef(false);
  const ensureInFlightRef = useRef<Promise<Session | null> | null>(null);
  const lastSessionFingerprintRef = useRef<string>('');

  const setFromSession = useCallback((nextSession: Session | null, source: string) => {
    const fingerprint = `${nextSession?.access_token ?? ''}-${nextSession?.expires_at ?? ''}-${nextSession?.user?.id ?? ''}`;
    if (fingerprint === lastSessionFingerprintRef.current) {
      if (DEBUG_AUTH) {
        console.log('[Auth] setFromSession:skip (same fingerprint)', { source });
      }
      return;
    }

    lastSessionFingerprintRef.current = fingerprint;
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setAuthRevision((r) => r + 1);

    if (DEBUG_AUTH) {
      console.log('[Auth] setFromSession', {
        source,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id,
        expiresAt: nextSession?.expires_at,
      });
    }
  }, []);

  const bumpAwake = useCallback((reason: string) => {
    const now = performance.now();
    const dtSinceLastBump = now - lastBumpAwakeAtRef.current;
    if (dtSinceLastBump < 200) {
      if (DEBUG_AUTH) {
        console.log('[Auth] bumpAwake:skip (throttle)', { reason, dtMs: Math.round(dtSinceLastBump) });
      }
      return;
    }
    lastBumpAwakeAtRef.current = now;
    setAppAwakeRevision((r) => {
      const next = r + 1;
      if (DEBUG_AUTH) {
        console.log('[Auth] bumpAwake', { reason, appAwakeRevision: next });
      }
      return next;
    });
  }, []);

  const ensureSession = useCallback((reason: string = 'unknown') => {
    if (ensureInFlightRef.current) {
      if (DEBUG_AUTH) {
        console.log('[Auth] ensureSession:coalesce', { reason });
      }
      return ensureInFlightRef.current;
    }

    const ensurePromise = (async () => {
      const startedAt = performance.now();
      const dtSinceLastEnsure = startedAt - lastEnsureAtRef.current;

      let currentSession: Session | null = null;
      let shouldRefresh = false;

      if (dtSinceLastEnsure < 1500) {
        const { data: { session: throttledSession } } = await supabase.auth.getSession();
        currentSession = throttledSession ?? null;
        const expiresInMs = currentSession?.expires_at ? (currentSession.expires_at * 1000 - Date.now()) : null;
        shouldRefresh = !currentSession || (expiresInMs !== null && expiresInMs < 60_000);

        if (!shouldRefresh) {
          if (DEBUG_AUTH) {
            console.log('[Auth] ensureSession:skip (throttle)', {
              reason,
              dtMs: Math.round(dtSinceLastEnsure),
              hasSession: !!currentSession,
            });
          }

          setFromSession(currentSession, `ensureSession:throttle:${reason}`);
          setAuthReady(true);
          return currentSession;
        }
      }

      lastEnsureAtRef.current = startedAt;
      const requestId = ++ensureRequestIdRef.current;

      try {
        if (!currentSession) {
          const { data: { session: fetched } } = await supabase.auth.getSession();
          currentSession = fetched ?? null;
        }

        const expiresInMs = currentSession?.expires_at ? (currentSession.expires_at * 1000 - Date.now()) : null;
        shouldRefresh = !currentSession || (expiresInMs !== null && expiresInMs < 60_000);

        if (DEBUG_AUTH) {
          console.log('[Auth] ensureSession:getSession', {
            reason,
            requestId,
            hasSession: !!currentSession,
            expiresInMs,
            shouldRefresh,
            dtMs: Math.round(performance.now() - startedAt),
          });
        }

        let finalSession = currentSession;

        if (shouldRefresh && !refreshingRef.current) {
          refreshingRef.current = true;
          let refreshed: Session | null = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            const { data, error } = await supabase.auth.refreshSession();
            refreshed = data?.session ?? null;

            if (DEBUG_AUTH) {
              console.log('[Auth] ensureSession:refreshSession', {
                reason,
                requestId,
                attempt,
                ok: !error,
                hasSession: !!refreshed,
                error: error ? { name: error.name, message: error.message } : null,
              });
            }

            if (refreshed) break;
            if (attempt < 3) await sleep(200);
          }

          if (!refreshed) {
            refreshingRef.current = false;
            const { data: { session: reread } } = await supabase.auth.getSession();
            refreshed = reread ?? null;
          }

          finalSession = refreshed;
          refreshingRef.current = false;
        }

        if (requestId === ensureRequestIdRef.current) {
          setFromSession(finalSession, `ensureSession:${reason}`);
          setAuthReady(true);
        }

        refreshingRef.current = false;
        return finalSession;
      } catch (e) {
        if (DEBUG_AUTH) console.warn('[Auth] ensureSession:error', { reason, message: (e as Error)?.message });
        if (ensureRequestIdRef.current) {
          setAuthReady(true);
        }
        return null;
      }
    })();

    ensureInFlightRef.current = ensurePromise;

    return ensurePromise.finally(() => {
      ensureInFlightRef.current = null;
    });
  }, [setFromSession]);

  const ensureSessionRef = useRef(ensureSession);
  useEffect(() => {
    ensureSessionRef.current = ensureSession;
  }, [ensureSession]);

  const bumpAwakeRef = useRef(bumpAwake);
  useEffect(() => {
    bumpAwakeRef.current = bumpAwake;
  }, [bumpAwake]);

  const wakeTimerRef = useRef<number | null>(null);
  const wakeReasonRef = useRef<string>('init');
  const queueWake = useCallback((reason: string) => {
    wakeReasonRef.current = reason;
    if (wakeTimerRef.current !== null) {
      return;
    }

    wakeTimerRef.current = window.setTimeout(() => {
      wakeTimerRef.current = null;
      const finalReason = wakeReasonRef.current;
      ensureSessionRef.current?.(`wake:${finalReason}`);
      bumpAwakeRef.current?.(`wake:${finalReason}`);
    }, 0);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial hydration
    ensureSessionRef.current?.('init');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setFromSession(nextSession, `onAuthStateChange:${event}`);
      setAuthReady(true);

      if (DEBUG_AUTH) {
        console.log('[Auth] onAuthStateChange', {
          event,
          hasSession: !!nextSession,
          userId: nextSession?.user?.id,
        });
      }
    });

    const onFocus = () => {
      if (!mounted) return;
      queueWake('focus');
    };

    const onVisibilityChange = () => {
      if (!mounted) return;
      const state = document.visibilityState;
      if (state === 'visible') {
        queueWake('visibility');
        return;
      }

      if (DEBUG_AUTH) {
        console.log('[Auth] visibilitychange:skip bump (hidden)', { state });
      }
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (!mounted) return;
      const reason = e.persisted ? 'pageshow:bfcache' : 'pageshow';
      queueWake(reason);
    };

    const onOnline = () => {
      if (!mounted) return;
      queueWake('online');
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('online', onOnline);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('online', onOnline);
      if (wakeTimerRef.current !== null) {
        clearTimeout(wakeTimerRef.current);
        wakeTimerRef.current = null;
      }
    };
  }, [queueWake]);

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
