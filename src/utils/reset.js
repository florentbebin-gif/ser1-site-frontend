// utils/reset.js
const RESET_EVENT = 'ser1:reset'
const RESET_PENDING_KEY = 'ser1:reset:pending' // jeton anti-reset involontaire

/**
 * À appeler depuis le bouton "Reset" de la topbar.
 * Exemple : onClick={() => triggerReset()}
 */
export function triggerReset() {
  // Marque le reset comme explicitement demandé par l'utilisateur
  try { sessionStorage.setItem(RESET_PENDING_KEY, '1') } catch {}
  // Exécute immédiatement le reset
  clearAllUserInputs(true)
}

/**
 * Effectue le reset SEULEMENT s'il a été explicitement demandé (jeton présent),
 * ou si fromUserClick === true (appel direct depuis triggerReset()).
 */
export function clearAllUserInputs(fromUserClick = false) {
  const pending =
    fromUserClick ||
    (typeof sessionStorage !== 'undefined' &&
     sessionStorage.getItem(RESET_PENDING_KEY) === '1')

  // Si le reset n'a pas été demandé, on sort sans rien faire
  if (!pending) return

  // Ne pas réinitialiser sur la page Paramètres
  const isParamsPage = window.location.pathname.startsWith('/params')
  if (isParamsPage) {
    alert('Le reset est désactivé sur la page Paramètres.')
    try { sessionStorage.removeItem(RESET_PENDING_KEY) } catch {}
    return
  }

  // 1) Réinitialise le stockage des simulateurs seulement
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('ser1:sim:')) localStorage.removeItem(k)
    })
  } catch {}

  // 2) Efface les contenus visibles dans la page (inputs)
  //    + déclenche un event 'input' pour que React mette à jour si nécessaire
  document
    .querySelectorAll('input[type="number"], input[type="text"]')
    .forEach((input) => {
      input.value = ''
      try {
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      } catch {}
    })

  // 3) Notifie React (les écrans écoutent cet event via onResetEvent)
  window.dispatchEvent(new CustomEvent(RESET_EVENT))

  // 4) Consomme le jeton
  try { sessionStorage.removeItem(RESET_PENDING_KEY) } catch {}
}

/**
 * Hook utilitaire côté React pour écouter le reset.
 * Usage:
 *   useEffect(() => onResetEvent(() => { ...reset states... }), [])
 */
export function onResetEvent(handler) {
  const fn = () => handler()
  window.addEventListener(RESET_EVENT, fn)
  return () => window.removeEventListener(RESET_EVENT, fn)
}

export function storageKeyFor(simId) {
  return `ser1:sim:${simId}`
}
