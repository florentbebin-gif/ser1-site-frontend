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
    <div className="login-hero">
      {/* voile vert 30% */}
      <div className="login-overlay" />

      {/* bandeau infos haut-gauche */}
      <div className="login-meta">
        <span className="meta-chip">
          <LockIcon/> Version {versionIR}
        </span>
        <span className="meta-chip muted">
          Fin de validité : 01/01/2026
        </span>
      </div>

      {/* bloc titre gauche */}
      <div className="login-left">
        <h1 className="login-brand">SER1</h1>
        <div className="login-sub">Simulateur épargne retraite</div>
        <div className="login-small">Version IRPS <span className="muted">v20250516</span></div>
      </div>

      {/* carte centrale avec le formulaire */}
      <div className="login-center">
        <DoorIcon/>
        <div className="cta-legend">Accéder à l’outil</div>
        <div className="cta-line" />
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
            <button type="button" className="btn-outline" onClick={sendMagicLink} disabled={loading || !email}>
              Lien magique
            </button>
          </div>
        </form>
      </div>

      {/* styles locaux spécifiques à la page login */}
      <style>{`
        :root{
          --green:#2C3D38;
          --beige:#e8ded5;
          --ink:#222;
          --muted:#98a3a0;
          --border:#D9D9D9;
          --bg:#f7f7f7;
        }

        .login-hero{
          position:relative;
          min-height:100vh;
          width:100%;
          background-image:url('/login-bg.jpg');
          background-size:cover;
          background-position:center;
          display:grid;
          grid-template-columns: 1fr;
          place-items:center;
        }
        /* grand écran: titre à gauche, carte au centre, comme ta maquette */
        @media(min-width:1100px){
          .login-hero{
            grid-template-columns: 1fr 520px;
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
        .meta-chip.muted{ opacity:.85; }

        .login-left{
          position:relative; z-index:2; justify-self:start; color:#fff;
          padding: 0 24px;
        }
        @media(min-width:1100px){ .login-left{ justify-self:stretch; } }

        .login-brand{
          font-size:64px; line-height:1.0; margin:0 0 8px 0; font-weight:800;
          border-bottom:4px solid var(--beige); display:inline-block; padding-bottom:6px;
        }
        .login-sub{ font-size:28px; font-weight:600; opacity:.95; }
        .login-small{ margin-top:8px; font-size:14px; opacity:.9; }

        .login-center{
          position:absolute; z-index:2; top:50%; left:50%;
          transform: translate(-50%,-50%);
          display:flex; flex-direction:column; align-items:center;
          color:#fff; text-align:center; pointer-events:none;
        }
        @media(min-width:1100px){
          .login-center{ left: calc(50% - 200px); } /* un léger décalage comme la maquette */
        }
        .cta-legend{ margin-top:10px; font-weight:700; }
        .cta-line{ width:180px; height:4px; background:var(--beige); margin-top:8px; border-radius:2px; }

        .login-card{
          position:relative; z-index:3;
          width:min(92vw,520px);
          background:#fff; border-radius:14px; padding:22px 22px 18px;
          box-shadow: 0 8px 30px rgba(0,0,0,.18);
          border: 1px solid rgba(0,0,0,.06);
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

/* petites icônes svg intégrées */
function LockIcon(){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )
}
function DoorIcon(){
  return (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
      <path d="M4 21V3a1 1 0 0 1 1-1h9l6 6v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" opacity=".9"/>
      <path d="M14 2v5h5" opacity=".9"/>
      <circle cx="12.5" cy="12" r="0.8" fill="#fff" />
      <path d="M16 13h5" />
    </svg>
  )
}
