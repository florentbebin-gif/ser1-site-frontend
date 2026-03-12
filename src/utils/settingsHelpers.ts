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
export function numberOrEmpty(v: number | null | undefined): string {
  return v === null || v === undefined || Number.isNaN(v) ? '' : String(v);
}

/**
 * Convertit une valeur texte pour un <input type="text">.
 * null / undefined → '' (champ vide).
 */
export function textOrEmpty(v: string | null | undefined): string {
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
type NestedRecord = Record<string, unknown>;
export function createFieldUpdater(
  setData: (updater: (prev: NestedRecord) => NestedRecord) => void,
  setMessage: (msg: string) => void,
): (path: string[], value: unknown) => void {
  return (path, value) => {
    setData((prev) => {
      const clone = structuredClone(prev) as NestedRecord;
      let obj: NestedRecord = clone;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (obj[k] === undefined || obj[k] === null) obj[k] = {};
        obj = obj[k] as NestedRecord;
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
    setMessage('');
  };
}
