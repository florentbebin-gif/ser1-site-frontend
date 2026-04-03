import type { PptxThemeRoles } from '../theme/types';
import { COORDS_CONTENT } from '../designSystem/serenity';

export interface IrSynthesisData {
  income1: number;
  income2: number;
  isCouple: boolean;
  taxableIncome: number;
  partsNb: number;
  tmiRate: number;
  irNet: number;
  taxablePerPart: number;
  bracketsDetails?: Array<{ label: string; base: number; rate: number; tax: number }>;
  tmiBaseGlobal?: number;
  tmiMarginGlobal?: number | null;
}

export const TMI_BRACKETS = [
  { rate: 0, min: 0, max: 11_294, label: '0%' },
  { rate: 11, min: 11_294, max: 28_797, label: '11%' },
  { rate: 30, min: 28_797, max: 82_341, label: '30%' },
  { rate: 41, min: 82_341, max: 177_106, label: '41%' },
  { rate: 45, min: 177_106, max: Infinity, label: '45%' },
] as const;

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const VERTICAL_SHIFT = 0.40;
const KPI_TO_BAR_GAP = 0.30;
const CURSOR_TO_CONTENT_GAP = 0.42;

export const LAYOUT = {
  marginX: COORDS_CONTENT.margin.x,
  contentWidth: COORDS_CONTENT.margin.w,
  kpi: {
    iconSize: 0.50,
    iconY: CONTENT_TOP_Y + VERTICAL_SHIFT,
    labelY: CONTENT_TOP_Y + VERTICAL_SHIFT + 0.55,
    valueY: CONTENT_TOP_Y + VERTICAL_SHIFT + 0.80,
    colWidth: 2.9,
    colSpacing: 0.15,
    sectionEndY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12,
  },
  bar: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP,
    height: 0.33,
    marginX: 0.60,
    endY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33,
  },
  cursor: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33,
    height: 0.20,
  },
  callout: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP,
    height: 0.20,
    endY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 0.20,
  },
  hero: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 0.25,
    labelHeight: 0.24,
    valueHeight: 0.44,
    lineY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 1.05,
    endY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 1.07,
  },
  marginInfo: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 1.12,
    height: 0.18,
    endY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 1.30,
  },
} as const;

export const TMI_WIDTHS = {
  0: 1.0,
  11: 1.5,
  30: 3.5,
  41: 5.0,
  45: 5.5,
} as const;

export const TOTAL_WEIGHT = Object.values(TMI_WIDTHS).reduce((a, b) => a + b, 0);

export function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

export function pct(n: number): string {
  return `${n}%`;
}

export function fmt2(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calculateMarginToNextTmi(
  taxablePerPart: number,
  tmiRate: number,
): { margin: number; nextRate: number } | null {
  const currentBracket = TMI_BRACKETS.find((bracket) => bracket.rate === tmiRate);
  if (!currentBracket || currentBracket.max === Infinity) {
    return null;
  }

  const margin = currentBracket.max - taxablePerPart;
  const nextBracketIdx = TMI_BRACKETS.findIndex((bracket) => bracket.rate === tmiRate) + 1;
  const nextBracket = TMI_BRACKETS[nextBracketIdx];

  if (margin <= 0 || !nextBracket) {
    return null;
  }

  return { margin, nextRate: nextBracket.rate };
}

export function getAmountInCurrentBracket(
  taxablePerPart: number,
  tmiRate: number,
  partsNb: number,
): number {
  const bracket = TMI_BRACKETS.find((item) => item.rate === tmiRate);
  if (!bracket) return 0;

  const amountInBracketPerPart = Math.max(0, Math.min(taxablePerPart, bracket.max) - bracket.min);
  return amountInBracketPerPart * partsNb;
}

export function getCursorPositionInBracket(
  taxablePerPart: number,
  tmiRate: number,
  tmiBaseGlobal?: number,
  tmiMarginGlobal?: number | null,
): number {
  if (
    tmiBaseGlobal !== undefined
    && tmiBaseGlobal !== null
    && tmiMarginGlobal !== undefined
    && tmiMarginGlobal !== null
    && tmiMarginGlobal > 0
  ) {
    const totalBracketUsed = tmiBaseGlobal + tmiMarginGlobal;
    if (totalBracketUsed > 0) {
      return tmiBaseGlobal / totalBracketUsed;
    }
  }

  const bracket = TMI_BRACKETS.find((item) => item.rate === tmiRate);
  if (!bracket) return 0.5;
  if (taxablePerPart <= bracket.min) return 0.16;

  const effectiveMax = bracket.max === Infinity ? 300_000 : bracket.max;
  const bracketRange = effectiveMax - bracket.min;
  if (bracketRange <= 0) return 0.5;

  const positionInBracket = taxablePerPart - bracket.min;
  return Math.min(1, positionInBracket / bracketRange);
}

export function getCursorXOffset(positionRatio: number, segmentWidth: number, tmiRate: number): number {
  const thirdWidth = segmentWidth / 3;
  if (tmiRate === 45) {
    return positionRatio < 0.50 ? -thirdWidth : 0;
  }
  if (positionRatio < 0.33) return -thirdWidth;
  if (positionRatio > 0.66) return thirdWidth;
  return 0;
}

export function getBracketColor(rate: number, theme: PptxThemeRoles): string {
  const color4 = theme.colors.color4.replace('#', '');
  const color2 = theme.colors.color2.replace('#', '');

  const r4 = parseInt(color4.substring(0, 2), 16);
  const g4 = parseInt(color4.substring(2, 4), 16);
  const b4 = parseInt(color4.substring(4, 6), 16);
  const r2 = parseInt(color2.substring(0, 2), 16);
  const g2 = parseInt(color2.substring(2, 4), 16);
  const b2 = parseInt(color2.substring(4, 6), 16);

  if (rate === 0) {
    const mixR = Math.round(255 - (255 - r4) * 0.30);
    const mixG = Math.round(255 - (255 - g4) * 0.30);
    const mixB = Math.round(255 - (255 - b4) * 0.30);
    const toHex = (value: number) => value.toString(16).padStart(2, '0');
    return `${toHex(mixR)}${toHex(mixG)}${toHex(mixB)}`;
  }

  const progressMap: Record<number, number> = {
    11: 0.0,
    30: 0.40,
    41: 0.70,
    45: 1.0,
  };

  const t = progressMap[rate] ?? 0.5;
  const mixR = Math.round(r4 + (r2 - r4) * t);
  const mixG = Math.round(g4 + (g2 - g4) * t);
  const mixB = Math.round(b4 + (b2 - b4) * t);
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `${toHex(mixR)}${toHex(mixG)}${toHex(mixB)}`;
}

function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const toLinear = (value: number) => (
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getTextColorForBackground(bgColor: string, theme: PptxThemeRoles): string {
  return getRelativeLuminance(bgColor) < 0.4
    ? 'FFFFFF'
    : theme.textMain.replace('#', '');
}
