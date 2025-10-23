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
        <div className="brandword">Laplace</div>
        <div className="top-actions">
          <Link className="chip" to="/">HOME</Link> {/* <— BOUTON HOME */}
          <Link className="chip" to="/params">Paramètres</Link>
          <button className="chip" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>

      <div className="container">
        <div className="panel" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <button className="chip" onClick={handleReset}>Reset</button>
            <span className="cell-muted">Réinitialise toutes les saisies</span>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/sim/:id" element={<Sim/>} />
          <Route path="/params" element={<Params/>} />
          <Route path="/sim/credit" element={<Credit/>} />
          <Route path="/sim/placement" element={<Placement/>} />
        </Routes>
        <Outlet/>
      </div>
    </div>
  )
}
