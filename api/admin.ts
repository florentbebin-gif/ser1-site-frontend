type HeaderValue = string | string[] | undefined;

interface AdminRequest {
  method?: string;
  headers: Record<string, HeaderValue>;
  body?: unknown;
}

interface AdminResponse {
  setHeader: (_name: string, _value: string) => void;
  status: (_code: number) => AdminResponse;
  json: (_body: unknown) => void;
  send: (_body: string) => void;
  end: () => void;
}

const ALLOWED_ORIGINS: Array<string | RegExp> = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
  /^https:\/\/.*-ser1.*\.vercel\.app$/,
  /^https:\/\/ser1-.*\.vercel\.app$/,
];

function asHeaderString(value: HeaderValue): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildBody(body: unknown): string {
  if (isRecord(body)) return JSON.stringify(body);
  if (typeof body === 'string') return body;
  return '{}';
}

export default async function handler(req: AdminRequest, res: AdminResponse) {
  const origin = asHeaderString(req.headers.origin);
  const isAllowed = ALLOWED_ORIGINS.some((allowed) =>
    allowed instanceof RegExp ? allowed.test(origin) : allowed === origin,
  );
  const corsOrigin = isAllowed ? origin : '';

  res.setHeader('Vary', 'Origin');
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, apikey, x-client-info, x-request-id',
  );
  res.setHeader('Access-Control-Expose-Headers', 'x-proxy-version, x-admin-version, x-request-id');
  res.setHeader('x-proxy-version', '2026-01-20-v1');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[api/admin] FATAL: Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return res.status(500).json({
      error: 'Server misconfiguration',
      details: 'Missing Supabase environment variables on Vercel',
    });
  }

  const targetUrl = `${supabaseUrl}/functions/v1/admin`;
  const clientApikey = asHeaderString(req.headers.apikey);
  const apikey =
    clientApikey && clientApikey !== 'undefined' && clientApikey !== 'null'
      ? clientApikey
      : supabaseAnonKey;
  const authorization = asHeaderString(req.headers.authorization);
  const requestId = asHeaderString(req.headers['x-request-id']);
  const action = isRecord(req.body) && typeof req.body.action === 'string' ? req.body.action : '';

  console.log(
    `[api/admin] action=${action || '(no action)'} hasAuth=${Boolean(
      authorization,
    )} requestId=${requestId || '(none)'}`,
  );

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        apikey,
        ...(requestId ? { 'x-request-id': requestId } : {}),
      },
      body: buildBody(req.body),
    });

    const upstreamRequestId = response.headers.get('x-request-id');
    const upstreamAdminVersion = response.headers.get('x-admin-version');
    if (upstreamRequestId) res.setHeader('x-request-id', upstreamRequestId);
    if (upstreamAdminVersion) res.setHeader('x-admin-version', upstreamAdminVersion);

    const contentType = response.headers.get('content-type') || '';
    const data = await response.text();
    console.log(
      `[api/admin] upstream status=${response.status} contentType=${contentType} bodyLen=${data.length} requestId=${
        upstreamRequestId || requestId || '(none)'
      }`,
    );

    res.status(response.status);
    if (!contentType.includes('application/json')) {
      return res.send(data);
    }

    try {
      return res.json(JSON.parse(data));
    } catch {
      return res.send(data);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur proxy inconnue';
    console.error('[api/admin] Proxy fetch error:', error);
    return res.status(500).json({ error: 'Proxy error', details: message });
  }
}
