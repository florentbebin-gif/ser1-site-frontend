import { supabase } from '../../supabaseClient';

interface AdminError {
  message: string;
}

interface AdminResponse {
  data: unknown;
  error: AdminError | null;
}

interface NonJsonResponsePayload {
  _rawText: string;
  error: string;
}

function getAdminErrorMessage(data: unknown, status: number): string {
  if (typeof data !== 'object' || data === null) {
    return `Erreur serveur (${status})`;
  }

  const payload = data as Partial<NonJsonResponsePayload> & { error?: unknown };
  if (typeof payload.error === 'string' && payload.error) {
    return payload.error;
  }
  if (typeof payload._rawText === 'string' && payload._rawText) {
    return payload._rawText.slice(0, 200);
  }
  return `Erreur serveur (${status})`;
}

/**
 * Appelle la Edge Function admin via /api/admin.
 * - En LOCAL: Vite proxy -> Edge Function
 * - En PROD: Vercel serverless -> Edge Function
 */
export async function invokeAdmin(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<AdminResponse> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { data: null, error: { message: 'Non authentifi\u00e9' } };
    }

    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let data: unknown;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = {
        _rawText: text,
        error: `R\u00e9ponse non-JSON (${response.status}): ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`,
      } satisfies NonJsonResponsePayload;
    }

    if (!response.ok) {
      return {
        data: null,
        error: { message: getAdminErrorMessage(data, response.status) },
      };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'Erreur r\u00e9seau' },
    };
  }
}
