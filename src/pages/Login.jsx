import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Nettoie un éventuel hash d'erreur (#error=...) et affiche un message clair
  useEffect(() => {
    const hash = window.location.hash || ''
    if (!hash) return
    const p = new URLSearchParams(hash.replace(/^#/, ''))
    const code = p.get('error_code')
    if (code) {
      setError(code === 'otp_expired'
        ? "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."
        : "Une erreur d’authentification est survenue. Veuillez réessayer."
      )
    }
    history.replaceState(null, '', window.location.pathname)
  }, [])

  // Dès qu'une session apparaît (login / magic link / reset) → HARD redirect vers /
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted && session) window.location.replace('/')
    })()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) window.location.replace('/')
    })
    return () => { data?.subscription?.unsubscribe?.(); mounted = false }
  }, [])

  async function onSubmit(e){
    e.preventDefault()
    setLoading(true); setError(''); setInfo('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else window.location.replace('/') // redémarre proprement l’app
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

  return (
    <div className="login-root">
      {/* Fond plein écran sous/derrière la topbar */}
      <div className="login-bg" aria-hidden="true" />
      <div className="login-overlay" aria-hidden="true" />

      <div className="login-rail">
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
              <button type="button" className="btn-outline" onClick={sendMagicLink} disabled={loading || !email}>
                Lien magique
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Styles locaux : fond recouvre TOUT, y compris sous la topbar */}
      <style>{`
        :root{
          --green:#2C3D38;
          --beige:#e8ded5;
          --ink:#222;
          --border:#D9D9D9;
        }

        /* La topbar passe au-dessus, le fond passe dessous (=> aucune bande blanche) */
        .topbar{ position: relative; z-index: 10; }

        .login-root{
          position: relative;
          width: 100%;
          min-height: 100vh; /* recouvre toute la page */
        }

        /* Fond image plein écran, derrière la topbar */
        .login-bg{
          position: fixed;
          inset: 0;
          z-index: 0;                 /* DERRIÈRE la topbar */
          background-image: url('/login-bg.jpg');
          background-size: cover;
          background-position: center;
        }
        .login-overlay{
          position: fixed;
          inset: 0;
          z-index: 1;                 /* toujours derrière la topbar (z-index 10) */
          background: rgba(44,61,56,0.30);
          pointer-events: none;
        }

        /* Rail de contenu */
        .login-rail{
          position: relative;
          z-index: 11;                /* au-dessus du fond, en-dessous/topbar ok */
          display: grid;
          grid-template-columns: 1fr;
          justify-items: center;
          align-items: center;
          padding: 72px 16px 48px;    /* marge visuelle */
        }

        .login-title{
          position: absolute;
          left: 4vw;
          top: 18vh;
          color: #fff;
          text-shadow: 0 2px 4px rgba(0,0,0,.25);
          max-width: min(680px, 60vw);
        }
        @media (max-width: 768px){
          .login-title{ left: 20px; top: 14vh; max-width: 86vw; }
        }

        .login-brand{
          font-size: 64px; font-weight: 800; line-height: 1; margin: 0 0 8px 0;
          border-bottom: 4px solid var(--beige); display: inline-block; padding-bottom: 6px;
        }
        @media (max-width: 640px){ .login-brand{ font-size: 46px; } }
        .login-sub{ font-size: 28px; font-weight: 600; }

        .login-card{
          width: min(92vw, 520px);
          background: #fff; border-radius: 14px; padding: 22px;
          box-shadow: 0 8px 30px rgba(0,0,0,.22);
          border: 1px solid rgba(0,0,0,.08);
          margin-top: 22vh; /* positionne la carte sous la topbar + titre */
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
    </div>
  )
}
