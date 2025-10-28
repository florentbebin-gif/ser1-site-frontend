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
    setError(''); setInfo(''); setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // ✅ Navigation dure immédiate : on arrive bien sur les tuiles
      window.location.assign('/')
    } catch (e) {
      setError(e?.message || "Impossible de se connecter. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  async function sendReset(e){
    e.preventDefault()
    if (!email) return setError("Saisissez votre email.")
    setError(''); setInfo(''); setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login``
      })
      if (error) throw error
      try { localStorage.setItem('lastResetEmail', email) } catch {}
      setInfo('Lien de réinitialisation envoyé. Vérifiez vos emails.')
    } catch (e) {
      setError(e?.message || "Échec de l’envoi du lien.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-bg" aria-hidden="true" />
      <div className="login-overlay" aria-hidden="true" />

      <div className="login-grid">
        <div className="login-title">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>

        <div className="login-card">
          <div className="card-title">Connexion</div>
          {error && <div className="alert error">{error}</div>}
          {info && <div className="alert success">{info}</div>}

          <form onSubmit={onSubmit} className="form-grid">
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={e=>setEmail(e.target.value)}
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

            <div className="form-row btns">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
              <button type="button" className="btn-outline" onClick={sendReset} disabled={loading || !email}>
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        </div>
      </div>

<style>{`
  :root{ --green:#2C3D38; --beige:#e8ded5; --ink:#222; --border:#D9D9D9; }

  /* Masquer la topbar sur la page login */
  .topbar { display: none !important; }

  .login-root{
    position:relative;
    width:100%;
    min-height:100vh;
    overflow:hidden;
  }

  /* Fond sous le contenu */
  .login-bg{
    position:fixed; inset:0;
    z-index:0;                         /* ✅ sous le masque et le contenu */
    background-image:url('/login-bg.jpg');
    background-size:cover;
    background-position:center;
  }

  /* Masque vert à 30% — sous le contenu, clics transparents */
  .login-overlay{
    position:fixed; inset:0;
    z-index:1;                         /* ✅ sous le contenu */
    background:rgba(44,61,56,0.30);
    pointer-events:none;               /* ✅ ne bloque pas les clics */
  }

  /* Grille du contenu par-dessus */
  .login-grid{
    position:relative;                 /* ✅ crée un contexte pour z-index */
    z-index:2;                         /* ✅ au-dessus du fond/masque */
    display:grid;
    grid-template-columns:1.2fr 0.8fr;
    gap:40px;
    align-items:center;
    padding:96px 48px;
  }

  .login-title{
    color:#fff;
    text-shadow:0 2px 4px rgba(0,0,0,.25);
  }

  .login-brand{
    font-size:72px;
    font-weight:800;
    border-bottom:5px solid var(--beige);
    display:inline-block;
    margin-bottom:12px;
  }

  .login-sub{ font-size:32px; font-weight:600; }

  .login-card{
    background:#fff;
    padding:24px;
    border-radius:14px;
    width:min(92vw,560px);
    box-shadow:0 8px 30px rgba(0,0,0,.22);
  }

  .card-title{ font-size:22px; font-weight:700; margin-bottom:10px; }
  .form-grid{ display:flex; flex-direction:column; gap:12px; }
  .form-row{ display:flex; flex-direction:column; gap:6px; }
  .form-row.btns{ flex-direction:row; gap:10px; }
  input{
    padding:10px 12px; border:1px solid var(--border); border-radius:10px;
  }
  input:focus{ border-color:var(--green); box-shadow:0 0 0 3px rgba(44,61,56,0.12); outline:none; }
  .btn{ background:var(--green); color:#fff; padding:10px 16px; border-radius:12px; border:none; }
  .btn-outline{ border:1px solid var(--border); padding:10px 14px; border-radius:12px; background:#fff; }
  .alert{ padding:10px; border-radius:10px; }
  .alert.error{ background:#fee2e2; color:#991b1b; }
  .alert.success{ background:#e7f9ee; color:#166534; }

  @media (max-width:1024px){
    .login-grid{ grid-template-columns:1fr; padding:88px 20px; row-gap:28px; }
    .login-brand{ font-size:48px; border-bottom-width:4px; }
    .login-sub{ font-size:22px; }
  }
`}</style>

    </div>
  )
}
