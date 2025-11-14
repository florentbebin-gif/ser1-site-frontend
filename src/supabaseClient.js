import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: window.sessionStorage,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
})

// Attendre que Supabase ait consommé le hash (recovery, invite, etc.)
export async function waitInitialSession() {
  const { data } = await supabase.auth.getSession()
  if (!data.session && window.location.hash.includes('access_token')) {
    // Le hash est encore présent : on le consomme une seule fois
    const params = Object.fromEntries(new URLSearchParams(window.location.hash.slice(1)))
    await supabase.auth.setSession(params)
  }
}
