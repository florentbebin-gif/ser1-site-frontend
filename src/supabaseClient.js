import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // 👉 aucune persistance disque : la session vit uniquement en mémoire de l’onglet
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // (optionnel) si tu préfères une persistance courte tant que l’onglet est ouvert :
    // storage: window.sessionStorage,
  },
})
