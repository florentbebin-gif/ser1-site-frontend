import type { SupabaseClient } from './auth.ts'

export type AdminPayload = Record<string, unknown>

export interface RequestMetaContext {
  req: Request
  requestId: string
  responseHeaders: Record<string, string>
  origin: string
  hasAuthHeader: boolean
  reqStart: number
}

export interface AuthenticatedContext extends RequestMetaContext {
  supabase: SupabaseClient
}

export interface AdminActionContext extends AuthenticatedContext {
  payload: AdminPayload
  adminUserId: string
}

export type AdminActionHandler = (ctx: AdminActionContext) => Promise<Response>

export function jsonResponse(
  payload: unknown,
  responseHeaders: Record<string, string>,
  status = 200,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...responseHeaders,
      'Content-Type': 'application/json',
    },
  })
}

export function errorResponse(
  message: string,
  responseHeaders: Record<string, string>,
  status = 400,
  extra: Record<string, unknown> = {},
): Response {
  return jsonResponse({ error: message, ...extra }, responseHeaders, status)
}

export async function parseAdminPayload(
  req: Request,
  requestId: string,
): Promise<AdminPayload> {
  let payload: AdminPayload = {}
  let rawBodyPreview = '(empty)'

  try {
    const rawBody = await req.text()
    rawBodyPreview = rawBody.slice(0, 100) + (rawBody.length > 100 ? '...' : '')
    if (rawBody) {
      payload = JSON.parse(rawBody) as AdminPayload
    }
  } catch (_error) {
    console.log(`[admin] Body parse error | rid=${requestId}, raw preview: ${rawBodyPreview}`)
  }

  return payload
}

export function resolveAdminAction(payload: AdminPayload, url: URL): string | null {
  const payloadAction = typeof payload.action === 'string' ? payload.action : null
  return payloadAction ?? url.searchParams.get('action') ?? null
}
