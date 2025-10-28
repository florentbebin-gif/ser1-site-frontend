import React, { useEffect, useState, useMemo } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const nav = useNavigate()
  const location = useLocation()

  const isAuthFree = useMemo(() => {
    // Routes accessibles sans être connecté
    return location.pathname === '/login' || location.pathname === '/reset'
  }, [location.pathname])

  // Charger session + écouter login/logout (robuste)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session)
      } catch (e) {
        console.warn('getSession failed:', e)
      } finally {
        if (mounted) setLoadingSession(false)
      }
    })()

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => {
      mounted = false
      data?.subscription?.unsubscribe?.()
    }
  }, [])

  // Garde d’auth : redirige si non connecté (sauf routes libres)
  useEffect(() => {
    if (loadingSession) return
    if (!session && !isAuthFree) {
      nav('/login', { replace: true })
    } else if (session && location.pathname === '/login') {
      nav('/', { replace: true })
    }
  }, [session, loadingSession, isAuthFree, location.pathname, nav])

  async function handleLogout(){
    await supabase.auth.signOut()
    // On laisse la garde d’auth gérer, mais on force vers /login par sécurité
    nav('/login', { replace: true })
  }

  function handleReset(){
    triggerReset()
    alert('Toutes les saisies des simulateurs ont été réinitialisées.')
  }

  // ⬇️ Nouveau comportement :
  // - Si on est SUR une route libre (/login, /reset), on REND l’Outlet même si loadingSession est true
  // - Sinon, on montre "Initialisation…" le temps de charger
  if (loadingSession && !isAuthFree) {
    return (
      <div style={{padding:24, fontFamily:'system-ui'}}>
        <div className="topbar">
          <div className="brandword">SER1</div>
        </div>
        <div style={{padding:24}}>Initialisation…</div>
      </div>
    )
  }

  const isAuthed = !!session

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1</div>

        <div className="top-actions">
          {isAuthed && (
            <Link
              to="/"
              className={`chip ${location.pathname === '/' ? 'active' : ''}`}
            >
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
            location.pathname !== '/login' && (
              <Link to="/login" className="chip">Connexion</Link>
            )
          )}
        </div>
      </div>

      <div className="container">
        <Outlet/>
      </div>
    </div>
  )
}
