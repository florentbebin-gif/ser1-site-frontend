import React, { useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if(error){ setError(error.message); return }
    nav('/')
  }

  return (
    <div className='excel'>
      <h2>Connexion</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12, maxWidth:420}}>
        <label>Email</label>
        <input type='email' value={email} onChange={e=>setEmail(e.target.value)} required />
        <label>Mot de passe</label>
        <input type='password' value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className='btn' disabled={loading}>{loading?'Connexion...':'Se connecter'}</button>
        {error && <div style={{color:'#b00020'}}>{error}</div>}
      </form>
    </div>
  )
}
