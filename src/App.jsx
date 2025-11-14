import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Home from './pages/Home'

export default function App() {
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    supabase.auth.onAuthStateChange((_e, s) => setSession(s))
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!session) return <Login onLogin={() => setSession(true)} />

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1 — Simulateur épargne retraite</div>
        <div className="top-actions">
          <Link to="/" className="chip">HOME</Link>
          <button className="chip" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </div>
  )
}
