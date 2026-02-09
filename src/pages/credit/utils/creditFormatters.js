/**
 * creditFormatters.js - Formatters et utilitaires pour le simulateur de crédit
 * 
 * Extrait depuis Credit.jsx legacy et centralisé ici.
 */

import { toNumber } from '../../../utils/number.js';

// ============================================================================
// FORMATTERS NOMBRES
// ============================================================================

export const fmt0 = (n) => (Math.round(Number(n) || 0)).toLocaleString('fr-FR');
export const euro0 = (n) => fmt0(n) + ' €';
export const toNum = (v) => toNumber(v, 0);

// ============================================================================
// DATES
// ============================================================================

export function nowYearMonth() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

export function addMonths(ym, k) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + k, 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
}

export function labelMonthFR(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${String(m).padStart(2, '0')}/${y}`;
}

export function labelYear(ym) {
  return ym.split('-')[0];
}

export function monthsDiff(a, b) {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

// ============================================================================
// TAUX
// ============================================================================

export function formatTauxInput(raw) {
  let value = raw.replace(',', '.');
  value = value.replace(/[^0-9.]/g, '');
  const parts = value.split('.');
  if (parts.length > 2) value = parts.shift() + '.' + parts.join('');
  return value;
}

export function parseTaux(raw) {
  return toNumber(String(raw).replace(',', '.'));
}

// ============================================================================
// CAPITAL/DURÉE
// ============================================================================

export function parseCapital(value) {
  return toNum(String(value).replace(/\D/g, '').slice(0, 8));
}

export function parseDuree(value) {
  return Math.max(1, toNum(String(value).replace(/\D/g, '').slice(0, 3)));
}

export function parseQuotite(raw) {
  return Math.min(100, Math.max(0, toNum(raw)));
}

// ============================================================================
// ID
// ============================================================================

export function generateId() {
  return Math.random().toString(36).slice(2, 9);
}
