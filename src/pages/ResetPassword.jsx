import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

/**
 * Page ResetPassword
 * - Cible de redirection des emails Supabase (recover / magic link)
 * - Permet de définir un nouveau mot de passe via supabase.auth.updateUser
 */
export default function ResetPassword(){
  const [hasSession, setHasSession] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      // Quand on arrive depuis l’email, Supabase met un access_token dans le hash
      // et crée une session "recovery". On vérifie juste qu’elle est active.
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setHasSession(!!data?.session)
      setLoading(false)
      if (!data?.session) {
        setError("Lien invalide ou expiré. Recommencez la procédure depuis l'email.")
      } else {
        setInfo("Session de récupération détectée. Choisissez un nouveau mot de passe.")
      }
    })()

    // Si l’état de session change (ex: refresh du token), on met à jour l’UI
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setHasSession(!!sess)
    })
    return () => { mounted = false; listener?.subscription?.unsubscribe?.() }
  }, [])

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setInfo('')
    if (pwd1.length < 8) { setError('Mot de passe trop court (min. 8 caractères).'); return }
    if (pwd1 !== pwd2)  { setError('La confirmation ne correspond pas.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pwd1 })
    setLoading(false)
    if (error) setError(error.message)
    else setInfo("Mot de passe mis à jour. Vous pouvez maintenant vous connecter sur la page de connexion.")
  }

  return (
    <div className="panel">
      <div className="plac-title">Réinitialisation du mot de passe</div>

      {loading && <div className="hint">Initialisation…</div>}
      {error && <div className="alert error">{error}</div>}
      {info && <div className="alert success">{info}</div>}

      {hasSession && (
        <form onSubmit={onSubmit} className="form-grid" style={{maxWidth: 420, opacity: loading ? .6 : 1}}>
          <div className="form-row">
            <label>Nouveau mot de passe</label>
            <input type="password" value={pwd1} onChange={e=>setPwd1(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Confirmer le mot de passe</label>
            <input type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} />
          </div>
          <div className="form-row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Mise à jour…' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
