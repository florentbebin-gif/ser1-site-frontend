import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Login(){
  // --- états communs ---
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [info, setInfo]             = useState('')
  const inFlight                    = useRef(false)

  // --- états récupération ---
  const [isRecovery, setIsRecovery] = useState(false)
  const [newPwd, setNewPwd]         = useState('')
  const [newPwd2, setNewPwd2]       = useState('')
  const [recoBusy, setRecoBusy]     = useState(false)
  const [recoDebug, setRecoDebug]   = useState('')

  const addDbg = (l) => setRecoDebug(prev => (prev ? prev + '\n' : '') + l)

  // Au montage : détecte un retour de Supabase avec jetons dans le hash
  useEffect(() => {
    const raw = (window.location.hash || '').replace(/^#/, '')
    if (!raw) return
    const p = new URLSearchParams(raw)

    // erreurs explicites
    const err = p.get('error_code') || p.get('error')
    if (err) {
      setError(err === 'otp_expired'
        ? "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."
        : "Lien de réinitialisation invalide."
      )
      history.replaceState(null, '', window.location.pathname)
      return
    }

    const access  = p.get('access_token')
    // Certains navigateurs/clients transforment '+' en espace lors d'un collage manuel
    let refresh = p.get('refresh_token') || ''
    if (refresh.includes(' ')) refresh = refresh.replace(/ /g, '+')
    addDbg(`hash=${raw}`)

  const type = p.get('type')
    if (type === 'recovery' && access && refresh) {
      // On se met en mode recovery et on pose la session pour autoriser updateUser
      ;(async () => {
        try {
          const u = await supabase.auth.getUser(access)
          if (u.error) addDbg(`getUser(access) ERROR: ${u.error.message}`)
          else addDbg(`getUser(access) OK user.id=${u.data?.user?.id || 'unknown'}`)

          const { data, error } = await supabase.auth.setSession({
            access_token: access,
            refresh_token: refresh,
          })
          if (error) {
            addDbg(`setSession ERROR: ${error.message}`)
            setError("Impossible d'initialiser la session de réinitialisation.")
            return
          }
          addDbg(`setSession OK: has session=${!!data?.session}`)

          const after = await supabase.auth.getSession()
          addDbg(`getSession() after setSession: has session=${!!after.data?.session}`)
          if (!after.data?.session) {
            setError("La session n'a pas pu être enregistrée. Rouvrez le lien.")
            return
          }

          setIsRecovery(true)
          // On nettoie l’URL pour éviter de garder les tokens
          // Nettoie l'URL (hash) sans perdre la page courante
          try {
            const clean = window.location.pathname + window.location.search
            window.history.replaceState(null, '', clean)
          } catch {}
          
        } catch (e) {
          addDbg(`TRY/CATCH recovery: ${e?.message || e}`)
          setError("Erreur pendant l'initialisation de la réinitialisation.")
        }
      })()
    }
  }, [])

  // Connexion classique
  async function onSubmit(e){
    e.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setError(''); setInfo(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.assign('/') // navigation dure vers les tuiles
    } catch (e) {
      setError(e?.message || "Impossible de se connecter. Réessayez.")
    } finally {
      setLoading(false)
      inFlight.current = false
    }
  }

  // Envoi du mail de reset → redirige vers /reset
  async function sendReset(e){
    e.preventDefault()
    if (!email) return setError("Saisissez votre email.")
    setError(''); setInfo(''); setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
      })
      if (error) throw error
      try { localStorage.setItem('lastResetEmail', email) } catch {}
      setInfo('Si ce compte existe, un email vient d’être envoyé. Vérifiez vos emails.')
    } catch (e) {
      setError(e?.message || "Échec de l’envoi du lien.")
    } finally {
      setLoading(false)
    }
  }

  // Validation du nouveau mot de passe (mode recovery)
  async function submitNewPwd(e){
    e.preventDefault()
    setError(''); setRecoBusy(true)
    if (newPwd.length < 8) { setRecoBusy(false); return setError('Au moins 8 caractères.') }
    if (newPwd !== newPwd2) { setRecoBusy(false); return setError('Les deux mots de passe ne correspondent pas.') }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setRecoBusy(false)
    if (error) return setError(error.message)

    // Succès → on revient sur les tuiles
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
          {error && !isRecovery && <div className="alert error">{error}</div>}
          {info && !isRecovery && <div className="alert success">{info}</div>}

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

      {/* --- Box de RÉINITIALISATION (s’affiche uniquement en mode recovery) --- */}
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

            {/* Debug repli — optionnel. Laisse-le qq jours pour vérifier */}
            {recoDebug && (
              <pre style={{marginTop:12, background:'#f6f6f6', padding:12, borderRadius:8, fontSize:12, whiteSpace:'pre-wrap'}}>
                {recoDebug}
              </pre>
            )}
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

        /* Box recovery en dessous, centrée */
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
