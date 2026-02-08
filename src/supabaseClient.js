import { createClient } from '@supabase/supabase-js'
import { isDebugEnabled } from './utils/debugFlags'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug auth activable via VITE_DEBUG_AUTH=1 ou localStorage SER1_DEBUG_AUTH=1
const DEBUG_AUTH = isDebugEnabled('auth')

export const isSupabaseConfigured = !!(url && key)

if (DEBUG_AUTH) {
  // eslint-disable-next-line no-console
  console.debug('[Supabase] Init with URL:', url)
}

// Mock minimal client to prevent crashes if config is missing
const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => {},
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
    upsert: () => ({ data: [], error: null }),
  }),
  functions: {
    invoke: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  },
  storage: {
    from: () => ({
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        upload: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    })
  }
}

export { DEBUG_AUTH }
export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        storage: window.localStorage,
        detectSessionInUrl: false,
        autoRefreshToken: true,
      },
    })
  : mockSupabase

export async function waitInitialSession() {
  if (!isSupabaseConfigured) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in environment variables.')
  }
  await supabase.auth.getSession()
}
