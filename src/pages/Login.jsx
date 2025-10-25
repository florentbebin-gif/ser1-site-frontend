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
    <div className="login-wrapper">
      {/* Fond image */}
      <div className="login-hero">
        {/* voile vert 30% */}
        <div className="login-overlay" />

        {/* badge version */}
        <div className="login-meta">
          <span className="meta-chip">
            <LockIcon/> Version {versionIR}
          </span>
        </div>

        {/* Bloc titre centré à gauche */}
        <div className="login-left">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>

        {/* Bloc connexion parfaitement centré */}
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

      {/* Styles */}
      <style>{`
        :root{
          --green:#2C3D38;
          --beige:#e8ded5;
          --ink:#222;
          --border:#D9D9D9;
        }

        /* Supprime les marges par défaut du layout */
        .login-wrapper{
          width:100vw;
          height:100vh;
          padding:0;
          margin:0;
        }

        .login-hero{
          position:relative;
          width:100%;
          height:100%;
          background-image:url('/login-bg.jpg');
          background-size:cover;
          background-position:center;
          display:flex;
          justify-content:center;
          align-items:center;
        }

        .login-overlay{
          position:absolute; inset:0;
          background:rgba(44,61,56,0.30); /* voile vert 30% */
        }

        .login-left{
          position:absolute;
          top:22vh;
          left:8vw;
          z-index:2;
          color:#fff;
          text-shadow:0 2px 4px rgba(0,0,0,.25);
        }

        .login-brand{
          font-size:64px; font-weight:800;
          border-bottom:4px solid var(--beige);
          margin-bottom:6px;
        }
        .login-sub{
          font-size:28px; font-weight:600;
        }

        .login-meta{
          position:absolute; top:20px; left:20px; z-index:2;
        }
        .meta-chip{
          background:rgba(255,255,255,.25);
          color:white;
          padding:8px 12px;
          border-radius:18px;
          display:inline-flex;
          align-items:center;
          font-size:14px;
          gap:6px;
        }

        /* Carte centrée */
        .login-card{
          position:relative;
          z-index:3;
          width:min(92vw,460px);
          background:#fff;
          border-radius:14px;
          padding:26px 22px;
          box-shadow:0 8px 30px rgba(0,0,0,.22);
        }

        .card-title{ font-weight:700; font-size:22px; margin-bottom:14px; }

        .form-grid{ display:flex; flex-direction:column; gap:12px; }
        .form-row{ display:flex; flex-direction:column; gap:6px; }
        .btns{ flex-direction:row; flex-wrap:wrap; gap:10px; }

        input{
          padding:10px 12px;
          font-size:15px;
          border:1px solid var(--border);
          border-radius:10px;
        }

        .btn{
          background:var(--green); color:white;
          padding:10px 16px;
          border-radius:12px; border:none; cursor:pointer;
        }
        .btn-outline{
          padding:10px 14px;
          border-radius:12px;
          background:white;
          border:1px solid var(--border);
          cursor:pointer;
        }

        .alert{ padding:10px; border-radius:10px; margin-bottom:6px;}
        .alert.error{background:#fee2e2;color:#991b1b;}
        .alert.success{background:#e7f9ee;color:#166534;}
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
