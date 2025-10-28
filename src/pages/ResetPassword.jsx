import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function ResetPassword() {
  const [phase, setPhase] = useState('init') // init | need_email | ready | done | error
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('lastResetEmail') || '' } catch { return '' }
  })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [debugText, setDebugText] = useState('')

  const H = () => (window.location.hash || '').replace(/^#/, '')
  const S = () => (window.location.search || '').replace(/^\?/, '')

  useEffect(() => {
    let cancelled = false
    const failSafe = setTimeout(() => {
      // si on est encore en init au bout de 3s, on affiche au moins une erreur lisible
      if (!cancelled && phase === 'init') {
        setPhase('error')
        setError("Lien de réinitialisation non reconnu. Renvoyez un nouveau lien.")
      }
    }, 3000)

    async function run() {
      try {
        const hashStr = H()
        const searchStr = S()
        setDebugText(`href=${window.location.href}\n\nhash=${hashStr}\nsearch=${searchStr}`)

        const hash = new URLSearchParams(hashStr)
        const search = new URLSearchParams(searchStr)

        // 1) erreurs explicites
        const errCode =
          hash.get('error_code') || hash.get('error') ||
          search.get('error_code') || search.get('error')
        if (errCode) {
          if (cancelled) return
          setPhase('error')
          setError(errCode === 'otp_expired'
            ? "Le lien a expiré ou a déjà été utilisé. Renvoyez un nouveau lien."
            : "Lien de réinitialisation invalide.")
          return
        }

        // 2) lecture des jetons (hash OU query)
        const access =
          hash.get('access_token') || search.get('access_token')
        const refresh =
          hash.get('refresh_token') || search.get('refresh_token')

        if (access && refresh) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: access,
              refresh_token: refresh
            })
            if (error) throw error
            if (cancelled) return
            try { history.replaceState(null, '', window.location.pathname) } catch {}
            setPhase('ready')
          } catch (e) {
            if (cancelled) return
            setPhase('error')
            setError("Impossible d'initialiser la session de réinitialisation.")
            setDebugText(prev => prev + `\n\nsetSession error: ${e?.message || e}`)
          }
          return
        }

        // 3) fallback : ?token=&type=recovery (certaines messageries l’utilisent)
        const token = search.get('token')
        const type = search.get('type')
        if (token && (type === 'recovery' || type === 'recovery_token')) {
          if (!email) { setPhase('need_email'); return }
          setBusy(true)
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              type: 'recovery', token, email
            })
            if (error) throw error
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
            setDebugText(prev => prev + `\n\nverifyOtp error: ${e?.message || e}`)
          } finally {
            setBusy(false)
            try { history.replaceState(null, '', window.location.pathname) } catch {}
          }
          return
        }

        // 4) pas d’info → session existante ?
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          if (cancelled) return
          setPhase('ready')
          try { history.replaceState(null, '', window.location.pathname) } catch {}
          return
        }

        // 5) rien du tout
        if (cancelled) return
        setPhase('error')
        setError("Lien de réinitialisation non reconnu. Renvoyez un nouveau lien.")

      } finally {
        clearTimeout(failSafe)
      }
    }

    run()
    return () => { cancelled = true; clearTimeout(failSafe) }
  }, []) // eslint-disable-line

  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    if (password.length < 8) { setBusy(false); return setError('Au moins 8 caractères.') }
    if (password !== confirm) { setBusy(false); return setError('Les deux mots de passe ne correspondent pas.') }
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    setPhase('done')
    setTimeout(() => window.location.replace('/'), 800)
  }

  // ==== UI ====
  const Debug = () => (
    <pre style={{
      marginTop:16, background:'#f6f6f6', padding:12, borderRadius:8, fontSize:12,
      whiteSpace:'pre-wrap', wordBreak:'break-word', color:'#333'
    }}>{debugText}</pre>
  )

  if (phase === 'init') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div>Initialisation…</div>
        <Debug />
      </div>
    )
  }

  if (phase === 'need_email') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <p>Indique l’email utilisé pour la demande afin de vérifier le lien.</p>
        <div style={{display:'grid', gap:12, maxWidth:420, marginTop:12}}>
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <button className="btn" disabled={!email || busy} onClick={()=>{
            try { localStorage.setItem('lastResetEmail', email) } catch {}
            window.location.reload()
          }}>{busy ? 'Patientez…' : 'Continuer'}</button>
        </div>
        <Debug />
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#b00020', marginTop:12}}>{error}</div>
        <Debug />
        <a className="btn" href="/login" style={{marginTop:16}}>Retour à la connexion</a>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#166534', marginTop:12}}>Mot de passe mis à jour. Redirection…</div>
        <Debug />
      </div>
    )
  }

  // phase === 'ready'
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
      <Debug />
    </div>
  )
}
