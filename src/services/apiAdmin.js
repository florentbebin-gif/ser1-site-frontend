import { supabase } from '../supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Appelle la Edge Function admin.
 * - En LOCAL: fetch direct vers Edge Function (headers minimaux)
 * - En PROD: /api/admin proxy Vercel
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

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // URL cible: Edge Function directe en local, proxy en prod
    const url = isLocal 
      ? `${SUPABASE_URL}/functions/v1/admin`
      : '/api/admin';

    // Headers minimaux pour éviter 431 et CORS issues
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
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
