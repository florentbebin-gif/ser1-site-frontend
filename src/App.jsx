import React, { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { clearAllUserInputs } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout(){
    await supabase.auth.signOut()
    nav('/') // retour accueil
  }

  function handleReset(){
    clearAllUserInputs()
    alert('Toutes les saisies des 7 simulateurs ont été réinitialisées.')
  }

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1</div>
        <div className="top-actions">
          <Link className="chip" to="/">HOME</Link>
          <button className="chip" onClick={handleReset}>Reset</button> {/* ← ICI */}
          <Link className="chip" to="/params">Paramètres</Link>
          <button className="chip" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>

      <div className="container">
        <Outlet/>
      </div>
    </div>
  )
}
