import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

function lsGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

let safeStorage;
try {
  safeStorage = window.localStorage;
} catch (e) {
  safeStorage = undefined;
}

const authOptions = {
  persistSession: true,
  detectSessionInUrl: false,
  autoRefreshToken: true,
  ...(safeStorage ? { storage: safeStorage } : {}),
};

export const supabase = createClient(url, key, {
  auth: authOptions,
})

export async function waitInitialSession() {
  await supabase.auth.getSession()
}

// Flags de debug activables via env ou localStorage (défaut false en prod)
export const DEBUG_AUTH = import.meta.env.VITE_DEBUG_AUTH === 'true' || lsGet('SER1_DEBUG_AUTH') === '1';

export const DEBUG_ADMIN_FETCH = import.meta.env.VITE_DEBUG_ADMIN_FETCH === 'true' || lsGet('SER1_DEBUG_ADMIN_FETCH') === '1';

export const DEBUG_ADMIN = import.meta.env.VITE_DEBUG_ADMIN === 'true' || lsGet('SER1_DEBUG_ADMIN') === '1';

if (import.meta.env.DEV) {
  window.__SER1 = window.__SER1 || {};
  window.__SER1.supabase = supabase;
  window.__SER1.debug = { ...window.__SER1.debug };

  // ✅ alias pratique (certains tests utilisent ce nom)
  window.__SER1_supabase = supabase;
}

if (typeof window !== "undefined") {
  window.__SER1_supabase = supabase;
}
