import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function ResetPassword() {
  const [phase, setPhase] = useState('init') // init | ready | done | error
  const [dbg, setDbg] = useState('')         // petite zone debug visible si erreur
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const hashStr = (window.location.hash || '').replace(/^#/, '')
        const hash = new URLSearchParams(hashStr)

        // log de ce qu'on reçoit (s’affichera en cas d’erreur)
        setDbg(`hash=${hashStr}`)

        const errCode = hash.get('error_code') || hash.get('error')
        if (errCode) {
          if (cancelled) return
          setPhase('error')
          setError(
            errCode === 'otp_expired'
              ? "Le lien a expiré ou a déjà été utilisé. Renvoyez un nouveau lien."
              : "Lien de réinitialisation invalide."
          )
          return
        }

        const access = hash.get('access_token')
        const refresh = hash.get('refresh_token')

        if (!access || !refresh) {
          if (cancelled) return
          setPhase('error')
          setError("Jetons absents dans l’URL. Rouvrez le lien depuis l’email.")
          return
        }

        // on garde les valeurs localement et on nettoie l’URL APRÈS setSession
        try {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: access,
            refresh_token: refresh,
          })
          if (setErr) throw setErr
        } catch (e) {
          if (cancelled) return
          setPhase('error')
          setError("Impossible d'initialiser la session de réinitialisation.")
          setDbg(prev => prev + `\nsetSession error: ${e?.message || e}`)
          return
        }

        if (cancelled) return
        // on enlève le hash pour éviter de le garder en historique
        try { history.replaceState(null, '', window.location.pathname) } catch {}
        setPhase('ready')
      } catch (e) {
        if (cancelled) return
        setPhase('error')
        setError("Erreur inattendue pendant l'initialisation.")
        setDbg(prev => prev + `\nunexpected: ${e?.message || e}`)
      }
    }

    boot()
    return () => { cancelled = true }
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    if (password.length < 8) { setBusy(false); return setError('Au moins 8 caractères.') }
    if (password !== confirm) { setBusy(false); return setError('Les mots de passe ne correspondent pas.') }

    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)

    setPhase('done')
    setTimeout(() => window.location.replace('/'), 900)
  }

  // ===== UI =====

  if (phase === 'init') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div>Initialisation…</div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#b00020', marginTop:12}}>{error}</div>
        {dbg && (
          <pre style={{
            marginTop:12, background:'#f6f6f6', padding:12, borderRadius:8,
            whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:12, color:'#444'
          }}>{dbg}</pre>
        )}
        <div style={{marginTop:16}}>
          <a className="btn" href="/login">Retour à la connexion</a>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#166534', marginTop:12}}>Mot de passe mis à jour. Redirection…</div>
      </div>
    )
  }

  // phase === 'ready' → formulaire
  return (
    <div className="panel">
      <h2>Réinitialisation du mot de passe</h2>
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
