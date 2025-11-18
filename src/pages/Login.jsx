import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './Login.css'

function ResetBox({ onDone }) {
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async e => {
    e.preventDefault()
    if (pwd !== pwd2) return alert('Les mots de passe ne correspondent pas')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwd })
    if (error) alert(error.message)
    else {
      alert('Mot de passe mis à jour !')
      onDone()
    }
    setLoading(false)
  }

  return (
    <div className="login-card">
      <h2 className="card-title">Réinitialisation du mot de passe</h2>
      <form onSubmit={handleReset} className="form-grid">
        <label>Nouveau mot de passe</label>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} required />
        <label>Confirmer le mot de passe</label>
        <input type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} required />
        <button className="btn" disabled={loading}>
          {loading ? 'Validation…' : 'Valider'}
        </button>
      </form>
    </div>
  )
}

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // 1) Lecture du hash
  const h = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
  const type = h.get('type')
  const at = h.get('access_token')
  const rt = h.get('refresh_token')
  const inRecovery = ['recovery', 'invite', 'reauthentication'].includes(type)
  console.log('Hash params:', { type, at, rt, inRecovery })

  // 2) Bloque la redirection automatique pendant recovery
  useEffect(() => {
    if (inRecovery) {
      supabase.auth.signOut().catch(() => {}) // vide la session
    }
  }, [inRecovery])

  // 3) Pose la session à partir du hash (si tokens présents)
  useEffect(() => {
    if (inRecovery && at && rt) {
      supabase.auth.setSession({ access_token: at, refresh_token: rt })
        .then(() => {
          // 4) Nettoie le hash pour éviter boucle au refresh
          window.history.replaceState({}, '', window.location.pathname)
        })
        .catch(() => {
          // Plan B : affiche quand même la box même si setSession échoue
        })
    }
  }, [inRecovery, at, rt])

  // 5) Détection finale : on affiche la box uniquement en recovery
  const [showRecovery, setShowRecovery] = useState(inRecovery)

  // 6) Connexion classique
  const handleLogin = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou mot de passe invalide.')
    else onLogin()
    setLoading(false)
  }

  // 7) Envoi du lien de réinitialisation
  const handleForgot = async () => {
    if (!email) {
      setError('Merci de renseigner votre e-mail')
      return
    }
    setError('')
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    setResetSent(true)
    setLoading(false)
  }

  // 8) Après changement de mot de passe : on navigue
  const handleResetDone = () => {
    setShowRecovery(false)
    navigate('/') // ou /login si tu veux forcer une nouvelle connexion
  }

  // 9) Affichage
  if (showRecovery) {
    return (
      <div className="login-wrapper">
        <div className="login-bg" />
        <div className="login-overlay" />
        <div className="login-grid">
          <div className="login-title">
            <h1 className="login-brand">SER1</h1>
            <div className="login-sub">Simulateur épargne retraite</div>
          </div>
          <ResetBox onDone={handleResetDone} />
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrapper">
      <div className="login-bg" />
      <div className="login-overlay" />
      <div className="login-grid">
        <div className="login-title">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>

        <div className="login-card">
          <h2 className="card-title">Connexion</h2>

          {error && <div className="alert error">{error}</div>}
          {resetSent && (
            <div className="alert success">
              Si votre adresse e-mail existe, un lien vous a été envoyé.
            </div>
          )}

          <form onSubmit={handleLogin} className="form-grid">
            <label>Email</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <button
            type="button"
            className="btn-link"
            onClick={handleForgot}
            disabled={loading}
          >
            Mot de passe oublié ?
          </button>
        </div>
      </div>
    </div>
  )
}
