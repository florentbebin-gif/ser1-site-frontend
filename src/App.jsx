import React, { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Sim from './pages/Sim.jsx'
import { supabase } from './supabaseClient.js'

export default function App(){
  const [session, setSession] = useState(null)
  useEffect(()=>{
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  },[])

  return (
    <div>
      <header>
        <div><b>SER1</b> — Simulateurs</div>
        <div>
          {session ? <span>{session.user.email}</span> : <Link to='/login'>Se connecter</Link>}
        </div>
      </header>
      <div style={{maxWidth:1000, margin:'24px auto', padding:'0 16px'}}>
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/sim/:id' element={<Sim/>} />
        </Routes>
      </div>
    </div>
  )
}
