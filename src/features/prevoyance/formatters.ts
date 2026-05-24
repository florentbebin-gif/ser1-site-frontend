export function euro(value: number): string {
  return `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} €`;
}

export function pct(value: number): string {
  return `${(Number(value) || 0).toLocaleString('fr-FR', {
    maximumFractionDigits: 1,
  })} %`;
}

export function numberValue(value: unknown): number {
  const normalized = String(value ?? '')
    .replace(/\s/g, '')
    .replace(',', '.');
  return Math.max(0, Number(normalized) || 0);
}
