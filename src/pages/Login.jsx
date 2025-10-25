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
    <div className="login-fullbleed">
      {/* fond plein écran */}
      <div className="login-hero">
        {/* voile vert 30% */}
        <div className="login-overlay" />

        {/* bandeau infos (on garde uniquement Version) */}
        <div className="login-meta">
          <span className="meta-chip">
            <LockIcon/> Version {versionIR}
          </span>
        </div>

        {/* Bloc titre repositionné plus haut */}
        <div className="login-left">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>

        {/* Carte de connexion */}
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

      {/* styles locaux */}
      <style>{`
        :root{
          --green:#2C3D38;
          --beige:#e8ded5;
          --ink:#222;
          --muted:#98a3a0;
          --border:#D9D9D9;
        }

        /* 🟢 sort de la largeur limitée de .container (full-bleed) */
        .login-fullbleed{
          width:100vw;
          margin-left:calc(50% - 50vw);
        }

        .login-hero{
          position:relative;
          min-height:100vh;
          width:100%;
          background-image:url('/login-hero.avif'); /* << nouvelle image */
          background-size:cover;
          background-position:center;
          display:grid;
          grid-template-columns: 1fr;
          place-items:center;
        }
        @media(min-width:1100px){
          .login-hero{
            grid-template-columns: 1fr 520px; /* zone gauche + carte */
            column-gap: 40px;
            align-items:center;
            padding: 40px 60px;
          }
        }

        .login-overlay{
          position:absolute; inset:0;
          background:rgba(44,61,56,0.30); /* vert 30% */
        }

        .login-meta{
          position:absolute; top:20px; left:20px; z-index:2;
          display:flex; gap:12px; flex-wrap:wrap;
        }
        .meta-chip{
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(255,255,255,0.18);
          color:#fff; padding:8px 12px; border-radius:16px;
          backdrop-filter: blur(2px);
          font-size:14px;
        }

        /* Bloc titre placé plus haut (≈ 18vh du haut) */
        .login-left{
          position:absolute; z-index:2; left:60px; top:18vh; color:#fff;
          max-width:min(680px, 60vw);
        }
        @media(max-width:1099px){ .login-left{ left:24px; top:14vh; } }

        .login-brand{
          font-size:64px; line-height:1.0; margin:0 0 8px 0; font-weight:800;
          border-bottom:4px solid var(--beige); display:inline-block; padding-bottom:6px;
        }
        @media(max-width:640px){ .login-brand{ font-size:46px; } }
        .login-sub{ font-size:28px; font-weight:600; opacity:.95; }
        @media(max-width:640px){ .login-sub{ font-size:22px; } }

        .login-card{
          position:relative; z-index:3;
          width:min(92vw,520px);
          background:#fff; border-radius:14px; padding:22px 22px 18px;
          box-shadow: 0 8px 30px rgba(0,0,0,.18);
          border: 1px solid rgba(0,0,0,.06);
          margin: 80px 0 60px; /* un peu d'air */
        }
        .card-title{ font-size:22px; font-weight:700; margin-bottom:10px; color:#1e1e1e; }

        .form-grid{ display:flex; flex-direction:column; gap:12px; }
        .form-row{ display:flex; flex-direction:column; gap:6px; }
        .form-row.btns{ flex-direction:row; flex-wrap:wrap; align-items:center; gap:10px; margin-top:6px; }

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
        .btn-outline:disabled{ opacity:.6; cursor:not-allowed; }

        .alert{ padding:10px 12px; border-radius:10px; margin-bottom:8px; }
        .alert.error{ background:#fee2e2; color:#991b1b; }
        .alert.success{ background:#e7f9ee; color:#166534; }
      `}</style>
    </div>
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
