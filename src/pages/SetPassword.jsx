import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Lecture du hash pour récupérer les tokens
  const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  const type = hash.get('type');

  useEffect(() => {
    // Vérifier si les tokens sont présents
    if (!accessToken || !refreshToken) {
      setError('Lien de réinitialisation invalide ou expiré');
      // Rediriger automatiquement vers la page de mot de passe oublié après 3 secondes
      setTimeout(() => {
        navigate('/forgot-password');
      }, 3000);
    }
  }, [accessToken, refreshToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Créer la session temporaire avec les tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError('Session expirée. Veuillez demander un nouveau lien de réinitialisation.');
        // Rediriger automatiquement vers la page de mot de passe oublié après 3 secondes
        setTimeout(() => {
          navigate('/forgot-password');
        }, 3000);
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch {
      setError('Erreur inattendue. Veuillez réessayer.');
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
            <div className="login-sub">Simulateur épargne retraite</div>
          </div>
          <div className="login-card">
            <h2 className="card-title">Mot de passe défini !</h2>
            <p style={{ margin: '12px 0', textAlign: 'center' }}>
              Votre mot de passe a été défini avec succès.<br />
              Vous allez être redirigé vers la page de connexion...
            </p>
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
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>
        <div className="login-card">
          <h2 className="card-title">
            {type === 'recovery' ? 'Réinitialiser votre mot de passe' : 'Définir votre mot de passe'}
          </h2>
          
          {error && (
            <div className="alert error">
              {error}
              {error.includes('expiré') || error.includes('invalide') ? (
                <div style={{ fontSize: '0.9em', marginTop: '8px' }}>
                  Redirection automatique vers la page de mot de passe oublié...
                </div>
              ) : null}
            </div>
          )}
          
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
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
              Renvoyer un email de réinitialisation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
