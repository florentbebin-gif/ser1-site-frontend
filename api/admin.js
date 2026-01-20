export default async function handler(req, res) {
  // Config CORS pour la route API (utile si appel cross-origin, sinon ignoré en same-origin)
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, apikey, x-client-info'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // URL cible de la Edge Function Supabase
  const projectUrl = process.env.VITE_SUPABASE_URL || 'https://xnpbxrqkzgimiugqtago.supabase.co';
  const targetUrl = `${projectUrl}/functions/v1/admin`;

  try {
    // Forward de la requête
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        'apikey': req.headers.apikey || process.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.status(response.status);

    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      res.send(data);
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
