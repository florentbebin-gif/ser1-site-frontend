import React, { useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function onSubmit(e){
    e.preventDefault()
    setLoading(true); setError(''); setInfo('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  async function sendReset(e){
    e.preventDefault()
    if (!email) return setError("Saisissez votre email.")
    setLoading(true); setError(''); setInfo('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`
    })
    setLoading(false)
    if (error) setError(error.message)
    else setInfo('Lien de réinitialisation envoyé. Vérifiez vos emails.')
  }

  async function sendMagicLink(e){
    e.preventDefault()
    if (!email) return setError("Saisissez votre email.")
    setLoading(true); setError(''); setInfo('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/reset` }
    })
    setLoading(false)
    if (error) setError(error.message)
    else setInfo('Lien magique envoyé. Vérifiez votre boîte mail.')
  }

  return (
    <div className="panel">
      <div className="plac-title">Connexion</div>

      {error && <div className="alert error">{error}</div>}
      {info && <div className="alert success">{info}</div>}

      <form onSubmit={onSubmit} className="form-grid" style={{maxWidth: 520}}>
        <div className="form-row">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
          />
        </div>

        <div className="form-row">
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
        </div>

        {/* Boutons : 1 primaire (Se connecter) + 2 secondaires lisibles */}
        <div
          className="form-row"
          style={{
            display:'flex',
            gap:10,
            flexWrap:'wrap',
            alignItems:'center'
          }}
        >
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          {/* Bouton secondaire (outline clair) */}
          <button
            type="button"
            onClick={sendReset}
            disabled={loading || !email}
            style={{
              background:'#fff',
              border:'1px solid var(--border)',
              color:'var(--ink)',
              borderRadius:12,
              padding:'10px 14px',
              cursor:'pointer'
            }}
          >
            Mot de passe oublié ?
          </button>

          {/* Bouton secondaire (outline clair) */}
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={loading || !email}
            style={{
              background:'#fff',
              border:'1px solid var(--border)',
              color:'var(--ink)',
              borderRadius:12,
              padding:'10px 14px',
              cursor:'pointer'
            }}
          >
            Lien magique
          </button>
        </div>
      </form>
    </div>
  )
}
