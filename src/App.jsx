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
        <div className="brandword">SER1</div>
        <div className="top-actions">
          <Link className="chip" to="/params">Paramètres</Link>
          <button className="chip" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>
      <div className="container">
        <div className="reset-wrap">
          <div className="reset-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M9 6v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke-width="1.6" />
              <path d="M10 11v6M14 11v6" stroke-width="1.6"/>
            </svg>
          </div>
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
