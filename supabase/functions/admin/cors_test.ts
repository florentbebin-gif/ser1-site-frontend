/* global Deno */
import { assert, assertEquals } from '@std/assert'
import { getCorsHeaders, resolveAllowedOrigin, getAllowedOriginsSnapshot } from './cors.ts'

Deno.test('resolveAllowedOrigin allows configured origins', () => {
  const allowedOrigins = getAllowedOriginsSnapshot()
  const prodOrigin = allowedOrigins[0]
  assert(prodOrigin, 'expected at least one allowed origin')
  assertEquals(resolveAllowedOrigin(prodOrigin), prodOrigin)
})

Deno.test('getCorsHeaders echoes allowed origin with credentials', () => {
  const origin = 'https://ser1-site-frontend.vercel.app'
  const headers = getCorsHeaders(new Request('https://example.com', {
    headers: { origin }
  }))

  assertEquals(headers['Access-Control-Allow-Origin'], origin)
  assertEquals(headers['Access-Control-Allow-Credentials'], 'true')
  assertEquals(headers['Access-Control-Expose-Headers'], 'x-request-id')
})

Deno.test('getCorsHeaders omits origin for disallowed callers', () => {
  const headers = getCorsHeaders(new Request('https://example.com', {
    headers: { origin: 'https://untrusted.example.com' }
  }))

  assertEquals(headers['Access-Control-Allow-Origin'], undefined)
  assertEquals(headers['Access-Control-Allow-Credentials'], undefined)
})
