import { supabase } from '../supabaseClient';

/**
 * Appelle la Edge Function admin.
 * - En LOCAL (npm run dev): utilise supabase.functions.invoke() directement
 * - En PROD (Vercel): utilise /api/admin proxy
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

    // En local: utiliser le SDK Supabase directement (évite les problèmes de proxy)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
      // Appel direct via SDK Supabase
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action, ...payload },
      });
      
      if (error) {
        return { data: null, error: { message: error.message } };
      }
      return { data, error: null };
    }

    // En production: utiliser le proxy Vercel /api/admin
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
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
