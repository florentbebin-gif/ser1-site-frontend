/**
 * Debug Flags Helper
 * 
 * Standardise l'activation des flags de debug via:
 * - Variables d'environnement VITE_DEBUG_* (prioritaire)
 * - localStorage SER1_DEBUG_* (fallback)
 * 
 * Usage:
 *   if (isDebugEnabled('auth')) console.debug('[Auth] ...')
 *   if (isDebugEnabled('pptx')) console.debug('[PPTX] ...')
 */

export type DebugFlag = 'auth' | 'pptx' | 'admin' | 'admin_fetch' | 'comptes' | 'theme';

/**
 * Vérifie si un flag de debug est activé
 * Lit dans l'ordre : import.meta.env.VITE_DEBUG_* > localStorage SER1_DEBUG_*
 */
export function isDebugEnabled(flag: DebugFlag): boolean {
  if (typeof window === 'undefined') return false;

  const envKey = `VITE_DEBUG_${flag.toUpperCase()}`;
  const envValue = import.meta.env?.[envKey];
  if (envValue === '1' || envValue === 'true' || envValue === true) {
    return true;
  }

  const lsKey = `SER1_DEBUG_${flag.toUpperCase()}`;
  const lsValue = window.localStorage?.getItem(lsKey);
  if (lsValue === '1' || lsValue === 'true') {
    return true;
  }

  return false;
}

/**
 * Logger conditionnel pour debug
 * Usage : debugLog('auth', 'message', { data })
 */
export function debugLog(flag: DebugFlag, message: string, ...args: unknown[]): void {
  if (isDebugEnabled(flag)) {
    // eslint-disable-next-line no-console
    console.debug(`[${flag.toUpperCase()}] ${message}`, ...args);
  }
}

/**
 * Alias spécifiques pour compatibilité avec le code existant
 */
export const DEBUG_AUTH = isDebugEnabled('auth');
export const DEBUG_PPTX = isDebugEnabled('pptx');
