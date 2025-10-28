import React, { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'
import { startIdleTimer } from './utils/idle.js'

export default function App(){
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const nav = useNavigate()
  const location = useLocation()

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
      // Si la session devient nulle, on force vers /login
      if (!s) nav('/login', { replace: true })
    })
    return () => { data?.subscription?.unsubscribe?.(); mounted = false }
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
        try { await supabase.auth.signOut() } catch {}
        // Hard redirect pour éviter tout état transitoire
        window.location.replace('/login')
      },
    })
    return stop
  }, [session])

  // Déconnexion manuelle fiable
  async function handleLogout(){
    try { await supabase.auth.signOut() } catch (e) {
      console.warn('manual signOut failed', e)
    } finally {
      // Hard redirect = pas de flicker, pas de reste d’état
      window.location.replace('/login')
    }
  }

  function handleReset(){
    triggerReset()
    alert('Toutes les saisies des simulateurs ont été réinitialisées.')
  }

  const isAuthed = !!session
  const canView = isAuthFree || isAuthed || loadingSession // on laisse /login et /reset s'afficher même si ça charge

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
            // Sur /login et /reset, pas de bouton "Connexion"
            !(/^\/login(\/|$)|^\/reset(\/|$)/.test(location.pathname)) && (
              <Link to="/login" className="chip">Connexion</Link>
            )
          )}
        </div>
      </div>

      {/* IMPORTANT : ne jamais afficher le contenu privé quand il n'y a pas de session */}
      <div className="container">
        {canView ? <Outlet/> : null}
      </div>
    </div>
  )
}
