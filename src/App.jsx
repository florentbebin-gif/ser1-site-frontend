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

  // routes libres
  const isAuthFree = useMemo(() => {
    const p = location.pathname || '/'
    return /^\/login(\/|$)/.test(p) || /^\/reset(\/|$)/.test(p)
  }, [location.pathname])

  // session + listener
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
      // si la session tombe, renvoyer login
      if (!s) {
        nav('/login', { replace: true })
        setTimeout(() => {
          if (!/^\/login(\/|$)/.test(window.location.pathname)) {
            window.location.assign('/login')
          }
        }, 50)
      }
    })
    return () => data?.subscription?.unsubscribe?.()
  }, [nav])

  // 🔁 IMPORTANT : à chaque changement de session, on réarme le flag
  useEffect(() => {
    logoutInProgress.current = false
  }, [session])

  // garde d'auth
  useEffect(() => {
    if (loadingSession) return
    if (!session && !isAuthFree) {
      nav('/login', { replace: true })
    } else if (session && /^\/login(\/|$)/.test(location.pathname)) {
      nav('/', { replace: true })
    }
  }, [session, loadingSession, isAuthFree, location.pathname, nav])

  // auto-logout 10 min (optionnel, garde si tu veux)
  useEffect(() => {
    if (!session) return
    const stop = startIdleTimer({
      timeoutMs: 10 * 60 * 1000,
      onTimeout: async () => {
        if (logoutInProgress.current) return
        logoutInProgress.current = true
        try { await supabase.auth.signOut() } catch {}
        // double redirection
        nav('/login', { replace: true })
        setTimeout(() => window.location.assign('/login'), 50)
      },
    })
    return stop
  }, [session, nav])

  // Déconnexion fiable à chaque fois
  async function handleLogout(){
    if (logoutInProgress.current) return
    logoutInProgress.current = true
    try {
      // coupe tout côté Supabase (local + remote)
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('signOut failed', e)
    } finally {
      // double redirection (SPA puis hard)
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
            <Link to="/" className={`chip ${location.pathname === '/' ? 'active' : ''}`}>HOME</Link>
          )}
          {isAuthed && (
            <button className="chip" onClick={handleReset}>Reset</button>
          )}
          {isAuthed && (
            <Link to="/params" className={`chip ${location.pathname.startsWith('/params') ? 'active' : ''}`}>Paramètres</Link>
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
        {canView ? <Outlet/> : null}
      </div>
    </div>
  )
}
