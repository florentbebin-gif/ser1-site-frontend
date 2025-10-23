import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Sim from './pages/Sim.jsx'
import Params from './pages/Params.jsx'
import { supabase } from './supabaseClient.js'
import { clearAllUserInputs } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const nav = useNavigate()

  useEffect(()=>{
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s)=>setSession(s))
    return () => subscription.unsubscribe()
  },[])

  async function handleLogout(){
    await supabase.auth.signOut()
    nav('/login')
  }
  function handleReset(){
    clearAllUserInputs()
    alert('Toutes les saisies des 7 simulateurs ont été réinitialisées.')
  }

  return (
    <div>
      <div className="topbar">
        <div className="top-left">
          <div className="brand">
            <img src="/logo.png" alt="Laplace / SER1" />
            <span>Laplace</span>
          </div>
        </div>
        <div className="top-actions">
          <Link className="chip" to="/params">Paramètres</Link>
          <button className="chip" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>
      <div className="container">
        <div className="reset">
          <div className="icon">🗑️</div>
          <button className="chip" onClick={handleReset}>Reset</button>
        </div>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/sim/:id" element={<Sim/>} />
          <Route path="/params" element={<Params/>} />
        </Routes>
      </div>
    </div>
  )
}
