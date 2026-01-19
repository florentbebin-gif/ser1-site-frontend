const DEFAULT_ALLOWED_ORIGINS = [
  'https://ser1-site-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
]

const ALLOWED_ORIGINS = new Set(DEFAULT_ALLOWED_ORIGINS)

export const ALLOWED_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'x-request-id',
].join(', ')

export function resolveAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null
  return ALLOWED_ORIGINS.has(origin) ? origin : null
}

export function getCorsHeaders(req: Request) {
  const origin = resolveAllowedOrigin(req.headers.get('origin'))

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'x-request-id',
    Vary: 'Origin',
  }

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

export function getAllowedOriginsSnapshot() {
  return Array.from(ALLOWED_ORIGINS.values())
}
