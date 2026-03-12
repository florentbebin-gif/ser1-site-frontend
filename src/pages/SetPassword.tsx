import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function SetPassword(): React.ReactElement {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  const type = hash.get('type');

  useEffect(() => {
    if (accessToken && refreshToken) return;

    setError('Lien de reinitialisation invalide ou expire');
    const timeoutId = window.setTimeout(() => {
      navigate('/forgot-password');
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, refreshToken, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!accessToken || !refreshToken) {
      setError('Lien de reinitialisation invalide ou expire');
      return;
    }

    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError('Session expiree. Veuillez demander un nouveau lien de reinitialisation.');
        window.setTimeout(() => {
          navigate('/forgot-password');
        }, 3000);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        window.setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch {
      setError('Erreur inattendue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            <h2 className="card-title">Mot de passe defini !</h2>
            <p style={{ margin: '12px 0', textAlign: 'center' }}>
              Votre mot de passe a ete defini avec succes.<br />
              Vous allez etre redirige vers la page de connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isRecoveryMode = type === 'recovery';

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
          <h2 className="card-title">
            {isRecoveryMode ? 'Reinitialiser votre mot de passe' : 'Definir votre mot de passe'}
          </h2>

          {error && (
            <div className="alert error">
              {error}
              {error.includes('expire') || error.includes('invalide') ? (
                <div style={{ fontSize: '0.9em', marginTop: '8px' }}>
                  Redirection automatique vers la page de mot de passe oublie...
                </div>
              ) : null}
            </div>
          )}

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              value={password2}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword2(e.target.value)}
              required
              disabled={loading}
            />

            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Traitement...' : 'Valider'}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              className="btn-link"
              onClick={() => navigate('/forgot-password')}
              type="button"
            >
              Renvoyer un email de reinitialisation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
