import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[Supabase] Init with URL:', url)

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    detectSessionInUrl: false,
    autoRefreshToken: true,
  },
})

export async function waitInitialSession() {
  await supabase.auth.getSession()
}

// Flag de debug pour tracer l'hydratation de session (optionnel)
export const DEBUG_AUTH = false;
