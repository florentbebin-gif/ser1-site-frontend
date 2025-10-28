import React, { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const nav = useNavigate()
  const location = useLocation()

  // Routes accessibles sans auth (tolère /login, /login/, /reset, /reset/…)
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
    })
    return () => { data?.subscription?.unsubscribe?.(); mounted = false }
  }, [])

  // Garde d’auth (ne s’active qu’après la fin du chargement de session)
  useEffect(() => {
    if (loadingSession) return
    if (!session && !isAuthFree) {
      nav('/login', { replace: true })
    } else if (session && /^\/login(\/|$)/.test(location.pathname)) {
      nav('/', { replace: true })
    }
  }, [session, loadingSession, isAuthFree, location.pathname, nav])

  async function handleLogout(){
    try { await supabase.auth.signOut() } finally {
      // On laisse la garde d’auth gérer ensuite, mais on force vers /login par sécurité
      nav('/login', { replace: true })
    }
  }

  function handleReset(){
    triggerReset()
    alert('Toutes les saisies des simulateurs ont été réinitialisées.')
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
            // Sur /login on n’affiche pas le bouton “Connexion” (inutile)
            !/^\/login(\/|$)/.test(location.pathname) && (
              <Link to="/login" className="chip">Connexion</Link>
            )
          )}
        </div>
      </div>

      {/* IMPORTANT : on rend TOUJOURS l’Outlet (même pendant le chargement) */}
      <div className="container">
        <Outlet/>
      </div>
    </div>
  )
}
