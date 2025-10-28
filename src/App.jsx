import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const location = useLocation()

  // État de session pour l’UI
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

  // Déconnexion robuste: lien + signOut
  async function onLogoutClick(e){
    // On laisse le lien naviguer (href) mais on tente quand même un signOut
    try { await supabase.auth.signOut() } catch {}
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
            // ⬇️ lien HTML => navigation dure vers /login?logout=1
            <a href="/login?logout=1" className="chip logout" onClick={onLogoutClick}>
              Déconnexion
            </a>
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
