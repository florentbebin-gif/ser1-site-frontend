import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'
import { startIdleTimer } from './utils/idle.js'

export default function App(){
  const [session, setSession] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const location = useLocation()
  // Détecte un hash d'auth Supabase (invite/signup/recovery)
const hasRecoveryLikeHash = () => {
  try {
    const s = (window.location.hash || '').toLowerCase()
    return s.includes('type=recovery') || s.includes('type=invite') || s.includes('type=signup')
  } catch { return false }
}

  const onResetPage = location.pathname.startsWith('/reset')
// petit helper : n'attend pas indéfiniment le signOut
async function signOutWithTimeout(ms = 1500) {
  try {
    await Promise.race([
      supabase.auth.signOut({ scope: 'global' }),
      new Promise(resolve => setTimeout(resolve, ms))
    ])
  } catch {
    // on ignore : on passe à la suite de toute façon
  }
}
  // Suivre la session pour l'UI
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) setSession(session)
    })()
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (mounted) setSession(s)
    })
    return () => { data?.subscription?.unsubscribe?.(); mounted = false }
  }, [])

  // 🔔 Déconnexion auto après 10 min d’inactivité
useEffect(() => {
  if (!session || onResetPage) return
  const stop = startIdleTimer({
    timeoutMs: 10 * 60 * 1000,
    onTimeout: async () => {
      await signOutWithTimeout?.(1500) // si tu as ce helper ; sinon supprime cette ligne
      try { Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k)) } catch {}
      try { sessionStorage.clear() } catch {}
      window.location.href = '/login?logout=1'
    }
  })
  return stop
}, [session, onResetPage])

const navigate = useNavigate()

useEffect(() => {
  // Si un lien Supabase contient un token (#...type=invite|signup|recovery),
  // on redirige vers /login en conservant le hash pour que Login.jsx ouvre la box.
  if (hasRecoveryLikeHash() && location.pathname !== '/login') {
    navigate('/login' + window.location.hash, { replace: true })
  }
}, [location.pathname, navigate])


  
async function handleLogout(){
  if (loggingOut) return
  setLoggingOut(true)

  // 1) on tente le signOut mais on n'attend pas indéfiniment
  await signOutWithTimeout(1500)

  // 2) purge locale "ceinture + bretelles"
  try {
    Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k))
  } catch {}
  try { sessionStorage.clear() } catch {}

  // 3) redirection dure (on n'utilise pas Link ici)
  window.location.href = '/login?logout=1'
}

  function handleReset(){
    triggerReset()
    alert('Toutes les saisies des simulateurs ont été réinitialisées.')
  }

  const isAuthed = !!session
  const onAuthFree = /^\/login(\/|$)|^\/reset(\/|$)/.test(location.pathname)

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1</div>

        <div className="top-actions">
          {/* HOME */}
          {isAuthed && (
            <Link to="/" className={`chip ${location.pathname === '/' ? 'active' : ''}`}>
              HOME
            </Link>
          )}

          {/* Reset (masqué sur la page d’accueil) */}
            {(() => {
              const p = location.pathname
              const showReset =
               isAuthed &&
              (p.startsWith('/placement') ||
               p.startsWith('/credit') ||
               p.startsWith('/sim') ||
               p.startsWith('/params'))

            return showReset ? (
              <button className="chip" onClick={handleReset}>
                Reset
            </button>
            ) : null
          })()}
          {/* Paramètres */}
          {isAuthed && (
            <Link
              to="/params"
              className={`chip ${location.pathname.startsWith('/params') ? 'active' : ''}`}
            >
              Paramètres
            </Link>
          )}

          {/* Déconnexion / Connexion */}
          {isAuthed ? (
            <button
              type="button"
              className="chip logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
            </button>
          ) : (
            !onAuthFree && (
              <Link to="/login" className="chip">
                Connexion
              </Link>
            )
          )}
        </div>
      </div>

      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}
