import { COORDS_CONTENT, COORDS_FOOTER } from '../designSystem/serenity';

export const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
export const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;

export const PLACEMENT_DETAIL_PANEL = {
  gap: 0.4,
  marginX: 0.9,
  get totalW() {
    return 13.3333 - 2 * this.marginX;
  },
  get panelW() {
    return (this.totalW - this.gap) / 2;
  },
  topY: CONTENT_TOP_Y + 0.08,
  get height() {
    return CONTENT_BOTTOM_Y - this.topY - 0.08;
  },
  bandeauH: 0.38,
  heroH: 0.8,
  flowBarH: 0.68,
  metricIconSize: 0.24,
  metricPaddingX: 0.2,
} as const;

export function lightenHex(hex: string, pct: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
  return `${toHex(r + (255 - r) * pct)}${toHex(g + (255 - g) * pct)}${toHex(b + (255 - b) * pct)}`;
}

export function contrastText(bgHex: string): string {
  const clean = bgHex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
}

export const formatPlacementMoney = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
