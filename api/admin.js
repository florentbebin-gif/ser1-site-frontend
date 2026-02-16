/* eslint-env node */
/* global process */
/* eslint-disable no-console */

export default async function handler(req, res) {
  // === CORS: Whitelist strict pour production ===
  const allowedOrigins = [
    // Développement local
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:3000',
    // Vercel previews et production (pattern match)
    /^https:\/\/.*-ser1.*\.vercel\.app$/,
    /^https:\/\/ser1-.*\.vercel\.app$/,
  ];

  const origin = req.headers.origin || '';
  const isAllowed = allowedOrigins.some((allowed) =>
    allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
  );

  // IMPORTANT: ne JAMAIS renvoyer `*` avec credentials=true (bloqué par les navigateurs)
  // On ne renvoie les headers CORS que si l'origin est explicitement autorisée.
  const corsOrigin = isAllowed ? origin : '';

  // Ensure caches/CDN keep per-origin variants.
  res.setHeader('Vary', 'Origin');

  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, apikey, x-client-info, x-request-id'
  );

  // Permet au front de lire les headers de diagnostic.
  res.setHeader('Access-Control-Expose-Headers', 'x-proxy-version, x-admin-version, x-request-id');

  // === VERSION HEADER (diagnostic) ===
  res.setHeader('x-proxy-version', '2026-01-20-v1');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // === ENV VARS (Vercel uses non-VITE_ prefixes) ===
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[api/admin] FATAL: Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return res.status(500).json({ 
      error: 'Server misconfiguration', 
      details: 'Missing Supabase environment variables on Vercel' 
    });
  }

  const targetUrl = `${supabaseUrl}/functions/v1/admin`;

  // === APIKEY: ignore undefined/null/empty from client, use server env ===
  let clientApikey = req.headers.apikey;
  if (!clientApikey || clientApikey === 'undefined' || clientApikey === 'null') {
    clientApikey = null;
  }
  const apikey = clientApikey || supabaseAnonKey;

  // === BODY: safe forwarding ===
  let bodyToSend;
  if (req.body && typeof req.body === 'object') {
    bodyToSend = JSON.stringify(req.body);
  } else if (typeof req.body === 'string') {
    bodyToSend = req.body;
  } else {
    bodyToSend = '{}';
  }

  // === DIAGNOSTIC LOGS (no secrets) ===
  const action = req.body?.action || '(no action)';
  const hasAuth = !!req.headers.authorization;
  const apikeyPreview = apikey ? `${apikey.slice(0, 10)}...` : '(none)';
  console.log(`[api/admin] action=${action} hasAuth=${hasAuth} apikey=${apikeyPreview} target=${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        'apikey': apikey,
        // Optional: allow frontend (or scripts) to correlate logs with the Edge Function.
        ...(req.headers['x-request-id'] ? { 'x-request-id': req.headers['x-request-id'] } : {}),
      },
      body: bodyToSend,
    });

    // Forward upstream diagnostics (useful to correlate issues without exposing secrets)
    const upstreamRequestId = response.headers.get('x-request-id');
    const upstreamAdminVersion = response.headers.get('x-admin-version');
    if (upstreamRequestId) res.setHeader('x-request-id', upstreamRequestId);
    if (upstreamAdminVersion) res.setHeader('x-admin-version', upstreamAdminVersion);

    const contentType = response.headers.get('content-type') || '';
    const data = await response.text();

    console.log(`[api/admin] upstream status=${response.status} contentType=${contentType} bodyLen=${data.length}`);

    res.status(response.status);

    if (contentType.includes('application/json')) {
      try {
        return res.json(JSON.parse(data));
      } catch (_e) {
        return res.send(data);
      }
    } else {
      return res.send(data);
    }

  } catch (error) {
    console.error('[api/admin] Proxy fetch error:', error);
    return res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
