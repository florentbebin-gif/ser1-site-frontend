/**
 * Utilitaires de formatage pour le simulateur de crédit.
 */

import { toNumber } from '../../../utils/number';
import { formatInteger } from '@/utils/formatNumber';

// ============================================================================
// FORMATTERS NOMBRES
// ============================================================================

export const fmt0 = formatInteger;

export const euro0 = (n: number | string | null | undefined): string => `${fmt0(n)} €`;

export const toNum = (v: string | number | null | undefined): number => toNumber(v, 0);

// ============================================================================
// DATES
// ============================================================================

export function nowYearMonth(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

export function addMonths(ym: string, k: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + k, 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
}

export function labelMonthFR(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${String(m).padStart(2, '0')}/${y}`;
}

export function monthsDiff(a: string, b: string): number {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

// ============================================================================
// TAUX
// ============================================================================

export function formatTauxInput(raw: string): string {
  let value = raw.replace(',', '.');
  value = value.replace(/[^0-9.]/g, '');
  const parts = value.split('.');
  if (parts.length > 2) value = parts.shift() + '.' + parts.join('');
  return value;
}

export function parseTaux(raw: string | number): number {
  return toNumber(String(raw).replace(',', '.'));
}

// ============================================================================
// CAPITAL
// ============================================================================

export function parseCapital(value: string | number): number {
  return toNum(String(value).replace(/\D/g, '').slice(0, 8));
}

// ============================================================================
// ID
// ============================================================================

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}
