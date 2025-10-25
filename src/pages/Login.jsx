import React, { useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { useParamsGlobal } from '../context/ParamsProvider.jsx'

export default function Login(){
  const { params: g } = useParamsGlobal()
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

  const versionIR = g?.irVersion || '2025'

  return (
    <>
      <div className="login-fixed">
        {/* voile vert 30% */}
        <div className="login-overlay" />

        {/* Badge version (haut-gauche) */}
        <div className="login-meta">
          <span className="meta-chip"><LockIcon/> Version {versionIR}</span>
        </div>

        {/* Titre bloc gauche */}
        <div className="login-left">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>

        {/* Carte de connexion centrée */}
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
              <button type="button" className="btn-outline" onClick={sendMagicLink} disabled={loading || !email}>
                Lien magique
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Styles locaux */}
      <style>{`
        :root{
          --green:#2C3D38;
          --beige:#e8ded5;
          --ink:#222;
          --border:#D9D9D9;
          --topbar-h: 56px; /* ajuste si ta topbar est plus haute/basse */
        }

        /* HERO plein écran, fixé sous la topbar : plus AUCUNE bordure blanche */
        .login-fixed{
          position: fixed;
          top: var(--topbar-h);
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1; /* sous la topbar, au-dessus du fond */
          background-image: url('/login-bg.jpg');
          background-size: cover;
          background-position: center;
          display: grid;
          grid-template-areas:
            "meta"
            "title"
            "card";
          grid-template-rows: auto 1fr auto;
          justify-items: center;
        }

        .login-overlay{
          position: absolute; inset: 0;
          background: rgba(44,61,56,0.30); /* voile vert 30% */
        }

        .login-meta{
          grid-area: meta;
          width: 100%;
          max-width: 1400px;
          padding: 16px 20px;
          z-index: 2;
          display: flex; gap: 12px;
        }
        .meta-chip{
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(255,255,255,.22);
          color:#fff; padding:8px 12px; border-radius:16px;
          backdrop-filter: blur(2px);
          font-size:14px;
        }

        /* Bloc titre à gauche, plus haut */
        .login-left{
          grid-area: title;
          width: 100%;
          max-width: 1400px;
          padding: 6vh 60px 0;
          z-index: 2;
          color: #fff;
          text-shadow: 0 2px 4px rgba(0,0,0,.25);
          align-self: start;
        }
        @media (max-width: 768px){ .login-left { padding: 4vh 24px 0; } }

        .login-brand{
          font-size: 64px; font-weight: 800; line-height: 1;
          margin: 0 0 8px 0;
          border-bottom: 4px solid var(--beige); display: inline-block; padding-bottom: 6px;
        }
        @media (max-width: 640px){ .login-brand { font-size: 46px; } }
        .login-sub{ font-size: 28px; font-weight: 600; }

        /* Carte centrée (h/v) grâce à place-self + grid-area */
        .login-card{
          grid-area: card;
          z-index: 2;
          place-self: center;
          width: min(92vw, 520px);
          background: #fff;
          border-radius: 14px;
          padding: 22px;
          margin: 24px 0 40px;
          box-shadow: 0 8px 30px rgba(0,0,0,.22);
          border: 1px solid rgba(0,0,0,.08);
        }
        .card-title{ font-size: 22px; font-weight: 700; margin-bottom: 10px; color:#1e1e1e; }

        .form-grid{ display:flex; flex-direction:column; gap:12px; }
        .form-row{ display:flex; flex-direction:column; gap:6px; }
        .form-row.btns{ flex-direction:row; flex-wrap:wrap; gap:10px; }

        label{ color:#2a2a2a; font-weight:600; }
        input{
          border:1px solid var(--border); border-radius:10px;
          padding:10px 12px; outline:none; font-size:15px;
        }
        input:focus{ border-color: var(--green); box-shadow: 0 0 0 3px rgba(44,61,56,0.12); }

        .btn{
          background:var(--green); color:#fff; border:none;
          padding:10px 16px; border-radius:12px; cursor:pointer; font-weight:700;
        }
        .btn:disabled{ opacity:.6; cursor:not-allowed; }
        .btn-outline{
          background:#fff; color:var(--ink);
          border:1px solid var(--border); border-radius:12px;
          padding:10px 14px; cursor:pointer;
        }

        .alert{ padding:10px 12px; border-radius:10px; margin-bottom:8px; }
        .alert.error{ background:#fee2e2; color:#991b1b; }
        .alert.success{ background:#e7f9ee; color:#166534; }
      `}</style>
    </>
  )
}

function LockIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )
}
