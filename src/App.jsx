import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const location = useLocation()

  // Écoute la session uniquement pour afficher/masquer les boutons
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

  async function handleLogout(){
    try {
      // Déconnexion (local suffit pour l’app)
      await supabase.auth.signOut()
    } finally {
      // Hard redirect pour être CERTAIN d’atterrir sur /login
      window.location.replace('/login')
      // Ceinture de sécurité si le navigateur ignore replace()
      setTimeout(() => {
        if (!/^\/login(\/|$)/.test(window.location.pathname)) {
          window.location.assign('/login')
        }
      }, 50)
    }
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
            !onAuthFree && <Link to="/login" className="chip">Connexion</Link>
          )}
        </div>
      </div>

      <div className="container">
        <Outlet/>
      </div>
    </div>
  )
}
