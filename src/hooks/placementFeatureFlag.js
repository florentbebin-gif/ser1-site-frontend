/**
 * Placement feature-flag helpers (P1-06)
 */

/**
 * Resolve VITE_USE_BASE_CONTRAT_FOR_PLACEMENT with default ON.
 * - undefined / empty => true
 * - explicit "false" => false
 * - any other value => true
 */
export function resolvePlacementBaseContratFlag(rawFlag) {
  if (rawFlag == null || rawFlag === '') return true;
  return String(rawFlag).trim().toLowerCase() !== 'false';
}
