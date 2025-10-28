// src/utils/idle.js
export function startIdleTimer({ timeoutMs = 10 * 60 * 1000, onTimeout } = {}) {
  let timerId = null

  const reset = () => {
    if (timerId) clearTimeout(timerId)
    timerId = setTimeout(() => {
      try {
        onTimeout && onTimeout()
      } finally {
        // après le timeout, on arrête d'écouter
        stop()
      }
    }, timeoutMs)
  }

  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

  const onActivity = () => reset()

  const start = () => {
    events.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }))
    reset()
  }

  const stop = () => {
    if (timerId) clearTimeout(timerId)
    timerId = null
    events.forEach(ev => window.removeEventListener(ev, onActivity))
  }

  // auto-démarre
  start()
  return stop
}
