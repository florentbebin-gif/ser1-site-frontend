import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // Session vivante tant que l’onglet est ouvert (sécurisé à la fermeture)
    persistSession: true,
    storage: window.sessionStorage,

    // ✅ on gère nous-mêmes le hash de reset dans la page /reset
    detectSessionInUrl: false,

    autoRefreshToken: true,
  },
})
