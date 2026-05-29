const HEX_COLOR_RE = /^#([0-9a-f]{6})$/i;

function normalizeHex(hex: string): string {
  const value = hex.trim();
  if (!HEX_COLOR_RE.test(value)) {
    throw new Error(`Couleur hex invalide pour le contraste : ${hex}`);
  }
  return value.toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex).slice(1);
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

export function getContrastRating(ratio: number): 'AA' | 'À vérifier' {
  return ratio >= 4.5 ? 'AA' : 'À vérifier';
}
