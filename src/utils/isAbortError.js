/**
 * Helper pour détecter les AbortError de manière robuste
 * Utilisé pour traiter les AbortError comme des événements non bloquants
 */

export function isAbortError(error) {
  if (!error) return false;
  
  // Cas 1: name === 'AbortError'
  if (error.name === 'AbortError') return true;
  
  // Cas 2: message contient "signal is aborted" ou "aborted"
  if (typeof error.message === 'string') {
    const msg = error.message.toLowerCase();
    if (msg.includes('aborted') || msg.includes('signal is aborted')) {
      return true;
    }
  }
  
  // Cas 3: DOMException avec name 'AbortError'
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  
  return false;
}

/**
 * Logger pour les AbortError (activé via flags de debug)
 */
export function logAbortError(error, context = '') {
  const isDebug = (
    typeof window !== 'undefined' && (
      window.localStorage?.getItem('SER1_DEBUG_AUTH') === '1' ||
      window.localStorage?.getItem('SER1_DEBUG_ADMIN') === '1' ||
      window.localStorage?.getItem('SER1_DEBUG_ADMIN_FETCH') === '1'
    )
  );
  
  if (isDebug) {
    // eslint-disable-next-line no-console
    console.debug(`[ABORT_ERROR] Ignored${context ? ` in ${context}` : ''}`, {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n')?.slice(0, 2)
    });
  }
}
