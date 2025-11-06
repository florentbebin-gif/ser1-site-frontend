import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { triggerPageReset } from './utils/reset'
import { startIdleTimer } from './utils/idle'

export default function App(){
  const [session, setSession] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isRecoveryLikeHash = () => {
    const h = (window.location.hash || '').toLowerCase()
    return h.includes('type=recovery') || h.includes('type=invite') || h.includes('type=signup')
  }

  const currentSimId = (pathname) => {
    if (pathname.startsWith('/placement')) return 'placement'
    if (pathname.startsWith('/credit')) return 'credit'
    return null
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) setSession(session)
    })()
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s)
    })
    return () => { data?.subscription?.unsubscribe?.(); mounted = false }
  }, [])

  useEffect(() => {
    if (!session) return
    const stop = startIdleTimer({
      timeoutMs: 10 * 60 * 1000,
      onTimeout: async () => {
        try { await supabase.auth.signOut({ scope: 'global' }) } catch {}
        try { sessionStorage.clear() } catch {}
        try { Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k)) } catch {}
        window.location.href = '/login?logout=1'
      }
    })
    return stop
  }, [session])

  useEffect(() => {
    if (isRecoveryLikeHash() && location.pathname !== '/login') {
      navigate('/login' + window.location.hash, { replace: true })
    }
  }, [location.pathname, navigate])

  async function handleLogout(){
    if (loggingOut) return
    setLoggingOut(true)
    try { await supabase.auth.signOut({ scope: 'global' }) } catch {}
    try { sessionStorage.clear() } catch {}
    try { Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k)) } catch {}
    window.location.href = '/login?logout=1'
  }

  function handleReset(){
    const simId = currentSimId(location.pathname)
    if (!simId) return
    triggerPageReset(simId)
    alert('Les champs de cette page ont été réinitialisés.')
  }

  const isAuthed = !!session

  return (
    <div>
      <div className="topbar">
        <div className="brandword">SER1</div>

        {isAuthed && (
          <div className="top-actions">

            <Link to="/" className={`chip ${location.pathname === '/' ? 'active' : ''}`}>
              HOME
            </Link>

            {currentSimId(location.pathname) && (
              <button className="chip" onClick={handleReset}>
                Reset
              </button>
            )}

            <Link
              to="/params"
              className={`chip ${location.pathname.startsWith('/params') ? 'active' : ''}`}
            >
              Paramètres
            </Link>

            <button
              type="button"
              className="chip logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
            </button>

          </div>
        )}
      </div>

      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}
