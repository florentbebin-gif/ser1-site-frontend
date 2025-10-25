import React, { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { triggerReset } from './utils/reset.js'

export default function App(){
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const nav = useNavigate()
  const location = useLocation()

  // Charger la session + écouter les changements (login/logout)
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setLoadingSession(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  // Garde d’auth : redirige sur /login si non connecté (sauf si on est déjà sur /login)
  useEffect(() => {
    if (loadingSession) return
    const isOnLogin = location.pathname === '/login'
    if (!session && !isOnLogin) {
      nav('/login'
