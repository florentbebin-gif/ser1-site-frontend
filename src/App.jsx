import React, { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const nav = useNavigate()
  const location = useLocation()

  // Charger la session + écouter les changements (login/logout)
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setLoadingSession(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  // Garde d’auth : redirige /login si non connecté (sauf si déjà sur /login)
  useEffect(() => {
    if (loadingSession) return
    const isOnLogin = location.pathname === '/login'
    if (!session && !isOnLogin) {
      nav('/login', { replace: true })
    } else if (session && isOnLogin) {
      nav('/', { replace: true })
    }
  }, [session, loadingSession, location.pathname, nav])

  async function handleLogout(){
    await supabase.auth.signOut()
    nav('/login', { replace: true })
  }

  function handleReset(){
    triggerReset()
    alert('Toutes les saisies des simulateurs ont été réinitialisées.')
  }

  // État transitoire pendant la détection de session
  if (loadingSession) {
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
          {/* HOME */}
          {isAuthed && (
            <Link
              to="/"
              className={`chip ${location.pathname === '/' ? 'active' : ''}`}
            >
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
