import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'
import { startIdleTimer } from './utils/idle.js'

export default function App(){
  const [session, setSession] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const location = useLocation()

  // Suivre la session pour l'UI
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) setSession(session)
    })()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (mounted) setSession(s)
    })
    return () => { data?.subscription?.unsubscribe?.(); mounted = false }
  }, [])

  // 🔔 Déconnexion auto après 10 min d’inactivité
  useEffect(() => {
    if (!session) return
    const stop = startIdleTimer({
      timeoutMs: 10 * 60 * 1000,
      onTimeout: async () => {
        try {
          await supabase.auth.signOut({ scope: 'global' })
        } catch {}
        // Purge "ceinture + bretelles"
        try {
          Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k))
        } catch {}
        try { sessionStorage.clear() } catch {}
        window.location.replace('/login?logout=1')
      }
    })
    return stop
  }, [session])

  // Déconnexion manuelle robuste (bouton)
  async function handleLogout(){
    if (loggingOut) return
    setLoggingOut(true)

    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch {}

    // Purge locale au cas où
    try {
      Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k))
    } catch {}
    try { sessionStorage.clear() } catch {}

    window.location.replace('/login?logout=1')
  }

  function handleReset(){
    triggerReset()
    alert('Toutes les saisies des simulateurs ont été réinitialisées.')
  }

  const isAuthed = !!session
  const onAuthFree = /^\/login(\/|$)|^\/reset(\/|$)/.test(location.pathname)

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1</div>

        <div className="top-actions">
          {/* HOME */}
          {isAuthed && (
            <Link to="/" className={`chip ${location.pathname === '/' ? 'active' : ''}`}>
              HOME
            </Link>
          )}

          {/* Reset */}
          {isAuthed && (
            <button className="chip" onClick={handleReset}>
              Reset
            </button>
          )}

          {/* Paramètres */}
          {isAuthed && (
            <Link
              to="/params"
              className={`chip ${location.pathname.startsWith('/params') ? 'active' : ''}`}
            >
              Paramètres
            </Link>
          )}

          {/* Déconnexion / Connexion */}
          {isAuthed ? (
            <button
              type="button"
              className="chip logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
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
  )
}
