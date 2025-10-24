// utils/reset.js
const RESET_EVENT = 'ser1:reset'
const RESET_PENDING_KEY = 'ser1:reset:pending'

// ✅ Fonction appelée UNIQUEMENT par le bouton Reset
export function triggerReset() {
  try { sessionStorage.setItem(RESET_PENDING_KEY, '1') } catch {}
  clearAllUserInputs(true)
}

/**
 * Efface uniquement si un reset a été explicitement demandé,
 * ou si fromUserClick == true (cas du bouton).
 */
export function clearAllUserInputs(fromUserClick = false) {
  const pending =
    fromUserClick ||
    (typeof sessionStorage !== 'undefined' &&
     sessionStorage.getItem(RESET_PENDING_KEY) === '1')

  // ❌ Arrêt immédiat si reset non demandé
  if (!pending) return

  const isParamsPage = window.location.pathname.startsWith('/params')
  if (isParamsPage) {
    alert("Le reset est désactivé sur la page Paramètres.")
    try { sessionStorage.removeItem(RESET_PENDING_KEY) } catch {}
    return
  }

  // ✅ Effacer seulement les données des simulateurs
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('ser1:sim:')) localStorage.removeItem(k)
    })
  } catch {}

  // ✅ Effacer les champs visibles + notifier React par events input/change
  document
    .querySelectorAll('input[type="number"], input[type="text"]')
    .forEach(input => {
      input.value = ''
      try {
        input.dispatchEvent(new Event('input', { bubbles:true }))
        input.dispatchEvent(new Event('change', { bubbles:true }))
      } catch {}
    })

  // ✅ Informer les composants React d’un reset
  window.dispatchEvent(new CustomEvent(RESET_EVENT))

  // ✅ Reset consommé → on supprime le jeton
  try { sessionStorage.removeItem(RESET_PENDING_KEY) } catch {}
}

// Hook d’écoute dans les pages
export function onResetEvent(handler){
  const fn = () => handler()
  window.addEventListener(RESET_EVENT, fn)
  return () => window.removeEventListener(RESET_EVENT, fn)
}

export function storageKeyFor(simId){
  return `ser1:sim:${simId}`
}
