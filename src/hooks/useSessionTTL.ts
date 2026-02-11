/**
 * useSessionTTL — Session TTL "pro" hook (P0-06)
 *
 * Comportement :
 * - Heartbeat toutes les 30 s (vérifie que la session Supabase est encore valide)
 * - Coupure après 1 h d'inactivité
 * - Grâce 2-5 min si perte heartbeat (réseau instable / tab hidden)
 *   ⚠️ La grâce est une tolérance heartbeat, PAS une conservation après fermeture onglet
 *   (sessionStorage est détruit à la fermeture)
 * - Reset inactivité : saisie formulaire, navigation, clic CTA
 * - UX : message "session expire dans X min" avant expiration
 * - À l'expiration : purge sessionStorage, révocation Blob URLs, signOut
 *
 * Usage dans App.jsx :
 *   const { sessionExpired, minutesRemaining, warningVisible } = useSessionTTL();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { debugLog } from '../utils/debugFlags';

// ---------- Config ----------

const HEARTBEAT_INTERVAL_MS = 30_000;           // 30 secondes
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1_000;  // 1 heure
const GRACE_PERIOD_MS = 3 * 60 * 1_000;         // 3 min (dans la fourchette 2-5 min)
const WARNING_BEFORE_MS = 5 * 60 * 1_000;       // Avertissement 5 min avant expiration

// Événements qui reset le timer d'inactivité
const ACTIVITY_EVENTS = [
  'keydown',      // saisie formulaire
  'mousedown',    // clic CTA, navigation
  'scroll',       // navigation scroll
  'touchstart',   // mobile
] as const;

// ---------- Types ----------

export interface SessionTTLState {
  /** true quand la session a expiré (inactivité ou heartbeat perdu) */
  sessionExpired: boolean;
  /** Minutes restantes avant expiration (-1 si pas de session) */
  minutesRemaining: number;
  /** true quand le warning "session expire bientôt" doit s'afficher */
  warningVisible: boolean;
  /** Force le reset du timer (ex: après une action importante) */
  resetInactivity: () => void;
  /** Purge la session manuellement */
  expireNow: () => void;
}

// ---------- Hook ----------

export function useSessionTTL(): SessionTTLState {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(-1);
  const [warningVisible, setWarningVisible] = useState(false);

  // Refs pour ne pas recréer les timers à chaque render
  const lastActivityRef = useRef(Date.now());
  const heartbeatMissedSinceRef = useRef<number | null>(null);
  const hasSessionRef = useRef(false);
  const expiredRef = useRef(false);

  // ---------- Purge ----------

  const purgeSession = useCallback(async () => {
    if (expiredRef.current) return; // déjà purgé
    expiredRef.current = true;

    debugLog('auth', 'TTL: session expirée — purge en cours');

    // 1. Purge sessionStorage (données simulateur)
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // sessionStorage peut ne pas être dispo
    }

    // 2. Révocation Blob URLs (stockées dans window.__ser1BlobUrls si existant)
    try {
      const blobUrls = (window as unknown as Record<string, string[]>).__ser1BlobUrls;
      if (Array.isArray(blobUrls)) {
        blobUrls.forEach((url) => URL.revokeObjectURL(url));
        (window as unknown as Record<string, string[]>).__ser1BlobUrls = [];
      }
    } catch {
      // pas critique
    }

    // 3. SignOut Supabase
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — token peut être déjà expiré
    }

    setSessionExpired(true);
    setWarningVisible(false);
    setMinutesRemaining(0);
  }, []);

  // ---------- Reset inactivité ----------

  const resetInactivity = useCallback(() => {
    if (expiredRef.current) return;
    lastActivityRef.current = Date.now();
    setWarningVisible(false);
    debugLog('auth', 'TTL: inactivité reset');
  }, []);

  // ---------- Expire maintenant ----------

  const expireNow = useCallback(() => {
    purgeSession();
  }, [purgeSession]);

  // ---------- Heartbeat + inactivity check ----------

  useEffect(() => {
    // N'activer que si l'utilisateur a une session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      hasSessionRef.current = !!data.session;
      if (!data.session) {
        setMinutesRemaining(-1);
      }
    };
    checkSession();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      hasSessionRef.current = !!session;
      if (session) {
        // Nouvelle session → reset tout
        expiredRef.current = false;
        lastActivityRef.current = Date.now();
        heartbeatMissedSinceRef.current = null;
        setSessionExpired(false);
      }
    });

    // --- Heartbeat interval ---
    const heartbeatId = setInterval(async () => {
      if (!hasSessionRef.current || expiredRef.current) return;

      // 1. Vérifier inactivité
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = INACTIVITY_TIMEOUT_MS - elapsed;
      const mins = Math.max(0, Math.ceil(remaining / 60_000));
      setMinutesRemaining(mins);

      if (remaining <= WARNING_BEFORE_MS && remaining > 0) {
        setWarningVisible(true);
      }

      if (remaining <= 0) {
        debugLog('auth', 'TTL: inactivité 1h dépassée');
        purgeSession();
        return;
      }

      // 2. Heartbeat Supabase
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          heartbeatMissedSinceRef.current = null; // heartbeat OK
        } else {
          throw new Error('no session');
        }
      } catch {
        // Heartbeat raté
        if (!heartbeatMissedSinceRef.current) {
          heartbeatMissedSinceRef.current = Date.now();
          debugLog('auth', 'TTL: premier heartbeat manqué');
        } else {
          const missedFor = Date.now() - heartbeatMissedSinceRef.current;
          if (missedFor >= GRACE_PERIOD_MS) {
            debugLog('auth', `TTL: grâce ${GRACE_PERIOD_MS / 1000}s dépassée`);
            purgeSession();
          }
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    // --- Activity listeners ---
    const handleActivity = () => {
      if (!expiredRef.current && hasSessionRef.current) {
        lastActivityRef.current = Date.now();
        if (warningVisible) {
          setWarningVisible(false);
        }
      }
    };

    ACTIVITY_EVENTS.forEach((evt) => document.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      clearInterval(heartbeatId);
      ACTIVITY_EVENTS.forEach((evt) => document.removeEventListener(evt, handleActivity));
      subscription.unsubscribe();
    };
  }, [purgeSession, warningVisible]);

  return {
    sessionExpired,
    minutesRemaining,
    warningVisible,
    resetInactivity,
    expireNow,
  };
}
