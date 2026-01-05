// utils/reset.js

// 👉 On passe désormais un "simId" pour cibler un seul simulateur
const RESET_EVENT = 'ser1:reset'; // CustomEvent envoyé aux pages { detail: { simId } }

// ----------------- API publique -----------------

/** Clé de stockage par simulateur */
export function storageKeyFor(simId) {
  return `ser1:sim:${simId}`;
}

/** Demande de reset pour un simulateur spécifique (ex: 'placement', 'credit', 'audit') */
export function triggerPageReset(simId) {
  if (!simId) return;
  try {
    // Efface les données persistées du simulateur visé (sessionStorage pour données temporaires)
    const key = storageKeyFor(simId);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
    // Pour l'audit, effacer aussi la clé spécifique
    if (simId === 'audit' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('ser1_audit_draft');
    }
    // Pour la stratégie, effacer aussi la clé spécifique
    if (simId === 'strategy' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('ser1_strategy_draft');
    }
    if (simId === 'placement' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('ser1:placement:lastSaved');
      sessionStorage.removeItem('ser1:placement:lastLoaded');
    }
  } catch {}

  // 2) Notifie UNIQUEMENT l’écran concerné
  try {
    const evt = new CustomEvent(RESET_EVENT, { detail: { simId } });
    window.dispatchEvent(evt);
  } catch {}
}

/**
 * Hook utilitaire côté React pour écouter le reset.
 * Exemple d'usage dans une page :
 *   useEffect(() => onResetEvent(({ simId }) => {
 *     if (simId === 'placement') setState(DEFAULTS)
 *   }), [])
 */
export function onResetEvent(handler) {
  const fn = (e) => handler(e?.detail || {});
  window.addEventListener(RESET_EVENT, fn);
  return () => window.removeEventListener(RESET_EVENT, fn);
}

/**
 * Reset global de tous les simulateurs (ne touche pas aux settings)
 */
export function triggerGlobalReset() {
  const simulators = ['placement', 'credit', 'ir', 'audit', 'strategy'];
  
  simulators.forEach(simId => {
    triggerPageReset(simId);
  });
  
  // Effacer aussi le nom du fichier chargé (sessionStorage)
  try {
    sessionStorage.removeItem('ser1:loadedFilename');
    sessionStorage.removeItem('ser1:lastSavedFilename');
    sessionStorage.removeItem('ser1:placement:lastSaved');
    sessionStorage.removeItem('ser1:placement:lastLoaded');
  } catch {}
}
