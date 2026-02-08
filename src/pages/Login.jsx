import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Email ou mot de passe invalide.');
    else onLogin();
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) {
      setError('Merci de renseigner votre e-mail');
      return;
    }
    setError('');
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });
    setResetSent(true);
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg" />
      <div className="login-overlay" />
      <div className="login-grid">
        <div className="login-title" data-testid="login-brand-container">
          <h1 className="login-brand" data-testid="login-brand">SER1</h1>
          <div className="login-sub" data-testid="login-subtitle">Simulateur épargne retraite</div>
        </div>
        <div className="login-card" data-testid="login-card">
          <h2 className="card-title" data-testid="login-title">Connexion</h2>
          {error && <div className="alert error" data-testid="login-error">{error}</div>}
          {resetSent && (
            <div className="alert success" data-testid="login-reset-sent">
              Si votre adresse e-mail existe, un lien vous a été envoyé.<br />
              <small style={{ opacity: 0.8 }}>Cliquez sur le lien dans l'email pour définir votre mot de passe.</small>
            </div>
          )}
          <form className="form-grid" onSubmit={handleLogin} data-testid="login-form">
            <label>Email</label>
            <input
              type="email"
              data-testid="login-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Mot de passe</label>
            <input
              type="password"
              data-testid="login-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={loading} data-testid="login-submit-button">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <div className="login-links">
            <button className="btn-link" onClick={handleForgot} data-testid="login-forgot-button">
              Mot de passe oublié ?
            </button>
            <div className="login-hint" data-testid="login-hint">
              Première connexion ? Utilisez «&nbsp;Mot de passe oublié&nbsp;» pour définir votre mot de passe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
