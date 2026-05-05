/**
 * isValidators.ts
 *
 * Validateurs spécifiques à l'IS : quote-part frais et charges (QPFC) régime mère-fille.
 * Pattern identique à dmtgValidators.ts.
 */

interface QpfcRates {
  standard: number | null | undefined;
  group: number | null | undefined;
}

/**
 * Valide les taux QPFC (quote-part frais et charges) régime mère-fille.
 *
 * Règles :
 * - Chaque taux doit être dans [0, 100]
 * - Le taux standard doit être ≥ au taux groupe (standard ≥ group)
 *   car le régime groupe est plus favorable (taux plus bas)
 *
 * @returns {string|null} message d'erreur ou null si valide
 */
export function validateQpfcRate(qpfc: QpfcRates): string | null {
  const std = qpfc.standard == null ? null : Number(qpfc.standard);
  const grp = qpfc.group == null ? null : Number(qpfc.group);

  if (std !== null) {
    if (Number.isNaN(std)) return 'Le taux standard doit être un nombre.';
    if (std < 0 || std > 100) return 'Le taux standard doit être entre 0 et 100.';
  }
  if (grp !== null) {
    if (Number.isNaN(grp)) return 'Le taux groupe doit être un nombre.';
    if (grp < 0 || grp > 100) return 'Le taux groupe doit être entre 0 et 100.';
  }
  if (std !== null && grp !== null && std < grp) {
    return 'Le taux standard doit être supérieur ou égal au taux groupe (le régime groupe est plus favorable).';
  }
  return null;
}
