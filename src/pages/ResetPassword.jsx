import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function ResetPassword() {
  const [phase, setPhase] = useState('init') // init | need_email | ready | done | error
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('lastResetEmail') || '' } catch { return '' }
  })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const [debug, setDebug]       = useState('')

  const H = () => (window.location.hash || '').replace(/^#/, '')
  const S = () => (window.location.search || '').replace(/^\?/, '')
  const addDebug = (line) => setDebug(prev => (prev ? prev + '\n' : '') + line)

  useEffect(() => {
    let cancelled = false

    async function boot(){
      const hashStr = H()
      const searchStr = S()
      addDebug(`href=${window.location.href}`)
      addDebug(`hash=${hashStr}`)
      addDebug(`search=${searchStr}`)

      const hash = new URLSearchParams(hashStr)
      const search = new URLSearchParams(searchStr)

      // 1) Erreurs explicites
      const err = hash.get('error_code') || hash.get('error') || search.get('error_code') || search.get('error')
      if (err) {
        setPhase('error')
        setError(err === 'otp_expired'
          ? "Le lien a expiré ou a déjà été utilisé. Renvoyez un nouveau lien."
          : "Lien de réinitialisation invalide.")
        addDebug(`error_code=${err}`)
        return
      }

      // 2) Jetons (hash OU query)
      const access  = hash.get('access_token')  || search.get('access_token')
      const refresh = hash.get('refresh_token') || search.get('refresh_token')

      if (access && refresh) {
        try {
          // (a) Diagnostic : l’access token est valide ?
          const u = await supabase.auth.getUser(access)
          if (u.error) addDebug(`getUser(access) ERROR: ${u.error.message}`)
          else addDebug(`getUser(access) OK user.id=${u.data?.user?.id || 'unknown'}`)

          // (b) Pose explicitement la session (SDK v2)
          const exp = Number(hash.get('expires_at') || search.get('expires_at') || 0)
          const { data: setData, error: setErr } = await supabase.auth.setSession({
            access_token: access,
            refresh_token: refresh,
            token_type: 'bearer',
            expires_at: Number.isFinite(exp) && exp > 0 ? exp : undefined,
          })
          if (setErr) {
            addDebug(`setSession ERROR: ${setErr.message}`)
            setPhase('error'); setError("Impossible d'initialiser la session de réinitialisation.")
            return
          }
          addDebug(`setSession OK: has session=${!!setData?.session}`)

          // (c) Vérification immédiate
          const after = await supabase.auth.getSession()
          addDebug(`getSession() after setSession: has session=${!!after.data?.session}`)
          if (!after.data?.session) {
            setPhase('error')
            setError("La session n'a pas pu être enregistrée. Réessayez le lien.")
            return
          }

          // (d) Nettoyage du hash puis READY
          try { history.replaceState(null, '', window.location.pathname) } catch {}
          if (!cancelled) setPhase('ready')
          return
        } catch (e) {
          addDebug(`setSession TRY/CATCH ERROR: ${e?.message || e}`)
          setPhase('error'); setError("Impossible d'initialiser la session de réinitialisation.")
          return
        }
      }

      // 3) Fallback : ?token=...&type=recovery
      const token = search.get('token')
      const type  = search.get('type')
      if (token && (type === 'recovery' || type === 'recovery_token')) {
        if (!email) { setPhase('need_email'); return }
        setBusy(true)
        try {
          const { data, error } = await supabase.auth.verifyOtp({ type: 'recovery', token, email })
          if (error) { addDebug(`verifyOtp ERROR: ${error.message}`); throw error }
          addDebug(`verifyOtp OK user.id=${data?.user?.id || 'unknown'}`)
          try { history.replaceState(null, '', window.location.pathname) } catch {}
          setPhase('ready')
        } catch (e) {
          setPhase('error'); setError("Lien de réinitialisation non reconnu ou expiré. Renvoyez un nouveau lien.")
        } finally {
          setBusy(false)
        }
        return
      }

      // 4) Session déjà présente ?
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        addDebug('getSession() found an existing session')
        try { history.replaceState(null, '', window.location.pathname) } catch {}
        setPhase('ready')
        return
      }

      // 5) Rien d’exploitable → erreur
      setPhase('error')
      setError("Lien de réinitialisation non reconnu. Renvoyez un nouveau lien.")
    }

    boot()
    return () => { cancelled = true }
  }, [])

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setBusy(true)
    if (password.length < 8) { setBusy(false); return setError('Au moins 8 caractères.') }
    if (password !== confirm) { setBusy(false); return setError('Les deux mots de passe ne correspondent pas.') }

    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) { setError(error.message); addDebug(`updateUser ERROR: ${error.message}`); return }
    addDebug('updateUser OK')
    setPhase('done')
    setTimeout(() => window.location.replace('/'), 800)
  }

  const Debug = () => (
    <pre style={{marginTop:16, background:'#f6f6f6', padding:12, borderRadius:8, fontSize:12, whiteSpace:'pre-wrap'}}>
      {debug}
    </pre>
  )

  if (phase === 'init') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div>Initialisation…</div>
        <Debug/>
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
        <Debug/>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#b00020', marginTop:12}}>{error}</div>
        <Debug/>
        <a className="btn" href="/login" style={{marginTop:16}}>Retour à la connexion</a>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#166534', marginTop:12}}>Mot de passe mis à jour. Redirection…</div>
        <Debug/>
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
      <Debug/>
    </div>
  )
}
