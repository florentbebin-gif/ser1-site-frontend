import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Login(){
  // --- Connexion classique ---
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')
  const inFlight                = useRef(false)

  // --- Réinitialisation (mode recovery déclenché par Supabase) ---
  const [isRecovery, setIsRecovery] = useState(false)
  const [newPwd, setNewPwd]   = useState('')
  const [newPwd2, setNewPwd2] = useState('')
  const [recoBusy, setRecoBusy] = useState(false)

  // 1) Laisse Supabase parser le hash et déclencher PASSWORD_RECOVERY
  useEffect(() => {
    let mounted = true

    // Affiche une erreur si Supabase a renvoyé un code d’erreur dans le hash
    const raw = (window.location.hash || '').replace(/^#/, '')
    if (raw) {
      const p = new URLSearchParams(raw)
      const err = p.get('error_code') || p.get('error')
      if (err) {
        setError(err === 'otp_expired'
          ? "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."
          : "Lien de réinitialisation invalide."
        )
        // On laisse quand même le SDK traiter le hash pour créer la session si possible
      }
    }

    // Ecoute des changements d’état d’auth
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      // Quand l’utilisateur clique le lien de reset, le SDK :
      // 1) lit le hash
      // 2) pose la session dans sessionStorage
      // 3) déclenche PASSWORD_RECOVERY
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
      }

      // Si on est connecté “normalement” (hors recovery), on va aux tuiles
      if (event === 'SIGNED_IN' && !isRecovery) {
        window.location.assign('/')
      }
    })

    // Si on arrive sur /login déjà connecté (ex: retour manuel)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session && !isRecovery) {
        // Si la session provient du lien de recovery, l’event ci-dessus passera isRecovery à true
        // Sinon on redirige vers /
        window.location.assign('/')
      }
    })

    return () => { mounted = false; sub?.subscription?.unsubscribe?.() }
  }, [isRecovery])

  // 2) Connexion classique
  async function onSubmit(e){
    e.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setError(''); setInfo(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.assign('/') // redirection tuiles
    } catch (e) {
      setError(e?.message || "Impossible de se connecter. Réessayez.")
    } finally {
      setLoading(false)
      inFlight.current = false
    }
  }

  // 3) Envoi du mail de reset (redirige vers /login)
  async function sendReset(e){
    e.preventDefault()
    if (!email) return setError("Saisissez votre email.")
    setError(''); setInfo(''); setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
      })
      if (error) throw error
      try { localStorage.setItem('lastResetEmail', email) } catch {}
      setInfo('Lien de réinitialisation envoyé. Ouvrez l’email et cliquez sur le lien.')
    } catch (e) {
      setError(e?.message || "Échec de l’envoi du lien.")
    } finally {
      setLoading(false)
    }
  }

  // 4) Validation du nouveau mot de passe (mode recovery)
  async function submitNewPwd(e){
    e.preventDefault()
    setError(''); setRecoBusy(true)
    if (newPwd.length < 8) { setRecoBusy(false); return setError('Au moins 8 caractères.') }
    if (newPwd !== newPwd2) { setRecoBusy(false); return setError('Les deux mots de passe ne correspondent pas.') }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setRecoBusy(false)
    if (error) return setError(error.message)

    // Succès → on va sur les tuiles
    window.location.assign('/')
  }

  return (
    <div className="login-root">
      <div className="login-bg" aria-hidden="true" />
      <div className="login-overlay" aria-hidden="true" />

      <div className="login-grid">
        {/* Bloc titre gauche */}
        <div className="login-title">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>

        {/* Bloc connexion */}
        <div className="login-card">
          <div className="card-title">Connexion</div>
          {!isRecovery && error && <div className="alert error">{error}</div>}
          {!isRecovery && info && <div className="alert success">{info}</div>}

          <form onSubmit={onSubmit} className="form-grid" style={{opacity: isRecovery ? .35 : 1, pointerEvents: isRecovery ? 'none' : 'auto'}}>
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

      {/* --- Box de RÉINITIALISATION (affichée uniquement en mode recovery) --- */}
      {isRecovery && (
        <div className="login-recovery">
          <div className="login-card">
            <div className="card-title">Réinitialisation du mot de passe</div>
            {error && <div className="alert error">{error}</div>}

            <form onSubmit={submitNewPwd} className="form-grid">
              <div className="form-row">
                <label>Nouveau mot de passe</label>
                <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>Confirmer le mot de passe</label>
                <input type="password" value={newPwd2} onChange={e=>setNewPwd2(e.target.value)} required />
              </div>
              <div className="form-row btns">
                <button className="btn" disabled={recoBusy}>
                  {recoBusy ? 'Validation…' : 'Valider'}
                </button>
                <a className="btn-outline" href="/login">Annuler</a>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        :root{ --green:#2C3D38; --beige:#e8ded5; --ink:#222; --border:#D9D9D9; }
        .topbar { display: none !important; }
        .login-root{ position:relative; width:100%; min-height:100vh; overflow:hidden; }
        .login-bg{ position:fixed; inset:0; z-index:0; background-image:url('/login-bg.jpg'); background-size:cover; background-position:center; }
        .login-overlay{ position:fixed; inset:0; z-index:1; background:rgba(44,61,56,0.30); pointer-events:none; }
        .login-grid{ position:relative; z-index:2; display:grid; grid-template-columns:1.2fr 0.8fr; gap:40px; align-items:center; padding:96px 48px; }
        @media (max-width:1024px){ .login-grid{ grid-template-columns:1fr; padding:88px 20px; row-gap:28px; } }
        .login-title{ color:#fff; text-shadow:0 2px 4px rgba(0,0,0,.25); max-width:800px; }
        .login-brand{ font-size:72px; font-weight:800; line-height:1.05; margin:0 0 10px 0; border-bottom:5px solid var(--beige); display:inline-block; padding-bottom:8px; }
        .login-sub{ font-size:32px; font-weight:600; }
        @media (max-width:640px){ .login-brand{ font-size:48px; border-bottom-width:4px; } .login-sub{ font-size:22px; } }
        .login-card{ width:min(92vw,560px); background:#fff; border-radius:14px; padding:22px; box-shadow:0 8px 30px rgba(0,0,0,.22); border:1px solid rgba(0,0,0,.08); justify-self:center; }
        .card-title{ font-size:22px; font-weight:700; margin-bottom:10px; color:#1e1e1e; }
        .form-grid{ display:flex; flex-direction:column; gap:12px; }
        .form-row{ display:flex; flex-direction:column; gap:6px; }
        .form-row.btns{ flex-direction:row; flex-wrap:wrap; gap:10px; }
        label{ color:#2a2a2a; font-weight:600; }
        input{ border:1px solid var(--border); border-radius:10px; padding:10px 12px; outline:none; font-size:15px; }
        input:focus{ border-color:var(--green); box-shadow:0 0 0 3px rgba(44,61,56,0.12); }
        .btn{ background:var(--green); color:#fff; border:none; padding:10px 16px; border-radius:12px; cursor:pointer; font-weight:700; }
        .btn:disabled{ opacity:.6; cursor:not-allowed; }
        .btn-outline{ background:#fff; color:#111; border:1px solid var(--border); border-radius:12px; padding:10px 14px; cursor:pointer; }

        /* Box recovery sous la box de login */
        .login-recovery{
          position:relative; z-index:2;
          display:flex; justify-content:center;
          margin: -12px 0 24px;
          padding: 0 48px;
        }
        @media (max-width:1024px){ .login-recovery{ padding: 0 20px; } }
      `}</style>
    </div>
  )
}
