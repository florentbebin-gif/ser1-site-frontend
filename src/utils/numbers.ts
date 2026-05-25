/**
 * Helpers numériques partagés.
 *
 * Source unique pour parser les saisies et formater les entiers affichés.
 */

type NumericLike = number | string | null | undefined;

interface DecimalInputFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

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

function normalizeDecimalInput(value: string): string {
  const compact = value
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(/[€%]/g, '');

  if (!compact) return '';

  const sign = compact.startsWith('-') ? '-' : compact.startsWith('+') ? '+' : '';
  const unsigned = compact.replace(/[+-]/g, '');
  const commaIndex = unsigned.lastIndexOf(',');
  const dotIndex = unsigned.lastIndexOf('.');
  const hasMultipleDots = unsigned.split('.').length > 2;

  const decimalSeparator =
    commaIndex >= 0 ? ',' : dotIndex >= 0 && !hasMultipleDots ? '.' : undefined;

  if (!decimalSeparator) {
    const digits = unsigned.replace(/\D/g, '');
    return digits ? `${sign}${digits}` : '';
  }

  const separatorIndex =
    decimalSeparator === ',' ? unsigned.lastIndexOf(',') : unsigned.lastIndexOf('.');
  const integerPart = unsigned.slice(0, separatorIndex).replace(/\D/g, '');
  const decimalPart = unsigned.slice(separatorIndex + 1).replace(/\D/g, '');
  const normalizedInteger = integerPart || '0';

  return decimalPart ? `${sign}${normalizedInteger}.${decimalPart}` : `${sign}${normalizedInteger}`;
}

export function parseDecimalInput(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (value === null || value === undefined) return fallback;

  const normalized = normalizeDecimalInput(String(value));
  if (!normalized) return fallback;

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parsePercentInput(value: unknown, fallback: number = 0): number {
  return parseDecimalInput(value, fallback);
}

export const formatDecimalInput = (
  value: NumericLike,
  options: DecimalInputFormatOptions = {},
): string => {
  const numericValue = toNumber(value, 0);
  const minimumFractionDigits = options.minimumFractionDigits ?? 0;
  const maximumFractionDigits = Math.max(minimumFractionDigits, options.maximumFractionDigits ?? 6);

  return numericValue === 0
    ? ''
    : numericValue.toLocaleString('fr-FR', { minimumFractionDigits, maximumFractionDigits });
};

export const formatPercentInput = formatDecimalInput;
