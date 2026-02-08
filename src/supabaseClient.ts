import { createClient, SupabaseClient } from '@supabase/supabase-js'
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
// Typed as any to avoid union type issues with SupabaseClient
const mockSupabase: any = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => {},
  },
  from: () => createMockQueryBuilder(),
  rpc: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  functions: {
    invoke: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  },
  storage: {
    from: () => ({
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        upload: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        download: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    })
  }
}

// Query builder mock chainable pour les requêtes Supabase
function createMockQueryBuilder(): any {
  const mockArrayResult = { data: [], error: null };
  const mockObjectResult = { data: null, error: null };
  
  const builder: any = {
    // Chain methods
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    // Terminal methods returning promises
    maybeSingle: () => Promise.resolve(mockObjectResult),
    single: () => Promise.resolve(mockObjectResult),
  };
  
  // Support for await on chains (e.g., insert().select())
  builder.then = (onFulfilled: any) => Promise.resolve(mockArrayResult).then(onFulfilled);
  
  return builder;
}

export { DEBUG_AUTH }
export const supabase: SupabaseClient = isSupabaseConfigured
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
