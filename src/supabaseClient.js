import { createClient } from '@supabase/supabase-js'
import { isDebugEnabled } from './utils/debugFlags'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug auth activable via VITE_DEBUG_AUTH=1 ou localStorage SER1_DEBUG_AUTH=1
const DEBUG_AUTH = isDebugEnabled('auth')

if (DEBUG_AUTH) {
  // eslint-disable-next-line no-console
  console.debug('[Supabase] Init with URL:', url)
}

export { DEBUG_AUTH }
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
