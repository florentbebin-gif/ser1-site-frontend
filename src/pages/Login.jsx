import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Login() {
  // Connexion
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')

  // Contrôle des redirections après logout
  const [blockAutoRedirect, setBlockAutoRedirect] = useState(false)
  const signedOutOnce = useRef(false)

  // Réinitialisation (recovery)
  const [recoMode, setRecoMode]       = useState(false)
  const [recoBusy, setRecoBusy]       = useState(false)
  const [recoSuccess, setRecoSuccess] = useState(false)
  const [newPwd, setNewPwd]           = useState('')
  const [newPwd2, setNewPwd2]         = useState('')

  // ?logout=1 => force signOut et bloque l’auto-redirect tant que la session n’est pas tombée
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('logout') === '1') {
      setBlockAutoRedirect(true)
      ;(async () => {
        try { await supabase.auth.signOut() } catch {}
        finally {
          signedOutOnce.current = true
          url.searchParams.delete('logout')
          window.history.replaceState(null, '', url.toString())
        }
      })()
    }
  }, [])

  // Nettoyage des erreurs possibles dans le hash (#error=…)
  useEffect(() => {
    const h = window.location.hash || ''
    if (!h) return
    const p = new URLSearchParams(h.replace(/^#/, ''))
    const code = p.get('error_code')
    if (code) {
      setError(code === 'otp_expired'
        ? "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."
        : "Une erreur d’authentification est survenue. Veuillez réessayer."
      )
    }
    history.replaceState(null, '', window.location.pathname)
  }, [])

  // Détection du mode recovery (présence du token dans le hash OU session déjà créée par Supabase)
  useEffect(() => {
    const h = window.location.hash || ''
    if (h.includes('access_token=') && h.includes('type=recovery')) {
      setRecoMode(true)
    }
    // Si le hash a été consommé, Supabase a déjà créé une session :
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user?.id && !recoMode && !h) {
        setRecoMode(true)
      }
    })
  }, []) // eslint-disable-line

  // Redirection auto si la session apparaît (sauf blocage post-logout)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session && !blockAutoRedirect && !recoMode) {
        window.location.replace('/')
      }
      if (!session && signedOutOnce.current) setBlockAutoRedirect(false)
    })()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return
      if (s && !blockAutoRedirect && !recoMode) {
        window.location.replace('/')
      } else {
        if (signedOutOnce.current) setBlockAutoRedirect(false)
      }
    })
    return () => { data?.subscription?.unsubscribe?.(); mounted = false }
  }, [blockAutoRedirect, recoMode])

  // Connexion
  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      // La redirection est gérée par l’écouteur de session
    } catch {
      setError("Impossible de se connecter. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  // Envoi du mail de réinit
  async function sendReset(e) {
    e.preventDefault()
    if (!email) return setError("Saisissez votre email.")
    setError(''); setInfo(''); setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`
      })
      if (error) setError(error.message)
      else setInfo('Lien de réinitialisation envoyé. Vérifiez vos emails.')
    } finally {
      setLoading(false)
    }
  }

  // Validation du nouveau mot de passe (recovery)
  async function submitNewPwd(e) {
    e.preventDefault()
    setError(''); setRecoBusy(true)

    if (newPwd.length < 8) {
      setRecoBusy(false)
      return setError('Au moins 8 caractères.')
    }
    if (newPwd !== newPwd2) {
      setRecoBusy(false)
      return setError('Les deux mots de passe ne correspondent pas.')
    }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) {
      setRecoBusy(false)
      return setError(error.message)
    }

    // Sécurise la session / rafraîchit
    const { data } = await supabase.auth.getSession()
    if (!data?.session) {
      setRecoBusy(false)
      return setError("La session n'a pas été reconnue. Fermez l’onglet puis reconnectez-vous.")
    }

    // Succès + redirection douce
    setRecoSuccess(true)
    setTimeout(() => window.location.assign('/'), 1200)
  }

  return (
    <div className="login-root">
      <div className="login-bg" aria-hidden="true" />
      <div className="login-overlay" aria-hidden="true" />

      <div className="login-grid">
        {/* Bloc titre */}
        <div className="login-title">
          <h1 className="login-brand">SER1</h1>
          <div className="login-sub">Simulateur épargne retraite</div>
        </div>

        {/* Carte Login */}
        <div className="login-card">
          <div className="card-title">Connexion</div>

          {error && !recoMode && <div className="alert error">{error}</div>}
          {info &&  !recoMode && <div className="alert success">{info}</div>}

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
              <button className="btn-outline" onClick={sendReset} disabled={loading || !email}>
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        </div>

        {/* Carte Recovery (réinitialisation) */}
        {recoMode && (
          <div className="login-recovery">
            <div className="login-card">
              <div className="card-title">Réinitialisation du mot de passe</div>

              {recoSuccess ? (
                <div className="alert success">
                  Mot de passe mis à jour. Redirection…
                </div>
              ) : (
                <>
                  {error && <div className="alert error">{error}</div>}

                  <form onSubmit={submitNewPwd} className="form-grid">
                    <div className="form-row">
                      <label>Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={newPwd}
                        onChange={e=>setNewPwd(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <label>Confirmer le mot de passe</label>
                      <input
                        type="password"
                        value={newPwd2}
                        onChange={e=>setNewPwd2(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>

                    <div className="form-row btns">
                      <button className="btn" type="submit" disabled={recoBusy}>
                        {recoBusy ? 'Validation…' : 'Valider'}
                      </button>
                      <a className="btn-outline" href="/login?logout=1">Annuler</a>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        :root{ --green:#2C3D38; --beige:#e8ded5; --ink:#222; --border:#D9D9D9; }
        .topbar { display: none !important; }

        .login-root{ position:relative; width:100%; min-height:100vh; overflow:hidden; }
        .login-bg{ position:fixed; inset:0; z-index:0; background-image:url('/login-bg.jpg'); background-size:cover; background-position:center; }
        .login-overlay{ position:fixed; inset:0; z-index:1; background:rgba(44,61,56,0.30); pointer-events:none; }

        .login-grid{
          position:relative; z-index:2;
          display:grid; grid-template-columns:1.2fr 0.8fr;
          gap:40px; align-items:center; padding:96px 48px;
        }
        @media (max-width:1024px){
          .login-grid{ grid-template-columns:1fr; padding:88px 20px; row-gap:28px; }
        }

        .login-title{ color:#fff; text-shadow:0 2px 4px rgba(0,0,0,.25); max-width:800px; }
        .login-brand{
          font-size:72px; font-weight:800; line-height:1.05; margin:0 0 10px 0;
          border-bottom:5px solid var(--beige); display:inline-block; padding-bottom:8px;
        }
        .login-sub{ font-size:32px; font-weight:600; }
        @media (max-width:640px){
          .login-brand{ font-size:48px; border-bottom-width:4px; }
          .login-sub{ font-size:22px; }
        }

        .login-card{
          width:min(92vw,560px);
          background:#fff; border-radius:14px; padding:22px;
          box-shadow:0 8px 30px rgba(0,0,0,.22);
          border:1px solid rgba(0,0,0,.08);
          justify-self:center;
        }

        /* Carte recovery alignée sous la carte login et légèrement remontée */
        .login-recovery{
          grid-column: 2 / 3;
          display:flex; justify-content:center;
          margin-top:-40px;          /* remonte la carte */
          padding-bottom:40px;
        }
        @media (max-width:1024px){
          .login-recovery{ grid-column: 1 / -1; margin-top:-20px; }
        }

        .card-title{ font-size:22px; font-weight:700; margin-bottom:10px; color:#1e1e1e; }

        .form-grid{ display:flex; flex-direction:column; gap:12px; }
        .form-row{ display:flex; flex-direction:column; gap:6px; }
        .form-row.btns{ flex-direction:row; flex-wrap:wrap; gap:10px; }

        label{ color:#2a2a2a; font-weight:600; }
        input{
          border:1px solid var(--border); border-radius:10px; padding:10px 12px;
          outline:none; font-size:15px;
        }
        input:focus{ border-color:var(--green); box-shadow:0 0 0 3px rgba(44,61,56,0.12); }

        .btn{
          background:var(--green); color:#fff; border:none; padding:10px 16px;
          border-radius:12px; cursor:pointer; font-weight:700;
        }
        .btn:disabled{ opacity:.6; cursor:not-allowed; }

        .btn-outline{
          background:#fff; color:var(--ink);
          border:1px solid var(--border); border-radius:12px;
          padding:10px 14px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center;
        }

        .alert{ padding:10px 12px; border-radius:10px; margin-bottom:8px; }
        .alert.error{ background:#fee2e2; color:#991b1b; }
        .alert.success{ background:#e7f9ee; color:#166534; }
      `}</style>
    </div>
  )
}
