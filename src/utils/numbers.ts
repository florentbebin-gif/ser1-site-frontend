/**
 * Helpers numériques partagés.
 *
 * Source unique pour parser les saisies et formater les entiers affichés.
 */

type NumericLike = number | string | null | undefined;

export function toNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined) return fallback;
  const parsed = Number.parseFloat(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const formatInteger = (value: NumericLike): string =>
  Math.round(Number(value) || 0).toLocaleString('fr-FR');

export const formatIntegerInput = (value: NumericLike): string => {
  const numericValue = Number(value) || 0;
  return numericValue === 0 ? '' : Math.round(numericValue).toLocaleString('fr-FR');
};
