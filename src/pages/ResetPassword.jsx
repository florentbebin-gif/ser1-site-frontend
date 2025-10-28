import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function ResetPassword() {
  const [phase, setPhase] = useState('init') // init | ready | done | need_email | error
  const [email, setEmail]   = useState(() => {
    try { return localStorage.getItem('lastResetEmail') || '' } catch { return '' }
  })
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState('')
  const [debug,    setDebug]    = useState('')

  const H = () => (window.location.hash || '').replace(/^#/, '')
  const S = () => (window.location.search || '').replace(/^\?/, '')

  function addDebug(line){
    setDebug(prev => (prev ? prev + '\n' : '') + line)
  }

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled && phase === 'init') {
        setPhase('error')
        setError("Lien de réinitialisation non reconnu. Renvoyez un nouveau lien.")
      }
    }, 3500)

    async function boot(){
      const hashStr   = H()
      const searchStr = S()
      addDebug(`href=${window.location.href}`)
      addDebug(`hash=${hashStr}`)
      addDebug(`search=${searchStr}`)

      const hash   = new URLSearchParams(hashStr)
      const search = new URLSearchParams(searchStr)

      // 1) erreurs explicites
      const err = hash.get('error_code') || hash.get('error') || search.get('error_code') || search.get('error')
      if (err) {
        setPhase('error')
        setError(err === 'otp_expired'
          ? "Le lien a expiré ou a déjà été utilisé. Renvoyez un nouveau lien."
          : "Lien de réinitialisation invalide.")
        addDebug(`error_code=${err}`)
        return
      }

      // 2) tokens depuis hash OU query
      const access  = hash.get('access_token')  || search.get('access_token')
      const refresh = hash.get('refresh_token') || search.get('refresh_token')
      const token   = search.get('token')       // fallback supabase (certaines messageries)
      const type    = search.get('type')

      // --- chemin “recovery moderne” (hash avec access/refresh) ---
      if (access && refresh) {
  try {
    // (a) Diagnostic : ce jeton accède bien à un user ? (tu le vois déjà OK)
    const u = await supabase.auth.getUser(access)
    if (u.error) {
      addDebug(`getUser(access) ERROR: ${u.error.message}`)
    } else {
      addDebug(`getUser(access) OK user.id=${u.data?.user?.id || 'unknown'}`)
    }

    // (b) Pose la session
    const { data: setData, error: setErr } = await supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh
    })
    if (setErr) {
      addDebug(`setSession ERROR: ${setErr.message}`)
      setPhase('error')
      setError("Impossible d'initialiser la session de réinitialisation.")
      return
    }
    addDebug(`setSession OK: has session=${!!setData?.session}`)

    // (c) Vérifie immédiatement que la session est bien là
    const after = await supabase.auth.getSession()
    addDebug(`getSession() after setSession: has session=${!!after.data?.session}`)

    if (!after.data?.session) {
      setPhase('error')
      setError("La session n'a pas pu être enregistrée. Réessayez le lien.")
      return
    }

    // (d) Nettoie l'URL et passe en READY
    try { history.replaceState(null, '', window.location.pathname) } catch {}
    setPhase('ready')
    return
  } catch (e) {
    addDebug(`setSession TRY/CATCH ERROR: ${e?.message || e}`)
    setPhase('error')
    setError("Impossible d'initialiser la session de réinitialisation.")
    return
  } finally {
    clearTimeout(timeout)
  }
}

      // --- chemin de repli : ?token=...&type=recovery ---
      if (token && (type === 'recovery' || type === 'recovery_token')) {
        if (!email) { setPhase('need_email'); return }
        setBusy(true)
        try {
          const { data, error } = await supabase.auth.verifyOtp({ type: 'recovery', token, email })
          if (error) {
            addDebug(`verifyOtp ERROR: ${error.message}`)
            setPhase('error')
            setError("Lien de réinitialisation non reconnu ou expiré. Renvoyez un nouveau lien.")
            return
          }
          addDebug(`verifyOtp OK user.id=${data?.user?.id || 'unknown'}`)
          try { history.replaceState(null, '', window.location.pathname) } catch {}
          setPhase('ready')
        } finally {
          setBusy(false)
          clearTimeout(timeout)
        }
        return
      }

      // --- déjà connecté via un autre mécanisme ? ---
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        addDebug('getSession() found an existing session')
        try { history.replaceState(null, '', window.location.pathname) } catch {}
        setPhase('ready')
        clearTimeout(timeout)
        return
      }

      // Rien d’exploitable
      clearTimeout(timeout)
      setPhase('error')
      setError("Lien de réinitialisation non reconnu. Renvoyez un nouveau lien.")
    }

    boot()
    return () => { cancelled = true; clearTimeout(timeout) }
    // eslint-disable-next-line
  }, [])

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setBusy(true)
    if (password.length < 8) { setBusy(false); return setError('Au moins 8 caractères.') }
    if (password !== confirm) { setBusy(false); return setError('Les deux mots de passe ne correspondent pas.') }

    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      addDebug(`updateUser ERROR: ${error.message}`)
      return setError(error.message)
    }
    addDebug('updateUser OK')
    setPhase('done')
    setTimeout(() => window.location.replace('/'), 800)
  }

  const Debug = () => (
    <pre style={{
      marginTop:16, background:'#f6f6f6', padding:12, borderRadius:8, fontSize:12,
      whiteSpace:'pre-wrap', wordBreak:'break-word', color:'#333'
    }}>{debug}</pre>
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
