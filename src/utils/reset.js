// utils/reset.js
const RESET_EVENT = 'ser1:reset'
const RESET_PENDING_KEY = 'ser1:reset:pending' // jeton pour éviter tout reset non-intentionnel

/**
 * À appeler depuis le bouton "Reset" (App.jsx).
 */
export function triggerReset() {
  try { sessionStorage.setItem(RESET_PENDING_KEY, '1') } catch {}
  clearAllUserInputs(true)
}

/**
 * N'effectue le reset QUE si :
 *  - fromUserClick === true (appel depuis triggerReset), OU
 *  - un jeton 'pending' est présent (sécurité au cas où).
 *
 * IMPORTANT : on NE touche PAS aux <input> du DOM. Les pages
 * écoutent l'évènement RESET_EVENT et remettent leurs states.
 */
export function clearAllUserInputs(fromUserClick = false) {
  const pending =
    fromUserClick ||
    (typeof sessionStorage !== 'undefined' &&
     sessionStorage.getItem(RESET_PENDING_KEY) === '1')

  if (!pending) return

  // Ne pas réinitialiser sur la page Paramètres
  const isParamsPage = window.location.pathname.startsWith('/params')
  if (isParamsPage) {
    alert('Le reset est désactivé sur la page Paramètres.')
    try { sessionStorage.removeItem(RESET_PENDING_KEY) } catch {}
    return
  }

  // 1) Efface uniquement les données persistées des simulateurs
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('ser1:sim:')) localStorage.removeItem(k)
    })
  } catch {}

  // 2) Notifie les écrans (React écoute RESET_EVENT via onResetEvent)
  try {
    window.dispatchEvent(new CustomEvent(RESET_EVENT))
  } catch {}

  // 3) Consomme le jeton
  try { sessionStorage.removeItem(RESET_PENDING_KEY) } catch {}
}

/**
 * Hook utilitaire côté React pour écouter le reset.
 * Exemple d'usage dans une page :
 *   useEffect(() => onResetEvent(() => setState(DEFAULTS)), [])
 */
export function onResetEvent(handler){
  const fn = () => handler()
  window.addEventListener(RESET_EVENT, fn)
  return () => window.removeEventListener(RESET_EVENT, fn)
}

/** Génère une clé de stockage cohérente par simulateur */
export function storageKeyFor(simId){
  return `ser1:sim:${simId}`
}
