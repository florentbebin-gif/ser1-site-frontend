import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

function ResetBox({ onDone }) {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (pwd !== pwd2) return alert('Les mots de passe ne correspondent pas');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) alert(error.message);
    else {
      alert('Mot de passe mis à jour !');
      onDone();
    }
    setLoading(false);
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <h3>Réinitialisation du mot de passe</h3>
        <form className="form-grid" onSubmit={handleReset}>
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            required
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Validation…' : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Lecture du hash
  const h = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
  const type = h.get('type');
  const at = h.get('access_token');
  const rt = h.get('refresh_token');
  const inRecovery = ['recovery', 'invite', 'reauthentication'].includes(type);

  // Bloque la session auto pendant recovery
  useEffect(() => {
    if (inRecovery) {
      supabase.auth.signOut().catch(() => {});
    }
  }, [inRecovery]);

  // Pose la session à partir du hash
  useEffect(() => {
    if (inRecovery && at && rt) {
      supabase.auth.setSession({ access_token: at, refresh_token: rt }).then(() => {
        window.history.replaceState({}, '', window.location.pathname);
      });
    }
  }, [inRecovery, at, rt]);

  // Affichage ResetBox
  const [showRecovery, setShowRecovery] = useState(inRecovery);
  useEffect(() => {
    setShowRecovery(inRecovery);
  }, [inRecovery]);

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
      redirectTo: `${window.location.origin}/login`,
    });
    setResetSent(true);
    setLoading(false);
  };

  const handleResetDone = () => {
    setShowRecovery(false);
    navigate('/');
  };

  // Si recovery → affiche ResetBox
  if (showRecovery) {
    return <ResetBox onDone={handleResetDone} />;
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <h3>Connexion</h3>
        {error && <div className="alert error">{error}</div>}
        {resetSent && (
          <div className="alert success">
            Si votre adresse e-mail existe, un lien vous a été envoyé.
          </div>
        )}
        <form className="form-grid" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <button className="btn-link" onClick={handleForgot}>
          Mot de passe oublié ?
        </button>
      </div>
    </div>
  );
}
