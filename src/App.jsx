import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'
import { startIdleTimer } from './utils/idle.js'

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

  // Charger la session + écouter login/logout
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session)
      } catch (e) {
        console.warn('supabase.auth.getSession failed:', e)
      } finally {
        if (mounted) setLoadingSession(false)
      }
    })()

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      // dès que la session tombe à null (logout/expiration), go /login
      if (!s) {
        // évite l’affichage de pages privées résiduelles
        nav('/login', { replace: true })
      }
    })
    unsubRef.current = data?.subscription
    return () => {
      unsubRef.current?.unsubscribe?.()
      unsubRef.current = null
    }
  }, [nav])

  // Garde d’auth (après chargement)
  useEffect(() => {
    if (loadingSession) return
    if (!session && !isAuthFree) {
      nav('/login', { replace: true })
    } else if (session && /^\/login(\/|$)/.test(location.pathname)) {
      nav('/', { replace: true })
    }
  }, [session, loadingSession, isAuthFree, location.pathname, nav])

  // Auto-logout inactivité (10 min)
  useEffect(() => {
    if (!session) return
    const stop = startIdleTimer({
      timeoutMs: 10 * 60 * 1000,
      onTimeout: async () => {
        if (logoutInProgress.current) return
        logoutInProgress.current = true
        try {
          // on coupe toute session locale
          await supabase.auth.signOut({ scope: 'local' })
        } catch (e) {
          console.warn('auto signOut failed', e)
        } finally {
          setSession(null) // optimiste: coupe tout rendu privé
          // Hard reload pour repartir proprement
          window.location.href = '/login'
        }
      },
    })
    return stop
  }, [session])

  // Déconnexion manuelle 100% fiable
  async function handleLogout(){
    if (logoutInProgress.current) return
    logoutInProgress.current = true
    try {
      // optimiste: coupe l’UI privée tout de suite
      setSession(null)
      // déconnexion locale (suffisant pour email/mdp & magic link)
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      console.warn('manual signOut failed', e)
    } finally {
      // on retire l’abonnement pour éviter tout écho
      unsubRef.current?.unsubscribe?.()
      unsubRef.current = null
      // Hard redirect pour éviter tout état résiduel du SPA
      window.location.href = '/login'
      // (pas de finally reset: on quitte la page)
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
            <button className="chip logout" onClick={handleLogout}>
              Déconnexion
            </button>
          ) : (
            !(/^\/login(\/|$)|^\/reset(\/|$)/.test(location.pathname)) && (
              <Link to="/login" className="chip">Connexion</Link>
            )
          )}
        </div>
      </div>

      <div className="container">
        {canView ? <Outlet/> : null}
      </div>
    </div>
  )
}
