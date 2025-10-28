import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function ResetPassword() {
  const [phase, setPhase] = useState('init') // init | ready | done | error
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [resendEmail, setResendEmail] = useState(() => {
    try { return localStorage.getItem('lastResetEmail') || '' } catch { return '' }
  })
  const [busy, setBusy] = useState(false)

  // Si Supabase nous renvoie un hash d’erreur (#error=...), affichons un message propre
  useEffect(() => {
    const hash = window.location.hash || ''
    if (!hash) return
    const p = new URLSearchParams(hash.replace(/^#/, ''))
    const code = p.get('error_code')
    if (code) {
      setPhase('error')
      setError(code === 'otp_expired'
        ? "Le lien a déjà été utilisé (souvent par un scanner d’emails) ou a expiré. Renvoyez un nouveau lien."
        : "Lien invalide. Renvoyez un nouveau lien."
      )
    }
    // Nettoyer l’URL
    history.replaceState(null, '', window.location.pathname)
  }, [])

  // Sinon, essayons d’entrer dans la session "recovery" (quand le lien est valide)
  useEffect(() => {
    if (phase !== 'init') return
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session) {
          setPhase('ready')
          return
        }
        // Attendre un évènement (PASSWORD_RECOVERY / SIGNED_IN)
        const { data } = supabase.auth.onAuthStateChange((event, s) => {
          if (!mounted) return
          if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && s) {
            setPhase('ready')
          }
        })
        // garde-fou 12s : si rien ne vient, on bascule en erreur
        setTimeout(() => { if (mounted && phase === 'init') { setPhase('error'); setError("Lien de réinitialisation non reconnu. Renvoyez un nouveau lien.") } }, 12000)
        return () => data?.subscription?.unsubscribe?.()
      } catch {
        if (mounted) { setPhase('error'); setError("Lien de réinitialisation non reconnu. Renvoyez un nouveau lien.") }
      }
    })()
    return () => { mounted = false }
  }, [phase])

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

  async function resendLink() {
    setError(''); setInfo(''); setBusy(true)
    if (!resendEmail) { setBusy(false); return setError("Saisissez votre email puis renvoyez le lien.") }
    const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
      redirectTo: `${window.location.origin}/reset`
    })
    setBusy(false)
    if (error) setError(error.message)
    else setInfo('Nouveau lien envoyé. Ouvrez-le depuis votre navigateur (copier/coller si besoin).')
  }

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

        <div style={{display:'grid', gap:12, maxWidth:420, marginTop:16}}>
          <label>Email pour renvoyer le lien</label>
          <input
            type="email"
            value={resendEmail}
            onChange={e=>setResendEmail(e.target.value)}
            placeholder="vous@exemple.com"
          />
          <button className="btn" onClick={resendLink} disabled={busy}>
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
