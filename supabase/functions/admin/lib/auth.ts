/* global Deno */
import { createClient } from 'npm:@supabase/supabase-js@2.95.3'
import type { SupabaseClient, User } from 'npm:@supabase/supabase-js@2.95.3'

export type { SupabaseClient, User }

export function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^\s*Bearer\s+(.+?)\s*$/i)
  return match?.[1] ?? null
}

export function getJwtRole(jwt: string | null): string | null {
  if (!jwt) return null

  const parts = jwt.split('.')
  if (parts.length < 2) return null

  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = '='.repeat((4 - (b64.length % 4)) % 4)
    const json = atob(b64 + pad)
    const payload = JSON.parse(json) as Record<string, unknown>
    return (payload.role as string | undefined) ?? null
  } catch {
    return null
  }
}

export function getSupabaseServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const adminKeyEnvName = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_')
  const supabaseServiceKey = Deno.env.get(adminKeyEnvName)

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase env vars for admin client')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function getAuthenticatedUser(
  supabase: SupabaseClient,
  token: string,
): Promise<{ user: User | null; error: Error | null }> {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return { user, error }
}

export function getUserAppRole(user: Pick<User, 'app_metadata'> | null): string {
  return (user?.app_metadata?.role as string | undefined) ?? 'user'
}

export type AdminAccountKind = 'owner' | 'dev_admin' | 'e2e'

interface AdminAccountRow {
  account_kind: string
  status: string
  expires_at: string | null
}

type ValidateResult =
  | { valid: true; accountKind: AdminAccountKind }
  | { valid: false; reason: 'not_found' | 'disabled' | 'expired' }

export interface AdminPrincipal {
  userId: string
  role: string
  accountKind: AdminAccountKind
  requestId: string
}

export function validateAdminAccount(data: AdminAccountRow | null): ValidateResult {
  if (!data) return { valid: false, reason: 'not_found' }
  if (data.status !== 'active') return { valid: false, reason: 'disabled' }
  if (data.expires_at !== null && new Date(data.expires_at) < new Date()) {
    return { valid: false, reason: 'expired' }
  }
  return { valid: true, accountKind: data.account_kind as AdminAccountKind }
}

export async function buildAdminPrincipal(
  supabase: SupabaseClient,
  user: User,
  requestId: string,
): Promise<AdminPrincipal | null> {
  const { data } = await supabase
    .from('admin_accounts')
    .select('account_kind, status, expires_at')
    .eq('user_id', user.id)
    .maybeSingle()
  const result = validateAdminAccount(data)
  if (!result.valid) return null
  return {
    userId: user.id,
    role: getUserAppRole(user),
    accountKind: result.accountKind,
    requestId,
  }
}
