import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function ForgotPassword(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });
    setDone(true);
  };

  if (done) {
    return (
      <div className="login-wrapper">
        <div className="login-bg" />
        <div className="login-overlay" />
        <div className="login-grid">
          <div className="login-title">
            <h1 className="login-brand">SER1</h1>
            <div className="login-sub">Simulateur epargne retraite</div>
          </div>
          <div className="login-card">
            <h2 className="card-title">Email envoye</h2>
            <p style={{ margin: '12px 0' }}>
              Si cette adresse existe, un lien vient d'etre envoye a <strong>{email}</strong>.
            </p>
            <Link to="/login" className="btn">Retour a la connexion</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-bg" />
      <div className="login-overlay" />
      <div className="login-grid">
        <div className="login-title">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur epargne retraite</div>
        </div>
        <div className="login-card">
          <h2 className="card-title">Mot de passe oublie</h2>
          <form onSubmit={handleSend} className="form-grid">
            <label>Adresse e-mail</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
            <button className="btn" type="submit">Envoyer le lien</button>
            <Link to="/login" className="btn-link">Annuler</Link>
          </form>
        </div>
      </div>
    </div>
  );
}
