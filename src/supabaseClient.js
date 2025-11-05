import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("VITE_SUPABASE_URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY =", import.meta.env.VITE_SUPABASE_ANON_KEY ? "OK (hidden)" : "MISSING");

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // Session persiste tant que l’onglet est ouvert
    persistSession: true,
    storage: window.sessionStorage,

    // ✅ ON LAISSE LE SDK LIRE LE HASH ET POSER LA SESSION
    detectSessionInUrl: true,

    autoRefreshToken: true,
  },
})
