/* global Deno */
/* eslint-disable no-console */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { getCorsHeaders } from './cors.ts'
import {
  buildAdminPrincipal,
  getAuthenticatedUser,
  getJwtRole,
  getSupabaseServiceClient,
  getUserAppRole,
  parseBearerToken,
} from './lib/auth.ts'
import {
  errorResponse,
  parseAdminPayload,
  resolveAdminAction,
  type AdminActionHandler,
} from './lib/http.ts'
import { userActionHandlers } from './actions/users.ts'
import { issueActionHandlers } from './actions/issues.ts'
import { cabinetActionHandlers } from './actions/cabinets.ts'
import { themeActionHandlers, handleGetOriginalTheme } from './actions/themes.ts'
import { logoActionHandlers } from './actions/logos.ts'
import {
  ADMIN_VERSION,
  handlePublicPing,
  handleServicePing,
  systemActionHandlers,
} from './actions/system.ts'

const adminActionHandlers: Record<string, AdminActionHandler> = {
  ...userActionHandlers,
  ...issueActionHandlers,
  ...cabinetActionHandlers,
  ...themeActionHandlers,
  ...logoActionHandlers,
  ...systemActionHandlers,
}

serve(async (req: Request) => {
  const reqStart = Date.now()
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
  const origin = req.headers.get('origin') ?? 'unknown'
  const method = req.method
  const url = req.url

  console.log(`[admin] START ${ADMIN_VERSION} | rid=${requestId} | method=${method} | url=${url} | origin=${origin}`)

  const corsHeaders = getCorsHeaders(req)
  const responseHeaders = {
    ...corsHeaders,
    'x-request-id': requestId,
    'x-admin-version': ADMIN_VERSION,
  }
  const hasAuthHeader = !!req.headers.get('Authorization')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders })
  }

  const requestMeta = {
    req,
    requestId,
    responseHeaders,
    origin,
    hasAuthHeader,
    reqStart,
  }
  const urlCheck = new URL(req.url)
  const actionFromQuery = urlCheck.searchParams.get('action')

  if (actionFromQuery === 'ping_public') {
    return handlePublicPing(requestMeta)
  }

  if (actionFromQuery === 'ping') {
    const jwtRole = getJwtRole(parseBearerToken(req.headers.get('Authorization')))
    const serviceRoleName = ['service', 'role'].join('_')
    if (jwtRole === serviceRoleName) {
      return handleServicePing(requestMeta)
    }
  }

  try {
    const supabase = getSupabaseServiceClient()
    const token = parseBearerToken(req.headers.get('Authorization'))

    if (!token) {
      return errorResponse('Token manquant', responseHeaders, 401)
    }

    const { user, error: authError } = await getAuthenticatedUser(supabase, token)
    if (authError || !user) {
      return errorResponse('Token invalide', responseHeaders, 401)
    }

    if (actionFromQuery === 'get_original_theme') {
      return await handleGetOriginalTheme({ ...requestMeta, supabase })
    }

    if (getUserAppRole(user) !== 'admin') {
      return errorResponse('Accès administrateur requis', responseHeaders, 403)
    }

    // Vérification admin_accounts : seuls les comptes explicitement allowlistés passent
    const principal = await buildAdminPrincipal(supabase, user, requestId)
    if (!principal) {
      console.log(`[admin] GUARD_FAIL rid=${requestId} user=${user.id} reason=not_in_admin_accounts`)
      return errorResponse('Compte admin non autorisé', responseHeaders, 403)
    }

    const payload = await parseAdminPayload(req, requestId)
    const action = resolveAdminAction(payload, urlCheck)
    const payloadKeys = Object.keys(payload).join(',') || '(none)'

    console.log(`[EDGE_REQ] rid=${requestId} method=${method} origin=${origin} hasAuth=${hasAuthHeader} action=${action} payloadKeys=${payloadKeys} kind=${principal.accountKind}`)

    if (!action) {
      return errorResponse('Action manquante', responseHeaders, 400)
    }

    const handler = adminActionHandlers[action]
    if (handler) {
      return await handler({
        ...requestMeta,
        supabase,
        payload,
        adminUserId: user.id,
        principal,
      })
    }

    const duration = Date.now() - reqStart
    console.log(`[admin] END | rid=${requestId} | action=${action} | ${duration}ms | 400 invalid`)
    return errorResponse('Action invalide', responseHeaders, 400, { requestId })
  } catch (error) {
    const duration = Date.now() - reqStart
    console.error(`[admin] ERROR | rid=${requestId} | ${duration}ms | 500`, error)
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur'
    return errorResponse(message, responseHeaders, 500, { requestId })
  }
})
