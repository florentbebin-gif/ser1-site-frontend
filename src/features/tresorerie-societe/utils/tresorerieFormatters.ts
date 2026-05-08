export function fmtEuroInput(n: number | undefined): string {
  return Math.round(n || 0).toLocaleString('fr-FR');
}

export function fmtRateInput(rate: number | undefined): string {
  return rate == null ? '' : String(Math.round(rate * 10000) / 100);
}

export function parseEuroInput(value: string): number {
  const clean = value.replace(/\s/g, '').replace(/\D/g, '');
  return clean === '' ? 0 : Math.min(Number(clean), 999_999_999);
}

export function parseNumberInput(value: string): number {
  const clean = value.replace(/[^\d]/g, '');
  return clean === '' ? 0 : Number(clean);
}

export function parsePctInput(value: string): number {
  const clean = value.replace(',', '.').replace(/[^\d.]/g, '');
  if (clean === '') return 0;
  return Math.min(Number(clean), 100);
}

export function parseRateInput(value: string): number {
  return parsePctInput(value) / 100;
}

