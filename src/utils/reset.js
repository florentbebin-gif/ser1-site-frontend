const RESET_EVENT = 'ser1:reset'

export function clearAllUserInputs(){
  const isParamsPage = window.location.pathname.startsWith('/params')

  // Si on est sur "Paramètres", ne rien effacer
  if (isParamsPage) {
    alert("Le reset est désactivé sur la page Paramètres.")
    return
  }

  // 1️⃣ Réinitialise le stockage des simulateurs seulement
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('ser1:sim:')) localStorage.removeItem(k)
  })

  // 2️⃣ Efface les contenus visibles dans la page (inputs)
  document.querySelectorAll('input').forEach(input => {
    if (input.type === 'number' || input.type === 'text') {
      input.value = ''
    }
  })

  // 3️⃣ Préviens les composants React qu’ils doivent se rafraîchir
  window.dispatchEvent(new CustomEvent(RESET_EVENT))
}

export function onResetEvent(handler){
  const fn = () => handler()
  window.addEventListener(RESET_EVENT, fn)
  return () => window.removeEventListener(RESET_EVENT, fn)
}

export function storageKeyFor(simId){
  return `ser1:sim:${simId}`
}
