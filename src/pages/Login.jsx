import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [blockAutoRedirect, setBlockAutoRedirect] = useState(false)
  const signedOutOnce = useRef(false)
  const inFlight = useRef(false)
  const loadingTimer = useRef(null)

  // ?logout=1 -> force logout et empêche l’auto-redirect tant que la session n’est pas tombée
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

  // Nettoyage des erreurs (#error=…)
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

  // Redirection auto quand la session apparaît (sauf blocage post-logout)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session && !blockAutoRedirect) window.location.replace('/')
      if (!session && signedOutOnce.current) setBlockAutoRedirect(false)
    })()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return
      if (s) {
        if (!blockAutoRedirect) window.location.replace('/')
      } else {
        if (signedOutOnce.current) setBlockAutoRedirect(false)
      }
    })
    return () => { data?.subscription?.unsubscribe?.(); mounted = false }
  }, [blockAutoRedirect])

  function startLoadingSafely() {
    setLoading(true)
    clearTimeout(loadingTimer.current)
    loadingTimer.current = setTimeout(async () => {
      setLoading(false); inFlight.current = false
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !blockAutoRedirect) window.location.replace('/')
    }, 10000)
  }

  function stopLoadingSafely() {
    clearTimeout(loadingTimer.current)
    setLoading(false); inFlight.current = false
  }

  async function onSubmit(e){
    e.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setError(''); setInfo('')
    setBlockAutoRedirect(false)
    startLoadingSafely()

    supabase.auth.signInWithPassword({ email, password })
      .then(({ error }) => {
        if (error) { stopLoadingSafely(); setError(error.message) }
      })
      .catch(() => { stopLoadingSafely(); setError("Impossible de se connecter. Réessayez.") })
  }

  // ✅ Version corrigée (dans le composant, pas en bas !)
  async function sendReset(e){
    e.preventDefault()
    if (!email) return setError("Saisissez votre email.")
    setError(''); setInfo(''); setLoading(true)

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('lastResetEmail', email)
      }
    } catch {}

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
        .topbar { display: none !important; }
        .login-root{ position:relative; width:100%; min-height:100vh; overflow:hidden; }
        .login-bg{ position:fixed; inset:0; z-index:0; background-image:url('/login-bg.jpg'); background-size:cover; background-position:center; }
        .login-overlay{ position:fixed; inset:0; z-index:1; background:rgba(44,61,56,0.30); pointer-events:none; }
        .login-grid{ position:relative; z-index:2; display:grid; grid-template-columns:1.2fr 0.8fr; gap:40px; align-items:center; padding:96px 48px; }
      `}</style>
    </div>
  )
}
