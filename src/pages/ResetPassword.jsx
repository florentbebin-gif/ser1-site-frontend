import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function ResetPassword() {
  const [status, setStatus] = useState<'init' | 'ready' | 'done' | 'error'>('init')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  // 1) Supabase ouvre cette page via le lien email. Quand la page charge,
  //    Supabase crée une session "recovery". On attend qu’elle soit là.
  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session) {
          setStatus('ready')
        } else {
          // Attendre un éventuel event d’auth
          const { data } = supabase.auth.onAuthStateChange((event, s) => {
            if (!mounted) return
            if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
              setStatus('ready')
            }
          })
          // petit garde-fou de 10s si rien ne vient
          setTimeout(() => { if (mounted && status === 'init') setStatus('error') }, 10000)
          return () => data?.subscription?.unsubscribe?.()
        }
      } catch {
        if (mounted) setStatus('error')
      }
    })()

    return () => { mounted = false }
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.')
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.')

    // 2) Mettre à jour le mot de passe avec la session "recovery"
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      return
    }
    setStatus('done')

    // 3) Option : rediriger proprement vers l’accueil (session valide) :
    setTimeout(() => { window.location.replace('/') }, 800)
  }

  if (status === 'init') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div>Initialisation…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#b00020', marginTop:12}}>
          Le lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien depuis la page de connexion.
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="panel">
        <h2>Réinitialisation du mot de passe</h2>
        <div style={{color:'#166534', marginTop:12}}>
          Mot de passe mis à jour. Redirection…
        </div>
      </div>
    )
  }

  // status === 'ready'
  return (
    <div className="panel">
      <h2>Réinitialisation du mot de passe</h2>

      {error && <div style={{color:'#b00020', marginTop:12}}>{error}</div>}

      <form onSubmit={onSubmit} style={{display:'grid', gap:12, maxWidth:420, marginTop:12}}>
        <label>Nouveau mot de passe</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        <label>Confirmer le mot de passe</label>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />

        <button className="btn">Valider</button>
      </form>
    </div>
  )
}
