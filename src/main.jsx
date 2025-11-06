// src/main.jsx
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom'

import App from './App.jsx'
import Home from './pages/Home.jsx'
import Placement from './pages/Placement.jsx'
import Credit from './pages/Credit.jsx'
import Params from './pages/Params.jsx'
import Sim from './pages/Sim.jsx'
import Login from './pages/Login.jsx'

import { ParamsProvider } from './context/ParamsProvider.jsx'
import { supabase } from './supabaseClient'
import './styles.css'

// Garde inline (évite l'import d'un fichier externe)
function Guard({ children }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState(null)
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data?.session ?? null)
      setReady(true)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess ?? null)
    })
    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  if (!ready) return null
  if (!session) return <Navigate to={'/login' + (window.location.hash || '')} replace state={{ from: location }} />
  return children
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <Guard />, // protège le bloc ci-dessous
        children: [
          { index: true, element: <Home /> },            // /
          { path: 'placement', element: <Placement /> }, // /placement
          { path: 'credit', element: <Credit /> },       // /credit
          { path: 'params', element: <Params /> },       // /params
          { path: 'sim/:section', element: <Sim /> },    // /sim/potentiel ...
        ],
      },
      { path: 'login', element: <Login /> },             // public
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ParamsProvider>
      <RouterProvider router={router} />
    </ParamsProvider>
  </React.StrictMode>
)
