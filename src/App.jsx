import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'
import { startIdleTimer } from './utils/idle.js'

/** Petite redirection infaillible : tente navigate, puis fallback hard redirect */
function Redirector({ to = '/login' }) {
  const nav = useNavigate()
  useEffect(() => {
    // 1) tente SPA
    nav(to, { replace: true })
    // 2) assure le coup si le routeur n’applique pas
    const t = setTimeout(() => {
      if (window.location.pathname !== to) {
        window.location.assign(to)
      }
    }, 50)
    return () => clearTimeout(t)
  }, [nav, to])
  return null
}

export default function App(){
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const nav = useNavigate()
  const location = useLocation()
  const logoutInProgress = useRef(false)
  const unsubRef = useRef(null)

  // Routes accessibles sans auth
  const isAuthFree = useMemo(() => {
    const p = location.pathname || '/'
    return /^\/login(\/|$)/.test(p) || /^\/reset(\/|$)/.test(p)
  }, [location.pathname])

  // Session + listener
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session)
      } catch (e) {
        console.warn('getSession failed', e)
      } finally {
        if (mounted) setLoadingSession(false)
      }
    })()

    const { data } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s)
      if (!s) {
        // si la session tombe, forcer la page login
        nav('/login', { replace: true })
        setTimeout(() => {
          if (!/^\/login(\/|$)/.test(window.location.pathname)) {
            window.location.assign('/login')
          }
        }, 50)
      }
    })
    unsubRef.current = data?.subscription
    return () => { unsubRef.current?.unsubscribe?.(); unsubRef.current = null }
  }, [nav])

  // Garde d’auth
  useEffect(() => {
    if (loadingSession) return
    if (!session && !isAuthFree) {
      nav('/login', { replace: true })
    } else if (session && /^\/login(\/|$)/.test(location.pathname)) {
      nav('/', { replace: true })
    }
  }, [session, loadingSession, isAuthFree, location.pathname, nav])

  // Auto-logout 10 min
  useEffect(() => {
    if (!session) return
    const stop = startIdleTimer({
      timeoutMs: 10 * 60 * 1000,
      onTimeout: async () => {
        if (logoutInProgress.current) return
        logoutInProgress.current = true
        try { await supabase.auth.signOut({ scope: 'local' }) } catch {}
        setSession(null)
        // double redirection
        nav('/login', { replace: true })
        setTimeout(() => window.location.assign('/login'), 50)
      },
    })
    return stop
  }, [session, nav])

  // Déconnexion manuelle
  async function handleLogout(){
    if (logoutInProgress.current) return
    logoutInProgress.current = true
    try {
      setSession(null)                  // coupe immédiatement le rendu privé
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      console.warn('signOut failed', e)
    } finally {
      unsubRef.current?.unsubscribe?.()
      unsubRef.current = null
      // double redirection
      nav('/login', { replace: true })
      setTimeout(() => window.location.assign('/login'), 50)
    }
  }

  function handleReset(){
    triggerReset()
    alert('Toutes les saisies des simulateurs ont été réinitialisées.')
  }

  const isAuthed = !!session
  const canView = isAuthFree || isAuthed || loadingSession

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1</div>

        <div className="top-actions">
          {isAuthed && (
            <Link to="/" className={`chip ${location.pathname === '/' ? 'active' : ''}`}>
              HOME
            </Link>
          )}

          {isAuthed && (
            <button className="chip" onClick={handleReset}>Reset</button>
          )}

          {isAuthed && (
            <Link
              to="/params"
              className={`chip ${location.pathname.startsWith('/params') ? 'active' : ''}`}
            >
              Paramètres
            </Link>
          )}

          {isAuthed ? (
            <button className="chip logout" onClick={handleLogout}>Déconnexion</button>
          ) : (
            !(/^\/login(\/|$)|^\/reset(\/|$)/.test(location.pathname)) && (
              <Link to="/login" className="chip">Connexion</Link>
            )
          )}
        </div>
      </div>

      <div className="container">
        {/* Si pas de session et route privée => redirection rendue (pas seulement en effet) */}
        {!loadingSession && !isAuthFree && !isAuthed ? (
          <Redirector to="/login" />
        ) : (
          <Outlet/>
        )}
      </div>
    </div>
  )
}
