import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { startIdleTimer } from './utils/idle.js'

export default function App() {
  const [session, setSession] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Détecte un hash d'auth Supabase (invite/signup/recovery)
  const hasRecoveryLikeHash = () => {
    try {
      const s = (window.location.hash || '').toLowerCase()
      return (
        s.includes('type=recovery') ||
        s.includes('type=invite') ||
        s.includes('type=signup')
      )
    } catch {
      return false
    }
  }

  // Helper: signOut avec timeout pour ne pas bloquer l’UI
  async function signOutWithTimeout(ms = 1500) {
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'global' }),
        new Promise((resolve) => setTimeout(resolve, ms)),
      ])
    } catch {
      // on ignore, on passe à la suite
    }
  }

  // Suivre la session
  useEffect(() => {
    let mounted = true

    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) setSession(session || null)
    })()

    const { data } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (mounted) setSession(s || null)
    })

    return () => {
      data?.subscription?.unsubscribe?.()
      mounted = false
    }
  }, [])

  // Entonnoir: si on reçoit un lien Supabase avec token, forcer /login + hash
  useEffect(() => {
    if (hasRecoveryLikeHash() && location.pathname !== '/login') {
      navigate('/login' + (window.location.hash || ''), { replace: true })
    }
  }, [location.pathname, navigate])

  // Déconnexion auto après 10 min d’inactivité (hors page reset)
  const onResetPage = location.pathname.startsWith('/reset')
  useEffect(() => {
    if (!session || onResetPage) return
    const stop = startIdleTimer({
      timeoutMs: 10 * 60 * 1000,
      onTimeout: async () => {
        await signOutWithTimeout(1500)
        try {
          // purge ceinture+bretelles
          Object.keys(localStorage)
            .filter((k) => k.startsWith('sb-'))
            .forEach((k) => localStorage.removeItem(k))
        } catch {}
        try {
          sessionStorage.clear()
        } catch {}
        window.location.href = '/login?logout=1'
      },
    })
    return stop
  }, [session, onResetPage])

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)

    await signOutWithTimeout(1500)

    // purge locale
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-'))
        .forEach((k) => localStorage.removeItem(k))
    } catch {}
    try {
      sessionStorage.clear()
    } catch {}

    window.location.href = '/login?logout=1'
  }

  // Bouton Reset global (affiché seulement hors Home) :
  // Ici on émet un event ; chaque page peut écouter 'page-reset' si besoin.
  function handleReset() {
    try {
      window.dispatchEvent(new CustomEvent('page-reset'))
    } catch {}
    alert('Les champs de la page peuvent être réinitialisés (selon l’implémentation locale).')
  }

  const isAuthed = !!session
  const onAuthFree = /^\/login(\/|$)|^\/reset(\/|$)/.test(location.pathname)

  return (
    <div>
      {/* TOPBAR */}
      <div className="topbar">
        <div className="brandword">SER1 — Simulateur épargne retraite</div>

        <div className="top-actions">
          {/* HOME */}
          {isAuthed && (
            <Link
              to="/"
              className={`chip ${location.pathname === '/' ? 'active' : ''}`}
            >
              HOME
            </Link>
          )}

          {/* Reset (masqué sur la page d’accueil) */}
          {(() => {
            const p = location.pathname
            const showReset =
              isAuthed &&
              (p.startsWith('/placement') ||
                p.startsWith('/credit') ||
                p.startsWith('/sim') ||
                p.startsWith('/params'))

            return showReset ? (
              <button className="chip" onClick={handleReset}>
                Reset
              </button>
            ) : null
          })()}

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

      {/* CONTENU ROUTES */}
      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}
