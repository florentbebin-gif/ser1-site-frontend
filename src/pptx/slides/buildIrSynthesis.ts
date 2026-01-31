/**
 * IR Synthesis Slide Builder (Slide 3)
 * 
 * Premium visual layout:
 * - 4 KPI columns at top with outline icons
 * - TMI bracket bar (segmented, with active bracket highlight)
 * - Central tax amount display
 * - Margin to next bracket callout
 * 
 * Design: White background, generous spacing, institutional look
 * 
 * IMPORTANT: Uses standard SER1 template (title, subtitle, accent line, footer)
 * All visual elements MUST stay within CONTENT_ZONE (below subtitle, above footer)
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles, ExportContext } from '../theme/types';
import {
  SLIDE_SIZE,
  TYPO,
  COORDS_CONTENT,
  addHeader,
  addFooter,
  addTextFr,
} from '../designSystem/serenity';
import { getBusinessIconDataUri, type BusinessIconName } from '../../icons/business/businessIconLibrary';

// ============================================================================
// TYPES
// ============================================================================

export interface IrSynthesisData {
  // KPI 1: Revenus
  income1: number;
  income2: number;
  isCouple: boolean;
  
  // KPI 2: Revenu imposable
  taxableIncome: number;
  
  // KPI 3: Parts fiscales
  partsNb: number;
  
  // KPI 4: TMI
  tmiRate: number;
  
  // Tax result
  irNet: number;
  
  // Per-part income (for margin calculation)
  taxablePerPart: number;
  
  // Bracket details for "revenus dans cette TMI"
  bracketsDetails?: Array<{ label: string; base: number; rate: number; tax: number }>;
  
  // TMI details (exact values from IR card - REQUIRED for correct display)
  tmiBaseGlobal?: number;   // Montant des revenus dans cette TMI
  tmiMarginGlobal?: number | null; // Marge avant changement de TMI
}

// TMI Brackets (matching BAREME_IR_2024)
const TMI_BRACKETS = [
  { rate: 0, min: 0, max: 11_294, label: '0%' },
  { rate: 11, min: 11_294, max: 28_797, label: '11%' },
  { rate: 30, min: 28_797, max: 82_341, label: '30%' },
  { rate: 41, min: 82_341, max: 177_106, label: '41%' },
  { rate: 45, min: 177_106, max: Infinity, label: '45%' },
];

// ============================================================================
// CONTENT ZONE BOUNDARIES (STRICT - NO OVERFLOW)
// ============================================================================

/**
 * Content zone starts AFTER the subtitle (y + h)
 * All visual elements MUST have y >= CONTENT_TOP_Y
 */
const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754

// ============================================================================
// LAYOUT CONSTANTS (inches) - PREMIUM DESIGN V4
// 
// MORE AERATION: increased gap below cursor for breathing room
// TMI bar segments have PROPORTIONAL widths based on income ranges
// Cursor position is INTELLIGENT (1/3, 2/3, 3/3 based on income in bracket)
// 
// ZONE ALLOCATION:
// - KPIs:      Y 2.78 → 3.90 (1.12") - icons, labels, values
// - GAP:       Y 3.90 → 4.25 (0.35") - breathing room
// - TMI Bar:   Y 4.25 → 4.58 (0.33") - bracket segments (proportional widths)
// - Cursor:    Y 4.58 → 4.78 (0.20") - premium triangle pointer
// - BIG GAP:   Y 4.78 → 5.20 (0.42") - strong aeration below cursor
// - Callout:   Y 5.20 → 5.40 (0.20") - "Part de revenu taxée..."
// - HERO:      Y 5.45 → 6.15 (0.70") - PRIMARY tax result
// - Margin:    Y 6.20 → 6.38 (0.18") - "Encore X € avant..."
// - Buffer:    Y 6.38 → 6.80 (0.42" safety margin to footer)
// ============================================================================

// Vertical offset to shift everything down for better balance
const VERTICAL_SHIFT = 0.40;

// Gap between KPIs and TMI bar
const KPI_TO_BAR_GAP = 0.30;

// Gap below cursor for strong aeration
const CURSOR_TO_CONTENT_GAP = 0.42;

const LAYOUT = {
  // Standard margins
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  slideWidth: SLIDE_SIZE.width, // 13.3333
  
  // ===== SECTION 1: KPIs (Y 2.78 → 3.90) =====
  kpi: {
    iconSize: 0.50,
    iconY: CONTENT_TOP_Y + VERTICAL_SHIFT,     // 2.78
    labelY: CONTENT_TOP_Y + VERTICAL_SHIFT + 0.55, // 3.33
    valueY: CONTENT_TOP_Y + VERTICAL_SHIFT + 0.80, // 3.58
    colWidth: 2.9,
    colSpacing: 0.15,
    sectionEndY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12, // 3.90
  },
  
  // ===== SECTION 2: TMI Bar (Y 4.25 → 4.58) =====
  bar: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP, // 4.25
    height: 0.33,
    marginX: 0.60,
    endY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33, // 4.58
  },
  
  // ===== SECTION 2b: Cursor/Triangle (Y 4.58 → 4.78) =====
  cursor: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33, // 4.58
    height: 0.20,
  },
  
  // ===== SECTION 3: Callout - SECONDARY (Y 5.20 → 5.40) =====
  callout: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP, // 5.20
    height: 0.20,
    endY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 0.20, // 5.40
  },
  
  // ===== SECTION 4: HERO - Tax Result (Y 5.45 → 6.05) =====
  hero: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 0.25, // 5.45
    labelHeight: 0.24,
    valueHeight: 0.44,
    lineY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 1.05, // 6.25 - moved down
    endY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 1.07, // 6.27
  },
  
  // ===== SECTION 5: Margin Info - TERTIARY (Y 6.32 → 6.50) =====
  marginInfo: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 1.12, // 6.32 - moved down
    height: 0.18,
    endY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.12 + KPI_TO_BAR_GAP + 0.33 + 0.20 + CURSOR_TO_CONTENT_GAP + 1.30, // 6.50
  },
} as const;

// ============================================================================
// TMI BRACKET WIDTHS (proportional to income ranges)
// Based on 1 fiscal part - ranges in euros:
// - 0%:  0 → 11 294 = 11 294 € (narrow - not taxed)
// - 11%: 11 294 → 28 797 = 17 503 €
// - 30%: 28 797 → 82 341 = 53 544 € (wider)
// - 41%: 82 341 → 177 106 = 94 765 € (even wider)
// - 45%: 177 106 → ∞ = ~100 000 € visual equiv (widest)
// ============================================================================

const TMI_WIDTHS = {
  // Relative weights (normalized later)
  0: 1.0,   // Smallest (11k range)
  11: 1.5,  // Small (17k range)  
  30: 3.5,  // Medium (54k range)
  41: 5.0,  // Large (95k range)
  45: 5.5,  // Largest (infinite, but visually capped)
} as const;

// Total weight for normalization
const TOTAL_WEIGHT = Object.values(TMI_WIDTHS).reduce((a, b) => a + b, 0);

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function pct(n: number): string {
  return `${n}%`;
}

function fmt2(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Calculate margin before next TMI bracket
 */
function calculateMarginToNextTmi(taxablePerPart: number, tmiRate: number): { margin: number; nextRate: number } | null {
  const currentBracket = TMI_BRACKETS.find(b => b.rate === tmiRate);
  if (!currentBracket || currentBracket.max === Infinity) {
    return null; // Already at highest bracket
  }
  
  const margin = currentBracket.max - taxablePerPart;
  const nextBracketIdx = TMI_BRACKETS.findIndex(b => b.rate === tmiRate) + 1;
  const nextBracket = TMI_BRACKETS[nextBracketIdx];
  
  if (margin <= 0 || !nextBracket) {
    return null;
  }
  
  return { margin, nextRate: nextBracket.rate };
}

/**
 * Get amount taxed at current TMI rate
 */
function getAmountInCurrentBracket(taxablePerPart: number, tmiRate: number, partsNb: number): number {
  const bracket = TMI_BRACKETS.find(b => b.rate === tmiRate);
  if (!bracket) return 0;
  
  const amountInBracketPerPart = Math.max(0, Math.min(taxablePerPart, bracket.max) - bracket.min);
  return amountInBracketPerPart * partsNb;
}

/**
 * Calculate cursor position within a TMI bracket (0 = start, 1 = end)
 * Returns position ratio for intelligent cursor placement:
 * - < 0.33: first third (just entered this bracket)
 * - 0.33-0.66: middle third (roughly half-way)
 * - > 0.66: last third (close to next bracket)
 * 
 * USES tmiBaseGlobal and tmiMarginGlobal when available for consistency with displayed values
 */
function getCursorPositionInBracket(
  taxablePerPart: number, 
  tmiRate: number,
  tmiBaseGlobal?: number,
  tmiMarginGlobal?: number | null
): number {
  // If both tmiBaseGlobal and tmiMarginGlobal are available, use them for accurate positioning
  // This ensures cursor matches the "Montant des revenus dans cette TMI" and "Marge avant changement" values
  if (tmiBaseGlobal !== undefined && tmiBaseGlobal !== null && 
      tmiMarginGlobal !== undefined && tmiMarginGlobal !== null && tmiMarginGlobal > 0) {
    const totalBracketUsed = tmiBaseGlobal + tmiMarginGlobal;
    if (totalBracketUsed > 0) {
      return tmiBaseGlobal / totalBracketUsed;
    }
  }
  
  // Fallback to original calculation if tmiBaseGlobal/tmiMarginGlobal not available
  const bracket = TMI_BRACKETS.find(b => b.rate === tmiRate);
  if (!bracket) return 0.5;
  
  // For TMI 0% or if income is below bracket min
  if (taxablePerPart <= bracket.min) return 0.16; // First third center
  
  // For TMI 45% (infinite max), use a virtual max of ~300k for positioning
  const effectiveMax = bracket.max === Infinity ? 300_000 : bracket.max;
  const bracketRange = effectiveMax - bracket.min;
  
  if (bracketRange <= 0) return 0.5;
  
  const positionInBracket = taxablePerPart - bracket.min;
  const ratio = Math.min(1, positionInBracket / bracketRange);
  
  return ratio;
}

/**
 * Get cursor X offset based on position in bracket
 * Divides segment into 3 parts and returns offset for:
 * - ratio < 0.33: first third (offset = -segmentWidth/3)
 * - ratio 0.33-0.66: center (offset = 0)
 * - ratio > 0.66: last third (offset = +segmentWidth/3)
 */
function getCursorXOffset(positionRatio: number, segmentWidth: number, tmiRate: number): number {
  const thirdWidth = segmentWidth / 3;
  
  // For TMI 45%, only use first 2/3 (first third or middle)
  if (tmiRate === 45) {
    return positionRatio < 0.50 ? -thirdWidth : 0;
  }
  
  // For other brackets: 3 positions
  if (positionRatio < 0.33) {
    return -thirdWidth; // First third
  } else if (positionRatio > 0.66) {
    return thirdWidth; // Last third (close to next bracket)
  }
  return 0; // Middle
}

/**
 * Get color for TMI bracket - GRADIENT from color4 to color2
 * 
 * Premium design: smooth gradient using theme colors
 * - 0%: lightest (mix with white from color4)
 * - 11%: color4 (start of gradient)
 * - 45%: color2 (end of gradient, richest)
 */
function getBracketColor(rate: number, theme: PptxThemeRoles): string {
  const color4 = theme.colors.color4.replace('#', '');
  const color2 = theme.colors.color2.replace('#', '');
  
  // Parse both colors to RGB
  const r4 = parseInt(color4.substring(0, 2), 16);
  const g4 = parseInt(color4.substring(2, 4), 16);
  const b4 = parseInt(color4.substring(4, 6), 16);
  
  const r2 = parseInt(color2.substring(0, 2), 16);
  const g2 = parseInt(color2.substring(2, 4), 16);
  const b2 = parseInt(color2.substring(4, 6), 16);
  
  // Gradient progression: 0% very light, 11% = color4, 45% = color2
  // TMI 0% gets a lightened version of color4
  if (rate === 0) {
    // Mix color4 with white (70% white, 30% color4)
    const mixR = Math.round(255 - (255 - r4) * 0.30);
    const mixG = Math.round(255 - (255 - g4) * 0.30);
    const mixB = Math.round(255 - (255 - b4) * 0.30);
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `${toHex(mixR)}${toHex(mixG)}${toHex(mixB)}`;
  }
  
  // For 11% to 45%: linear interpolation from color4 to color2
  const progressMap: Record<number, number> = {
    11: 0.0,   // Pure color4
    30: 0.40,  // 60% color4, 40% color2
    41: 0.70,  // 30% color4, 70% color2
    45: 1.0,   // Pure color2
  };
  
  const t = progressMap[rate] ?? 0.5;
  
  // Linear interpolation between color4 and color2
  const mixR = Math.round(r4 + (r2 - r4) * t);
  const mixG = Math.round(g4 + (g2 - g4) * t);
  const mixB = Math.round(b4 + (b2 - b4) * t);
  
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `${toHex(mixR)}${toHex(mixG)}${toHex(mixB)}`;
}

/**
 * Calculate relative luminance of a color (0-1)
 * Used to determine if text should be light or dark
 */
function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // sRGB to linear
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Get appropriate text color for a background
 * Returns white for dark backgrounds, textMain for light backgrounds
 */
function getTextColorForBackground(bgColor: string, theme: PptxThemeRoles): string {
  const luminance = getRelativeLuminance(bgColor);
  // Threshold: 0.4 works well for most colors
  return luminance < 0.4 ? 'FFFFFF' : theme.textMain.replace('#', '');
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build IR Synthesis slide (premium KPI layout)
 * 
 * Uses standard SER1 template:
 * - Title (H1, left-aligned, uppercase)
 * - Accent line under title
 * - Subtitle (H2, left-aligned)
 * - Footer (date, disclaimer, slide number)
 * 
 * All visual content is placed within CONTENT_ZONE
 */
export function buildIrSynthesis(
  pptx: PptxGenJS,
  data: IrSynthesisData,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  
  // White background
  slide.background = { color: 'FFFFFF' };
  
  const slideWidth = SLIDE_SIZE.width;
  const barWidth = slideWidth - LAYOUT.bar.marginX * 2;
  
  // ========== STANDARD HEADER (from design system) ==========
  
  // Title (H1, ALL CAPS, LEFT-ALIGNED) - using helper
  // Add header (title + accent line + subtitle) with text-based positioning
  addHeader(slide, 'Synthèse de votre simulation', 'Principaux indicateurs fiscaux', theme, 'content');
  
  // ========== SECTION 1: 4 KPI COLUMNS (Y 2.38 → 3.55) ==========
  // Compact, aligned, premium design
  const totalRevenue = data.income1 + data.income2;
  
  const kpiData: Array<{
    icon: BusinessIconName;
    label: string;
    value: string;
    subValue?: string; // For couples: "D1: X € | D2: Y €"
  }> = [
    {
      icon: 'money',
      label: "Vos revenus d'activités",
      value: data.isCouple ? '' : euro(totalRevenue),
      subValue: data.isCouple 
        ? `D1: ${euro(data.income1)} | D2: ${euro(data.income2)}`
        : undefined,
    },
    {
      icon: 'cheque',
      label: 'Revenu imposable',
      value: euro(data.taxableIncome),
    },
    {
      icon: 'balance',
      label: 'Parts fiscales',
      value: fmt2(data.partsNb),
    },
    {
      icon: 'gauge',
      label: 'TMI',
      value: data.tmiRate === 0 ? 'Non imposable' : pct(data.tmiRate),
    },
  ];
  
  const totalKpiWidth = LAYOUT.kpi.colWidth * 4 + LAYOUT.kpi.colSpacing * 3;
  const kpiStartX = (slideWidth - totalKpiWidth) / 2;
  
  kpiData.forEach((kpi, idx) => {
    const colX = kpiStartX + idx * (LAYOUT.kpi.colWidth + LAYOUT.kpi.colSpacing);
    const centerX = colX + LAYOUT.kpi.colWidth / 2;
    
    // Icon (color5, centered) - premium look
    const iconDataUri = getBusinessIconDataUri(kpi.icon, { color: theme.colors.color5 });
    slide.addImage({
      data: iconDataUri,
      x: centerX - LAYOUT.kpi.iconSize / 2,
      y: LAYOUT.kpi.iconY,
      w: LAYOUT.kpi.iconSize,
      h: LAYOUT.kpi.iconSize,
    });
    
    // Label (sentence case, gray)
    addTextFr(slide, kpi.label, {
      x: colX,
      y: LAYOUT.kpi.labelY,
      w: LAYOUT.kpi.colWidth,
      h: 0.22,
      fontSize: 9,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      align: 'center',
      valign: 'middle',
    });
    
    // Main value OR sub-value for couples
    if (kpi.value) {
      addTextFr(slide, kpi.value, {
        x: colX,
        y: LAYOUT.kpi.valueY,
        w: LAYOUT.kpi.colWidth,
        h: 0.32,
        fontSize: 15,
        fontFace: TYPO.fontFace,
        color: theme.textMain.replace('#', ''),
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    } else if (kpi.subValue) {
      // Compact inline for couples: "D1: X € | D2: Y €"
      addTextFr(slide, kpi.subValue, {
        x: colX,
        y: LAYOUT.kpi.valueY,
        w: LAYOUT.kpi.colWidth,
        h: 0.32,
        fontSize: 10,
        fontFace: TYPO.fontFace,
        color: theme.textMain.replace('#', ''),
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    }
  });
  
  // ========== TMI BRACKET BAR (PROPORTIONAL WIDTHS, COLOR3→COLOR2 GRADIENT) ==========
  let currentX = LAYOUT.bar.marginX;
  let activeSegmentCenterX = 0;
  let activeSegmentWidth = 0;
  
  TMI_BRACKETS.forEach((bracket) => {
    const isActive = bracket.rate === data.tmiRate;
    const bgColor = getBracketColor(bracket.rate, theme);
    
    // Calculate proportional width based on income range
    const weight = TMI_WIDTHS[bracket.rate as keyof typeof TMI_WIDTHS] || 1;
    const segmentWidth = (barWidth * weight) / TOTAL_WEIGHT;
    const gap = 0.02; // Tiny gap between segments
    
    // Track active segment for cursor positioning
    if (isActive) {
      activeSegmentCenterX = currentX + (segmentWidth - gap) / 2;
      activeSegmentWidth = segmentWidth - gap;
    }
    
    // Segment rectangle - NO BORDER (clean look)
    slide.addShape('rect', {
      x: currentX,
      y: LAYOUT.bar.y,
      w: segmentWidth - gap,
      h: LAYOUT.bar.height,
      fill: { color: bgColor },
      line: { color: bgColor, width: 0 },
    });
    
    // Rate label centered in segment
    // Text color adapts to background luminance
    const textColor = getTextColorForBackground(bgColor, theme);
    addTextFr(slide, bracket.label, {
      x: currentX,
      y: LAYOUT.bar.y,
      w: segmentWidth - gap,
      h: LAYOUT.bar.height,
      fontSize: 11,
      fontFace: TYPO.fontFace,
      color: textColor,
      bold: isActive,
      align: 'center',
      valign: 'middle',
    });
    
    currentX += segmentWidth;
  });
  
  // ========== PREMIUM TRIANGLE CURSOR (intelligent positioning) ==========
  if (data.tmiRate > 0 && activeSegmentCenterX > 0) {
    const triangleWidth = 0.22;
    const triangleHeight = 0.14;
    const cursorY = LAYOUT.cursor.y + 0.02;
    
    // Calculate intelligent cursor position based on tmiBaseGlobal/tmiMarginGlobal (same source as displayed values)
    const positionRatio = getCursorPositionInBracket(
      data.taxablePerPart, 
      data.tmiRate,
      data.tmiBaseGlobal,
      data.tmiMarginGlobal
    );
    const xOffset = getCursorXOffset(positionRatio, activeSegmentWidth, data.tmiRate);
    const cursorCenterX = activeSegmentCenterX + xOffset;
    
    // Draw isoceles triangle pointing DOWN using 'triangle' shape
    // PptxGenJS 'triangle' default points down - no rotation needed
    slide.addShape('triangle', {
      x: cursorCenterX - triangleWidth / 2,
      y: cursorY,
      w: triangleWidth,
      h: triangleHeight,
      fill: { color: theme.colors.color5.replace('#', '') },
      line: { color: theme.colors.color5.replace('#', ''), width: 0 },
    });
  }
  
  // ========== SECTION 3: CALLOUT - SECONDARY INFO ==========
  // "Montant des revenus dans cette TMI : X €" - uses tmiBaseGlobal from IR card, or fallback to calculated value
  if (data.tmiRate > 0) {
    // Use tmiBaseGlobal if available, otherwise calculate from bracket
    const amountInTmi = (data.tmiBaseGlobal !== undefined && data.tmiBaseGlobal !== null) 
      ? data.tmiBaseGlobal 
      : getAmountInCurrentBracket(data.taxablePerPart, data.tmiRate, data.partsNb);
    
    addTextFr(slide, `Montant des revenus dans cette TMI : ${euro(amountInTmi)}`, {
      x: LAYOUT.marginX,
      y: LAYOUT.callout.y,
      w: LAYOUT.contentWidth,
      h: LAYOUT.callout.height,
      fontSize: 10,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      italic: true,
      align: 'center',
      valign: 'middle',
    });
  }
  
  // ========== SECTION 4: HERO - TAX RESULT ==========
  // THE main information - IMPOSSIBLE TO MISS
  
  // Label centered
  addTextFr(slide, 'Estimation du montant de votre impôt sur le revenu', {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.labelHeight,
    fontSize: 13,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    align: 'center',
    valign: 'middle',
  });
  
  // Tax amount - VERY LARGE (30pt), BOLD, CENTERED = HERO
  addTextFr(slide, data.irNet === 0 ? 'Non imposable' : euro(data.irNet), {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y + LAYOUT.hero.labelHeight,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.valueHeight,
    fontSize: 30,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'center',
    valign: 'middle',
  });
  
  // Decorative accent line below (premium touch)
  slide.addShape('line', {
    x: slideWidth / 2 - 1.5,
    y: LAYOUT.hero.lineY,
    w: 3,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1.5 },
  });
  
  // ========== SECTION 5: MARGIN INFO - TERTIARY ==========
  // "Marge avant changement de TMI : X €" - uses tmiMarginGlobal from IR card, or fallback to calculated value
  const nextTmiInfo = calculateMarginToNextTmi(data.taxablePerPart, data.tmiRate);
  
  // Use tmiMarginGlobal if available, otherwise calculate
  const marginValue = (data.tmiMarginGlobal !== undefined && data.tmiMarginGlobal !== null)
    ? data.tmiMarginGlobal
    : (nextTmiInfo ? nextTmiInfo.margin * data.partsNb : null);
  
  if (marginValue !== null && marginValue > 0) {
    addTextFr(slide, `Marge avant changement de TMI : ${euro(marginValue)}`, {
      x: LAYOUT.marginX,
      y: LAYOUT.marginInfo.y,
      w: LAYOUT.contentWidth,
      h: LAYOUT.marginInfo.height,
      fontSize: 10,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      italic: true,
      align: 'center',
      valign: 'middle',
    });
  }
  
  // ========== STANDARD FOOTER (from design system) ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildIrSynthesis;
