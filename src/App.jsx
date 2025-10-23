import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Sim from './pages/Sim.jsx'
import Params from './pages/Params.jsx'
import Credit from './pages/Credit.jsx'
import Placement from './pages/Placement.jsx'
import { supabase } from './supabaseClient.js'
import { clearAllUserInputs } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
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
        <div className="brandword">SER1</div>  {/* <-- SER1 */}
        <div className="top-actions">
          <Link className="chip" to="/">HOME</Link>
          <Link className="chip" to="/params">Paramètres</Link>
          <button className="chip" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>

      <div className="container">
        <div className="panel panel-reset" style={{marginBottom:12}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <button className="chip" onClick={handleReset}>Reset</button>
            <span className="reset-note">Réinitialise toutes les saisies</span>
          </div>
        </div>

      </div>
    </div>
  )
}
