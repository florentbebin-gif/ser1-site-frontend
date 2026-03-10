import {
  jsonResponse,
  type AdminActionHandler,
  type RequestMetaContext,
} from '../lib/http.ts'

export const ADMIN_VERSION = '2026-01-23-v1'

export function handlePublicPing(ctx: RequestMetaContext): Response {
  const duration = Date.now() - ctx.reqStart
  console.log(`[admin] ping_public | rid=${ctx.requestId} | ${duration}ms | 200 | origin=${ctx.origin}`)
  return jsonResponse({
    ok: true,
    ts: Date.now(),
    requestId: ctx.requestId,
    durationMs: duration,
  }, ctx.responseHeaders)
}

export function handleServicePing(ctx: RequestMetaContext): Response {
  const duration = Date.now() - ctx.reqStart
  return jsonResponse({
    ok: true,
    ts: Date.now(),
    requestId: ctx.requestId,
    durationMs: duration,
  }, ctx.responseHeaders)
}

const handlePing: AdminActionHandler = async (ctx) => {
  const duration = Date.now() - ctx.reqStart
  console.log(`[admin] END | rid=${ctx.requestId} | action=ping | ${duration}ms | 200`)
  return jsonResponse({
    ok: true,
    ts: Date.now(),
    requestId: ctx.requestId,
    durationMs: duration,
  }, ctx.responseHeaders)
}

const handleEcho: AdminActionHandler = async (ctx) => {
  const headerKeys = Array.from(ctx.req.headers.keys())
  return jsonResponse({
    ok: true,
    origin: ctx.origin,
    hasAuthHeader: ctx.hasAuthHeader,
    headersKeys: headerKeys,
    requestId: ctx.requestId,
  }, ctx.responseHeaders)
}

const handleVersion: AdminActionHandler = async (ctx) => {
  return jsonResponse({
    version: ADMIN_VERSION,
    deployedAt: new Date().toISOString(),
  }, ctx.responseHeaders)
}

export const systemActionHandlers: Record<string, AdminActionHandler> = {
  ping: handlePing,
  echo: handleEcho,
  version: handleVersion,
}
