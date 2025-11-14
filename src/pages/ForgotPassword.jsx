import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    setDone(true)
    setLoading(false)
  }

  if (done) {
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
            <h2 className="card-title">Email envoyé</h2>
            <p style={{ margin: '12px 0' }}>
              Si ce compte existe, un lien vient d’être envoyé à <strong>{email}</strong>.
            </p>
            <button className="btn" onClick={() => navigate('/login')}>
              Retour à la connexion
            </button>
          </div>
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
          <h2 className="card-title">Réinitialisation du mot de passe</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              required
            />
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              required
            />
            <div className="form-row btns">
              <Link to="/login" className="btn-outline">Annuler</Link>
              <button className="btn" disabled={loading}>
                {loading ? 'Envoi…' : 'Valider'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
