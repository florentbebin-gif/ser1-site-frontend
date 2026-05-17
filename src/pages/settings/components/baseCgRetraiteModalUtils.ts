export function updateText(value: string): string | null {
  return value.trim() ? value : null;
}

export function parseRatePercent(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed / 100 : null;
}

export function formatRatePercent(rate: number | null | undefined): string {
  return typeof rate === 'number' && Number.isFinite(rate) ? String(rate * 100) : '';
}

export function formatRateLabel(rate: number | null): string | null {
  if (rate === null) return null;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(rate * 100)} %`;
}

// Taux pouvant venir du catalogue en string ("0,65 %") ou en number (0.0065).
// L'input modale affiche toujours un libellé "X,XX %" lisible et stocke en décimal au commit.
export function rateInputValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value * 100)} %`;
  }
  return String(value);
}

export function commitRate(value: string): string | number | null {
  if (!value.trim()) return null;
  // On accepte "0,65", "0,65 %", "0.65%". Le `%` et les espaces sont nettoyés, virgule fr-FR convertie.
  const cleaned = value.replace(/%|\s/g, '').replace(',', '.');
  const parsed = Number(cleaned);
  // Si la saisie est un nombre pur, on stocke en décimal (0.0065). Sinon on conserve le texte (rare).
  if (Number.isFinite(parsed)) return parsed / 100;
  return value.trim();
}

export function formatFieldValue(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

export function parseOptionalInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
