import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { isDebugEnabled } from './utils/debugFlags'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

const isBrowser = typeof window !== 'undefined'

// Debug auth activable via VITE_DEBUG_AUTH=1 ou localStorage SER1_DEBUG_AUTH=1
const DEBUG_AUTH = isDebugEnabled('auth')

export const isSupabaseConfigured = !!(url && key)

if (DEBUG_AUTH) {
  // eslint-disable-next-line no-console
  console.debug('[Supabase] Init with URL:', url)
}

type MockArrayResult = { data: unknown[]; error: null }
type MockObjectResult = { data: null; error: null }
type MockStorageErrorResult = { data: null; error: { message: string } }

type MockQueryBuilder = PromiseLike<MockArrayResult> & {
  select: () => MockQueryBuilder
  insert: () => MockQueryBuilder
  update: () => MockQueryBuilder
  delete: () => MockQueryBuilder
  upsert: () => MockQueryBuilder
  eq: () => MockQueryBuilder
  order: () => MockQueryBuilder
  limit: () => MockQueryBuilder
  maybeSingle: () => Promise<MockObjectResult>
  single: () => Promise<MockObjectResult>
}

interface MockSupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>
    getUser: () => Promise<{ data: { user: null }; error: null }>
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } }
    signOut: () => Promise<void>
    signInWithPassword: () => Promise<{ data: { session: null; user: null }; error: { message: string } | null }>
    resetPasswordForEmail: () => Promise<{ data: null; error: null }>
    updateUser: () => Promise<{ data: { user: null }; error: { message: string } | null }>
  }
  from: () => MockQueryBuilder
  rpc: () => Promise<{ data: null; error: { message: string } }>
  functions: {
    invoke: () => Promise<{ data: null; error: { message: string } }>
  }
  storage: {
    from: () => {
      getPublicUrl: () => { data: { publicUrl: string } }
      upload: () => Promise<MockStorageErrorResult>
      download: () => Promise<MockStorageErrorResult>
    }
  }
}

const mockSupabase: MockSupabaseClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => {},
    signInWithPassword: async () => ({
      data: { session: null, user: null },
      error: { message: 'Supabase not configured' },
    }),
    resetPasswordForEmail: async () => ({ data: null, error: null }),
    updateUser: async () => ({
      data: { user: null },
      error: { message: 'Supabase not configured' },
    }),
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
    }),
  },
}

function createMockQueryBuilder(): MockQueryBuilder {
  const mockArrayResult: MockArrayResult = { data: [], error: null }
  const mockObjectResult: MockObjectResult = { data: null, error: null }

  const builder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: () => Promise.resolve(mockObjectResult),
    single: () => Promise.resolve(mockObjectResult),
  } as MockQueryBuilder

  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(mockArrayResult).then(onFulfilled, onRejected)

  return builder
}

export { DEBUG_AUTH }
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        // In Node/test/SSR, window/localStorage don't exist.
        // We disable session persistence in that environment.
        persistSession: isBrowser,
        storage: isBrowser ? window.localStorage : undefined,
        detectSessionInUrl: false,
        autoRefreshToken: true,
      },
    })
  : (mockSupabase as unknown as SupabaseClient)

export async function waitInitialSession() {
  if (!isSupabaseConfigured) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in environment variables.')
  }
  await supabase.auth.getSession()
}
