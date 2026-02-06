/**
 * settingsHelpers.js
 *
 * Fonctions pures partagées par les pages Settings (Prélèvements, Impôts, Fiscalités).
 * Phase 1 — extraction sans changement de comportement.
 */

/**
 * Convertit une valeur numérique en chaîne pour un <input type="number">.
 * null / undefined / NaN → '' (champ vide).
 */
export function numberOrEmpty(v) {
  return v === null || v === undefined || Number.isNaN(v) ? '' : String(v);
}

/**
 * Convertit une valeur texte pour un <input type="text">.
 * null / undefined → '' (champ vide).
 */
export function textOrEmpty(v) {
  return v === null || v === undefined ? '' : String(v);
}

/**
 * Crée un helper `updateField(path, value)` lié à un setter React et un setMessage.
 *
 * Utilise structuredClone + navigation par path array.
 * Crée automatiquement les nœuds intermédiaires manquants (null/undefined → {}).
 *
 * @param {Function} setData   - Le setter React (ex: setSettings)
 * @param {Function} setMessage - Le setter du message de feedback
 * @returns {(path: string[], value: any) => void}
 */
export function createFieldUpdater(setData, setMessage) {
  return (path, value) => {
    setData((prev) => {
      const clone = structuredClone(prev);
      let obj = clone;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (obj[k] === undefined || obj[k] === null) obj[k] = {};
        obj = obj[k];
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };
}
