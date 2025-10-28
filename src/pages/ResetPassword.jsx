import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function ResetPassword() {
  const [phase, setPhase] = useState('init') // init | need_email | ready | done | error
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('lastResetEmail') || '' } catch { return '' }
  })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const parseHash = () => new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
  const parseSearch = () => new URLSearchParams(window.location.search || '')

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const hash = parseHash()
        const search = parseSearch()

        // 0) Debug minimal dans la console (n'affecte pas l'UI)
        // eslint-disable-next-line no-console
        console.info('[RESET] hash=', hash.toString(), ' search=', search.toString())

        // A) Erreur explicite côté Supabase
        const errCode = hash.get('error_code') || search.get('error_code') || search.get('error')
        if (errCode) {
          if (cancelled) return
          setPhase('error')
          setError(
            errCode === 'otp_expired'
              ? "Le lien a expiré ou a déjà été utilisé. Renvoyez un nouveau lien."
              : "Lien de réinitialisation invalide."
          )
          history.replaceState(null, '', window.location.pathname)
          return
        }

        // B) Cas “normal” : jetons dans le hash
        const access = hash.get('access_token')
        const refresh = hash.get('refresh_token')
        if (access && refresh) {
          try {
            const { error: setErr } = await supabase.auth.setSession({
              access_token: access, refresh_token: refresh
            })
            if (setErr) throw setErr
            if (cancelled) return
            setPhase('ready')
          } catch (e) {
            if (cancelled) return
            setPhase('error')
            setError("Impossible d'initialiser la session de réinitialisation.")
          } finally {
            history.replaceState(null, '', window.location.pathname)
          }
          return
        }

        // C) Fallback : lien ?token=...&type=recovery (certains clients l'ouvrent tel quel)
        const token = search.get('token')
        const type = search.get('type')
        if (token && (type === 'recovery' || type === 'recovery_token')) {
          if (!email) {
            if (cancelled) return
            setPhase('need_email')
            return
          }
          setBusy(true)
          try {
            const { data, error: vErr } = await supabase.auth.verifyOtp({
              type: 'recovery', token, email
            })
            if (vErr) throw vErr
            if (cancelled) return
            if (data?.user) {
              setPhase('ready')
            } else {
              setPhase('error')
              setError("Le lien de réinitialisation n'a pas pu être vérifié.")
            }
          } catch (e) {
            if (cancelled) return
            setPhase('error')
            setError("Lien de réinitialisation non reconnu ou expiré. Renvoyez un nouveau lien.")
          } finally {
            setBusy(false)
            history.replaceState(null, '', window.location.pathname)
          }
          return
        }

        // D) Si rien de tout ça, on regarde si une session “recovery” existe déjà
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          if (cancelled) return
          setPhase('ready')
          history.replaceState(null, '', window.location.pathname)
          return
        }

        // E) Toujours rien -> afficher une erreur claire (jamais bloqué sur "init")
        if (cancelled) return
        setPhase('error')
        setError("Lien de réinitialisation non reconnu. Renvoyez un nouveau lien.")
      } catch (e) {
        if (cancelled) return
        setPhase('error')
        setError("Une erreur est survenue pendant l'initialisation du reset.")
      }
    }

    bootstrap()
    return () => { cancelled = true }
  }, []) // une seule fois

  async function resendLink() {
    if (!email) { setError("Saisissez votre email."); return }
    setBusy(true); setError(''); setInfo('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`
      })
      if (error) throw error
      try { localStorage.setItem('lastResetEmail', email) } catch {}
      setInfo('Nouveau lien envoyé. Ouvrez-le depuis votre boîte mail.')
    } catch (e) {
      setError(e?.message || "Échec de l'envoi du lien.")
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    if (password.length < 8) { setBusy(false); return setError('Le mot de passe doit contenir au moins 8 caractères.') }
    if (password !== confirm) { setBusy(false); return setError('Les deux mots de passe ne correspondent pas.') }

    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)

    setPhase('done')
    setInfo('Mot de passe mis à jour. Redirection…')
    setTimeout(() => window.location.replace('/'), 900)
  }

  // === UI ===
  if (phase === 'init') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div>Initialisation…</div>
      </div>
    )
  }

  if (phase === 'need_email') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <p>Veuillez saisir l’email utilisé lors de la demande pour valider le lien.</p>
        <div style={{display:'grid', gap:12, maxWidth:420, marginTop:12}}>
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" />
          <button className="btn" onClick={() => {
            try { localStorage.setItem('lastResetEmail', email) } catch {}
            window.location.reload()
          }} disabled={!email || busy}>{busy ? 'Patientez…' : 'Continuer'}</button>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#b00020', marginTop:12}}>{error}</div>
        <div style={{display:'grid', gap:12, maxWidth:420, marginTop:16}}>
          <label>Renvoyer le lien à</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" />
          <button className="btn" onClick={resendLink} disabled={busy || !email}>
            {busy ? 'Envoi…' : 'Renvoyer le lien'}
          </button>
          {info && <div style={{color:'#166534'}}>{info}</div>}
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#166534', marginTop:12}}>{info || 'Mot de passe mis à jour.'}</div>
      </div>
    )
  }

  // phase === 'ready'
  return (
    <div className="panel">
      <h2>Réinitialisation du mot de passe</h2>
      {error && <div style={{color:'#b00020', marginTop:12}}>{error}</div>}

      <form onSubmit={onSubmit} style={{display:'grid', gap:12, maxWidth:420, marginTop:12}}>
        <label>Nouveau mot de passe</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        <label>Confirmer le mot de passe</label>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />

        <button className="btn" disabled={busy}>{busy ? 'Validation…' : 'Valider'}</button>
      </form>
    </div>
  )
}
