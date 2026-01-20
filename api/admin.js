export default async function handler(req, res) {
  // CORS headers (same-origin in prod, but useful for local dev)
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, apikey, x-client-info'
  );

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
      },
      body: bodyToSend,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = await response.text();

    console.log(`[api/admin] upstream status=${response.status} contentType=${contentType} bodyLen=${data.length}`);

    res.status(response.status);

    if (contentType.includes('application/json')) {
      try {
        return res.json(JSON.parse(data));
      } catch (e) {
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
