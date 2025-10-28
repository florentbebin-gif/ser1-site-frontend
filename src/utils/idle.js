/// Démarre un timer d’inactivité. Appelle onTimeout après timeoutMs sans activité.
// Retourne une fonction stop() pour retirer les écouteurs.
export function startIdleTimer({ timeoutMs = 10 * 60 * 1000, onTimeout }) {
  let timer = null
  const events = ['mousemove','mousedown','keydown','touchstart','scroll','visibilitychange']

  function reset() {
    if (document.visibilityState === 'hidden') return
    clearTimeout(timer)
    timer = setTimeout(() => onTimeout?.(), timeoutMs)
  }

  function add()  { events.forEach(e => window.addEventListener(e, reset, { passive: true })) }
  function remove(){ events.forEach(e => window.removeEventListener(e, reset)) }

  add(); reset()

  return () => { clearTimeout(timer); remove() }
}

