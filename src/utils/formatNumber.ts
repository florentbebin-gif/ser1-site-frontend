/**
 * Fonctions de formatage des nombres (séparateur de milliers FR).
 * Source unique — ne pas dupliquer dans les features.
 */

type NumericLike = number | string | null | undefined;

/**
 * Formate un entier avec séparateur de milliers (fr-FR).
 * 0 → "0". Usage : cellules de tableau, résultats d'affichage.
 */
export const formatInteger = (n: NumericLike): string =>
  Math.round(Number(n) || 0).toLocaleString('fr-FR');

/**
 * Formate un entier pour affichage dans un champ de saisie.
 * 0 → "" (champ vide). Usage : inputs numériques.
 */
export const formatIntegerInput = (n: NumericLike): string => {
  const num = Number(n) || 0;
  return num === 0 ? '' : Math.round(num).toLocaleString('fr-FR');
};

/**
 * Formate un pourcentage avec séparateur fr-FR.
 * Exemple : formatPct(2.5) → "2,50"
 */
export const formatPct = (n: number, decimals = 2): string =>
  n.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
