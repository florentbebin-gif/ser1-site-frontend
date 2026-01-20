import { supabase } from '../supabaseClient';

/**
 * Appelle l'API proxy /api/admin qui relai vers la Supabase Edge Function.
 * Cela évite les problèmes CORS en passant par le serveur Vercel (Same-Origin).
 * 
 * @param {string} action - Nom de l'action admin (list_users, create_user_invite, etc.)
 * @param {object} payload - Paramètres additionnels pour l'action
 * @returns {{ data: any, error: { message: string } | null }}
 */
export async function invokeAdmin(action, payload = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return { data: null, error: { message: 'Non authentifié' } };
    }

    // Build headers - NEVER send apikey if undefined/empty (server will use its own)
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
    
    // Only add apikey header if we have a valid value
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (anonKey && anonKey !== 'undefined' && anonKey !== 'null') {
      headers['apikey'] = anonKey;
    }

    // Normalize body: always {action, ...payload}
    const body = { action, ...payload };

    const response = await fetch('/api/admin', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    let data;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      // For non-JSON responses, include a snippet in the error
      data = { 
        _rawText: text,
        error: `Réponse non-JSON (${response.status}): ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`
      };
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?._rawText?.slice(0, 200) || `Erreur serveur (${response.status})`;
      return { 
        data: null, 
        error: { message: errorMsg } 
      };
    }

    return { data, error: null };

  } catch (err) {
    return { data: null, error: { message: err.message || 'Erreur réseau' } };
  }
}
