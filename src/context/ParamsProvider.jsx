import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const ParamsContext = createContext(null)

/**
 * Charge une seule fois la row params/global et expose:
 *  - params: objet avec valeurs globales
 *  - reload(): rechargement manuel
 *  - loading, error
 */
export function ParamsProvider({ children }) {
  const [params, setParams] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchParams() {
    setLoading(true); setError('')
    const { data: row, error: err } = await supabase
      .from('params')
      .select('key,value')
      .eq('key','global')
      .maybeSingle()
    if (err) {
      console.warn('ParamsProvider fetch error', err)
      setError("Impossible de charger les paramètres.")
      setParams(null)
    } else {
      // Valeurs par défaut au cas où la BDD est vide
      const defaults = {
        irVersion: '2025',
        defaultLoanRate: 4.0,
        defaultInflation: 2.0,
        amortOnlySmoothing: true,
        pptxTemplateUrl: '',
      }
      setParams({ ...defaults, ...(row?.value || {}) })
    }
    setLoading(false)
  }

  useEffect(() => {
    // Recharge quand la session change (login/logout)
    const sub = supabase.auth.onAuthStateChange(() => fetchParams())
    fetchParams()
    return () => { sub?.data?.subscription?.unsubscribe?.() }
  }, [])

  const value = useMemo(() => ({
    params, loading, error, reload: fetchParams
  }), [params, loading, error])

  return <ParamsContext.Provider value={value}>{children}</ParamsContext.Provider>
}

export function useParamsGlobal(){
  const ctx = useContext(ParamsContext)
  if (!ctx) throw new Error('useParamsGlobal must be used within <ParamsProvider>')
  return ctx
}
