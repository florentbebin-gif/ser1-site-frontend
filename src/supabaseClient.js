import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

<<<<<<< Updated upstream
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    detectSessionInUrl: false,
    autoRefreshToken: true,
  },
})
=======
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
}

const resetListeners = new Set()

function createSupabaseClient() {
  return createClient(url, key, {
    auth: authOptions,
    realtime: {
      worker: true,
      workerUrl: '/supabase-realtime-worker.js',
    },
  })
}

function updateGlobals(client) {
  if (typeof window !== 'undefined') {
    window.__SER1 = window.__SER1 || {}
    window.__SER1.supabase = client
    window.__SER1.debug = { ...window.__SER1.debug }
    window.__SER1_supabase = client
  }
}

export let supabase = createSupabaseClient()
updateGlobals(supabase)

export function getSupabase() {
  return supabase
}

export function resetSupabaseClient(reason = 'manual') {
  supabase = createSupabaseClient()
  updateGlobals(supabase)
  resetListeners.forEach((listener) => {
    try {
      listener(supabase, reason)
    } catch (error) {
      console.warn('[supabaseClient] reset listener error', { reason, message: error?.message })
    }
  })
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('ser1:supabase:reset', { detail: { reason } }))
    } catch (error) {
      console.warn('[supabaseClient] reset event error', { reason, message: error?.message })
    }
  }
  return supabase
}

export function onSupabaseReset(listener) {
  resetListeners.add(listener)
  return () => resetListeners.delete(listener)
}
>>>>>>> Stashed changes

export async function waitInitialSession() {
  await supabase.auth.getSession()
}

<<<<<<< Updated upstream
// Flag de debug pour tracer l’hydratation de session (optionnel)
export const DEBUG_AUTH = false;
=======
// Flags de debug activables via env ou localStorage (défaut false en prod)
export const DEBUG_AUTH = import.meta.env.VITE_DEBUG_AUTH === 'true' || lsGet('SER1_DEBUG_AUTH') === '1'

export const DEBUG_ADMIN_FETCH = import.meta.env.VITE_DEBUG_ADMIN_FETCH === 'true' || lsGet('SER1_DEBUG_ADMIN_FETCH') === '1'

export const DEBUG_ADMIN = import.meta.env.VITE_DEBUG_ADMIN === 'true' || lsGet('SER1_DEBUG_ADMIN') === '1'

export const SUPABASE_FUNCTION_URL = `${url}/functions/v1/admin`

export async function pingAdminPublic({ timeoutMs = 2000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const requestId = crypto?.randomUUID?.() ?? `${Date.now()}`
  try {
    const response = await fetch(`${SUPABASE_FUNCTION_URL}?action=ping_public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`ping_public failed (${response.status})`)
    }

    const data = await response.json()
    return { ok: true, data, requestId }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('ping_public timeout (2s)')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
>>>>>>> Stashed changes
