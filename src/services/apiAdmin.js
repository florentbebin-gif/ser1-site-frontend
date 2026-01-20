import { supabase } from '../supabaseClient';

/**
 * Appelle l'API proxy /api/admin qui relai vers la Supabase Edge Function.
 * Cela évite les problèmes CORS en passant par le serveur Vercel (Same-Origin).
 */
export async function invokeAdmin(action, payload = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return { data: null, error: { message: 'Non authentifié' } };
    }

    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        // L'API Key est gérée côté serveur (Vercel) via env var, 
        // ou on peut l'envoyer si besoin, mais mieux vaut le cacher.
        // On l'envoie ici au cas où le proxy attendrait explicitement un header apikey du client
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        action,
        ...payload
      })
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      return { 
        data: null, 
        error: { 
          message: (data && data.error) || `Erreur serveur (${response.status})` 
        } 
      };
    }

    return { data, error: null };

  } catch (err) {
    return { data: null, error: { message: err.message || 'Erreur réseau' } };
  }
}
