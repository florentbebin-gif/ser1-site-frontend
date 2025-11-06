import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Login(){
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [info, setInfo]             = useState('')
  const inFlight                    = useRef(false)

  // Recovery / reset
  const [isRecovery, setIsRecovery] = useState(false)
  const [newPwd, setNewPwd]         = useState('')
  const [newPwd2, setNewPwd2]       = useState('')
  const [recoBusy, setRecoBusy]     = useState(false)
  const [recoDebug, setRecoDebug]   = useState('')

  const recoveryAccessRef  = useRef(null)     // access_token du lien pour fallback REST
  const gotAuthEventRef    = useRef(false)
  const closingRecoveryRef = useRef(false)    // garde: ignorer les events quand on ferme la box
  const authSubRef         = useRef(null)     // pour unsubscribe du listener
  const addDbg = (l) => setRecoDebug(prev => (prev ? prev + '\n' : '') + l)

  // --- parseur de hash qui préserve les "+" et supporte plusieurs "#"
  function parseHashPreservingPlus(rawHash) {
    const s0 = (rawHash || "").replace(/^#/, "")
    const s  = s0.replace(/#/g, "&")
    const out = {}
    if (!s) return out
    for (const pair of s.split("&")) {
      if (!pair) continue
      const eq = pair.indexOf("=")
      const k  = eq >= 0 ? pair.slice(0, eq) : pair
      const v  = eq >= 0 ? pair.slice(eq + 1) : ""
      out[decodeURIComponent(k)] = decodeURIComponent(v)
    }
    return out
  }

  // Active la réinitialisation SANS changer de page
  useEffect(() => {
    const rawHash = window.location.hash || ""
    if (!rawHash) return

    const p = parseHashPreservingPlus(rawHash)
    const err = p.error_code || p.error
    if (err) {
      setError(err === "otp_expired"
        ? "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien."
        : "Lien de réinitialisation invalide."
      )
      try { window.history.replaceState(null, "", window.location.pathname + window.location.search) } catch {}
      return
    }

    const type    = p.type
    const access  = p.access_token
    const refresh = p.refresh_token
    if (!(type === "recovery" && access && refresh)) return

    recoveryAccessRef.current = access

    // 1) on écoute les événements auth (plus fiable)
    const sub = supabase.auth.onAuthStateChange((evt) => {
      if (closingRecoveryRef.current) return
      if (evt === "PASSWORD_RECOVERY" || evt === "SIGNED_IN" || evt === "INITIAL_SESSION") {
        gotAuthEventRef.current = true
        setError("")
        setInfo("")
        setIsRecovery(true)
        try { window.history.replaceState(null, "", window.location.pathname + window.location.search) } catch {}
      }
    })
    authSubRef.current = sub?.data?.subscription

    // 2) on tente setSession avec timeout, sans bloquer l’UI
    const delay = (ms) => new Promise(res => setTimeout(res, ms))
    const withTimeout = (p, ms) =>
      Promise.race([p, delay(ms).then(()=>{ const e=new Error("timeout"); e._timeout=true; throw e })])

    ;(async () => {
      try {
        await withTimeout(supabase.auth.setSession({ access_token: access, refresh_token: refresh }), 3000)
        // l’event ouvrira la box
      } catch {
        const { data } = await withTimeout(supabase.auth.getSession(), 2000).catch(()=>({}))
        if (data?.session) {
          setIsRecovery(true)
        } else if (!gotAuthEventRef.current) {
          setError("Impossible d'initialiser la session de récupération. Renvoyez un nouveau lien.")
        }
      } finally {
        try { window.history.replaceState(null, "", window.location.pathname + window.location.search) } catch {}
      }
    })()

    return () => authSubRef.current?.unsubscribe?.()
  }, [])

  // Connexion classique (avec timeout + retry)
  async function onSubmit(e) {
    e.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setError(""); setInfo(""); setLoading(true)

    const delay = (ms) => new Promise(r => setTimeout(r, ms))
    const withTimeout = (p, ms, label) => Promise.race([
      p,
      delay(ms).then(() => { const e = new Error(`TIMEOUT:${label}`); e._timeout = true; throw e; })
    ])

    try {
      let r = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000,
        "signIn(1)"
      ).catch(e => e)

      if (r instanceof Error || r?.error) {
        await supabase.auth.signOut().catch(()=>{})
        await delay(400)
        r = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          8000,
          "signIn(2)"
        ).catch(e => e)
      }

      if (!(r instanceof Error) && !r?.error) {
        window.location.assign("/")
        return
      }

      setError(r instanceof Error ? (r?._timeout ? "Connexion trop lente, réessayez." : r.message) : (r?.error?.message || "Impossible de se connecter."))
    } catch {
      setError("Erreur inattendue lors de la connexion.")
    } finally {
      setLoading(false)
      inFlight.current = false
    }
  }

  // Envoi du mail de reset → redirige vers /login
  async function sendReset(e){
    e.preventDefault()
    if (!email) return setError("Saisissez votre email.")
    setError(''); setInfo(''); setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
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
    setError('')

    if (newPwd.length < 8) return setError("Au moins 8 caractères.")
    if (newPwd !== newPwd2) return setError("Les deux mots de passe ne correspondent pas.")

    setRecoBusy(true)

    const delay = (ms) => new Promise((res) => setTimeout(res, ms))
    const withTimeout = (p, ms, label) =>
      Promise.race([
        p,
        (async () => { await delay(ms); const err = new Error(`TIMEOUT:${label}:${ms}`); err._timeout = true; throw err })(),
      ])

    const closeBoxFast = () => {
      closingRecoveryRef.current = true
      setIsRecovery(false)
      setRecoBusy(false)
      setNewPwd(""); setNewPwd2("")
      setPassword("")
      setInfo("Mot de passe mis à jour. Merci de patienter…")
      supabase.auth.signOut().catch(()=>{})
      setTimeout(() => {
        authSubRef.current?.unsubscribe?.()
        closingRecoveryRef.current = false
        setInfo("Mot de passe mis à jour. Vous pouvez vous reconnecter.")
      }, 1200)
    }

    try {
      // 1) SDK direct
      const r1 = await withTimeout(supabase.auth.updateUser({ password: newPwd }), 6000, "updateUser(1)").catch(e => e)
      if (!(r1 instanceof Error) && !r1?.error) { closeBoxFast(); return }

      // 2) refresh + 2e essai SDK
      await withTimeout(supabase.auth.refreshSession(), 2500, "refreshSession").catch(()=>{})
      const r2 = await withTimeout(supabase.auth.updateUser({ password: newPwd }), 6000, "updateUser(2)").catch(e => e)
      if (!(r2 instanceof Error) && !r2?.error) { closeBoxFast(); return }

      // 3) Fallback REST
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
      const accessFromLink = recoveryAccessRef.current
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !accessFromLink) {
        setRecoBusy(false)
        return setError("Impossible de finaliser la réinitialisation (config manquante). Renvoyez un nouveau lien.")
      }

      const endpoints = [
        { method: "PUT",   url: `${SUPABASE_URL}/auth/v1/user` },
        { method: "PATCH", url: `${SUPABASE_URL}/auth/v1/user` },
      ]
      let restOk = false, restErr = null
      for (const ep of endpoints) {
        try {
          const resp = await withTimeout(fetch(ep.url, {
            method: ep.method,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessFromLink}`,
              "apikey": SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ password: newPwd }),
          }), 7000, `REST:${ep.method}`)
          if (!resp.ok) {
            const t = await resp.text().catch(()=> "")
            restErr = `HTTP ${resp.status} ${resp.statusText} :: ${t}`
            continue
          }
          restOk = true; break
        } catch (e3) {
          restErr = e3?._timeout ? "timeout" : (e3?.message || "fetch error")
        }
      }

      setRecoBusy(false)
      if (restOk) { closeBoxFast(); return }

      if (r2 instanceof Error && r2?._timeout) {
        return setError("La validation prend trop de temps. Vérifiez votre connexion ou désactivez temporairement les bloqueurs (adblock / cookies), puis réessayez.")
      }
      return setError((r2?.error?.message || restErr || "Impossible de mettre à jour le mot de passe."))
    } catch {
      setRecoBusy(false)
      return setError("Erreur inattendue lors de la mise à jour du mot de passe.")
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
          {error && !isRecovery && <div className="alert error">{error}</div>}
          {info  && !isRecovery && <div className="alert success">{info}</div>}

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
            {recoDebug && (
              <pre style={{marginTop:12, background:'#f6f6f6', padding:12, borderRadius:8, fontSize:12, whiteSpace:'pre-wrap'}}>
                {recoDebug}
              </pre>
            )}
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
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

        .login-recovery{
          position:relative; z-index:2;
          display:flex; justify-content:center;
          margin: -12px 0 24px;
          padding: 0 48px;
        }
        @media (max-width:1024px){ .login-recovery{ padding: 0 20px; } }
        `,
        }}
      />
    </div>
  )
}
