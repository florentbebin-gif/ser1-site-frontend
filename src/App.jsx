import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { triggerReset } from "./utils/reset.js";
import { startIdleTimer } from "./utils/idle.js";

export default function App() {
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setSession(session);
    })();

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (mounted) setSession(s);
    });

    return () => {
      data?.subscription?.unsubscribe?.();
      mounted = false;
    };
  }, []);

  // Déconnexion auto 10 min d’inactivité quand on est connecté
  useEffect(() => {
    if (!session) return;
    const stop = startIdleTimer({
      timeoutMs: 10 * 60 * 1000,
      onTimeout: async () => {
        try {
          await supabase.auth.signOut();
        } catch {}
        window.location.replace("/login?logout=1");
      },
    });
    return stop;
  }, [session]);

  async function onLogoutClick(e) {
    // pour éviter un href/navigate prématuré si tu gardes un <a>
    e?.preventDefault?.();
    try {
      await supabase.auth.signOut();
    } catch {}
    window.location.replace("/login?logout=1");
  }

  function handleReset() {
    triggerReset();
    alert("Toutes les saisies des simulateurs ont été réinitialisées.");
  }

  const isAuthed = !!session;
  const onAuthFree = /^\/login(\/|$)|^\/reset(\/|$)/.test(location.pathname);

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1</div>

        <div className="top-actions">
          {isAuthed && (
            <Link to="/" className={`chip ${location.pathname === "/" ? "active" : ""}`}>
              HOME
            </Link>
          )}

          {isAuthed && (
            <button className="chip" onClick={handleReset}>
              Reset
            </button>
          )}

          {isAuthed && (
            <Link
              to="/params"
              className={`chip ${location.pathname.startsWith("/params") ? "active" : ""}`}
            >
              Paramètres
            </Link>
          )}

          {isAuthed ? (
            <button className="chip logout" onClick={onLogoutClick}>
              Déconnexion
            </button>
          ) : (
            !onAuthFree && (
              <Link to="/login" className="chip">
                Connexion
              </Link>
            )
          )}
        </div>
      </div>

      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}
