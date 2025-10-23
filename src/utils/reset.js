const RESET_EVENT = 'ser1:reset'
export function clearAllUserInputs(){
  Object.keys(localStorage).forEach(k => { if(k.startsWith('ser1:sim:')) localStorage.removeItem(k) })
  window.dispatchEvent(new CustomEvent(RESET_EVENT))
}
export function onResetEvent(handler){
  const fn = () => handler()
  window.addEventListener(RESET_EVENT, fn)
  return () => window.removeEventListener(RESET_EVENT, fn)
}
export function storageKeyFor(simId){ return `ser1:sim:${simId}` }
