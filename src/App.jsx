import React, { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const nav = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout(){
    await supabase.auth.signOut()
    nav('/')
  }

  function handleReset(){
    triggerReset()
    alert('Toutes les saisies des simulateurs ont été réinitialisées.')
  }

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1</div>

        <div className="top-actions">
          {/* HOME */}
          <Link
            to="/"
            className={`chip ${location.pathname === '/' ? 'active' : ''}`}
          >
            HOME
          </Link>

          {/* Reset */}
          <button className="chip" onClick={handleReset}>
            Reset
          </button>

          {/* Paramètres */}
          <Link
            to="/params"
            className={`chip ${location.pathname.startsWith('/params') ? 'active' : ''}`}
          >
            Paramètres
          </Link>

          {/* Déconnexion */}
          <button className="chip logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>

      <div className="container">
        <Outlet/>
      </div>
    </div>
  )
}
