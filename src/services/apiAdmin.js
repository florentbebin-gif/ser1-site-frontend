import { supabase } from '../supabaseClient';

/**
 * Appelle la Edge Function admin via /api/admin.
 * - En LOCAL: Vite proxy → Edge Function
 * - En PROD: Vercel serverless → Edge Function
 * 
 * @param {string} action - Nom de l'action admin
 * @param {object} payload - Paramètres additionnels
 * @returns {{ data: any, error: { message: string } | null }}
 */
export async function invokeAdmin(action, payload = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return { data: null, error: { message: 'Non authentifié' } };
    }

    // Toujours utiliser /api/admin - Vite proxy en local, Vercel en prod
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload })
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    let data;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { 
        _rawText: text,
        error: `Réponse non-JSON (${response.status}): ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`
      };
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?._rawText?.slice(0, 200) || `Erreur serveur (${response.status})`;
      return { data: null, error: { message: errorMsg } };
    }

    return { data, error: null };

  } catch (err) {
    return { data: null, error: { message: err.message || 'Erreur réseau' } };
  }
}
