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
  COORDS_FOOTER,
  addTextBox,
  addAccentLine,
  addFooter,
  roleColor,
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

/**
 * Content zone ends BEFORE the footer
 * All visual elements MUST have (y + h) <= CONTENT_BOTTOM_Y
 */
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

/**
 * Available content height
 */
const CONTENT_HEIGHT = CONTENT_BOTTOM_Y - CONTENT_TOP_Y; // ~4.42

// ============================================================================
// LAYOUT CONSTANTS (inches) - ANTI-OVERLAP DESIGN
// Premium layout with STRICT vertical separation
// 
// ZONE ALLOCATION (total ~4.4"):
// - KPIs:     Y 2.38 → 3.55 (1.17")
// - TMI Bar:  Y 3.65 → 4.15 (0.50")
// - Callout:  Y 4.20 → 4.50 (0.30") - SECONDARY info
// - HERO:     Y 4.70 → 5.50 (0.80") - PRIMARY result
// - Margin:   Y 5.60 → 5.85 (0.25") - tertiary info
// - Buffer:   Y 5.85 → 6.80 (safety margin to footer)
// ============================================================================

const LAYOUT = {
  // Standard margins
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  slideWidth: SLIDE_SIZE.width, // 13.3333
  
  // ===== SECTION 1: KPIs (Y 2.38 → 3.55) =====
  kpi: {
    iconSize: 0.45,
    iconY: CONTENT_TOP_Y,           // 2.38 - icons at very top
    labelY: CONTENT_TOP_Y + 0.50,   // 2.88 - label below icon
    valueY: CONTENT_TOP_Y + 0.75,   // 3.13 - main value
    // For couples: inline display "Déclarant 1: X € | Déclarant 2: Y €"
    colWidth: 2.9,
    colSpacing: 0.15,
    sectionEndY: CONTENT_TOP_Y + 1.17, // 3.55 - END of KPI section
  },
  
  // ===== SECTION 2: TMI Bar (Y 3.65 → 4.15) =====
  bar: {
    y: CONTENT_TOP_Y + 1.27,        // 3.65 - START (10px gap from KPIs)
    height: 0.45,                   // Elegant height
    marginX: 0.85,                  // Side margins for bar
    endY: CONTENT_TOP_Y + 1.72,     // 4.10 - END of bar
  },
  
  // ===== SECTION 3: Callout - SECONDARY (Y 4.20 → 4.50) =====
  // "Part de revenu taxée à X% : Y €" - clearly labeled as secondary
  callout: {
    y: CONTENT_TOP_Y + 1.82,        // 4.20 - START (10px gap from bar)
    height: 0.28,
    endY: CONTENT_TOP_Y + 2.10,     // 4.48 - END
  },
  
  // ===== SECTION 4: HERO - Tax Result (Y 4.70 → 5.50) =====
  // This is THE main information - must be unmissable
  hero: {
    y: CONTENT_TOP_Y + 2.32,        // 4.70 - START (20px gap - breathing room)
    labelHeight: 0.30,
    valueHeight: 0.45,
    lineY: CONTENT_TOP_Y + 3.07,    // 5.45 - decorative line
    endY: CONTENT_TOP_Y + 3.12,     // 5.50 - END
  },
  
  // ===== SECTION 5: Margin Info - TERTIARY (Y 5.60 → 5.85) =====
  marginInfo: {
    y: CONTENT_TOP_Y + 3.22,        // 5.60 - START (10px gap)
    height: 0.22,
    endY: CONTENT_TOP_Y + 3.44,     // 5.82 - END
  },
} as const;

// Safety check: ensure nothing exceeds content zone
const SAFETY_CHECK = {
  lastElementEndY: LAYOUT.marginInfo.endY,
  footerStartY: CONTENT_BOTTOM_Y,
  safetyMargin: CONTENT_BOTTOM_Y - LAYOUT.marginInfo.endY, // Should be > 0.5"
};

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
 * Get color for TMI bracket - PROGRESSIVE GRADIENT
 * From lightest (0%) to darkest (45%) using theme accent
 * 
 * Premium design: smooth gradient progression
 */
function getBracketColor(rate: number, theme: PptxThemeRoles, isActive: boolean): string {
  const accent = theme.accent.replace('#', '');
  
  // Parse accent color to RGB
  const r = parseInt(accent.substring(0, 2), 16);
  const g = parseInt(accent.substring(2, 4), 16);
  const b = parseInt(accent.substring(4, 6), 16);
  
  // Progressive gradient: lighter for lower brackets, darker for higher
  // 0% = 85% lightness, 45% = full color
  const intensityMap: Record<number, number> = {
    0: 0.25,   // Very light (25% of accent)
    11: 0.40,  // Light (40% of accent)
    30: 0.60,  // Medium (60% of accent)
    41: 0.80,  // Strong (80% of accent)
    45: 1.00,  // Full accent color
  };
  
  const intensity = intensityMap[rate] || 0.5;
  
  // Mix with white for lighter shades
  const mixR = Math.round(255 - (255 - r) * intensity);
  const mixG = Math.round(255 - (255 - g) * intensity);
  const mixB = Math.round(255 - (255 - b) * intensity);
  
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `${toHex(mixR)}${toHex(mixG)}${toHex(mixB)}`;
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
  addTextBox(slide, 'Synthèse de votre simulation', COORDS_CONTENT.title, {
    fontSize: TYPO.sizes.h1,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Accent line under title - using helper
  addAccentLine(slide, theme, 'content');
  
  // Subtitle (H2) - using helper
  addTextBox(slide, 'Principaux indicateurs fiscaux', COORDS_CONTENT.subtitle, {
    fontSize: TYPO.sizes.h2,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
  });
  
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
      label: 'Estimation de vos revenus',
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
    
    // Icon (accent color, centered)
    const iconDataUri = getBusinessIconDataUri(kpi.icon, { color: theme.accent });
    slide.addImage({
      data: iconDataUri,
      x: centerX - LAYOUT.kpi.iconSize / 2,
      y: LAYOUT.kpi.iconY,
      w: LAYOUT.kpi.iconSize,
      h: LAYOUT.kpi.iconSize,
    });
    
    // Label (sentence case, gray)
    slide.addText(kpi.label, {
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
      slide.addText(kpi.value, {
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
      slide.addText(kpi.subValue, {
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
  
  // ========== TMI BRACKET BAR (PROGRESSIVE GRADIENT) ==========
  const segmentWidth = barWidth / TMI_BRACKETS.length;
  
  TMI_BRACKETS.forEach((bracket, idx) => {
    const segX = LAYOUT.bar.marginX + idx * segmentWidth;
    const isActive = bracket.rate === data.tmiRate;
    const bgColor = getBracketColor(bracket.rate, theme, isActive);
    
    // Segment rectangle - gradient colors, white border on active
    slide.addShape('rect', {
      x: segX,
      y: LAYOUT.bar.y,
      w: segmentWidth - 0.03, // Small gap between segments
      h: LAYOUT.bar.height,
      fill: { color: bgColor },
      line: isActive 
        ? { color: 'FFFFFF', width: 2.5 } // White border for active segment
        : { color: bgColor, width: 0 },   // No border for inactive
    });
    
    // Rate label centered in segment
    // Text color: white for darker brackets (30%+), dark for lighter
    const textColor = bracket.rate >= 30 ? 'FFFFFF' : theme.textMain.replace('#', '');
    slide.addText(bracket.label, {
      x: segX,
      y: LAYOUT.bar.y,
      w: segmentWidth - 0.03,
      h: LAYOUT.bar.height,
      fontSize: 13,
      fontFace: TYPO.fontFace,
      color: textColor,
      bold: isActive,
      align: 'center',
      valign: 'middle',
    });
  });
  
  // ========== SECTION 3: CALLOUT - SECONDARY INFO (Y 4.20 → 4.48) ==========
  // "Part de revenu taxée à X% : Y €" - CLEARLY labeled as secondary
  if (data.tmiRate > 0) {
    const amountInBracket = getAmountInCurrentBracket(data.taxablePerPart, data.tmiRate, data.partsNb);
    
    // Full-width centered text with explicit label (no box, no ambiguity)
    slide.addText(`Part de revenu taxée à ${data.tmiRate}% : ${euro(amountInBracket)}`, {
      x: LAYOUT.marginX,
      y: LAYOUT.callout.y,
      w: LAYOUT.contentWidth,
      h: LAYOUT.callout.height,
      fontSize: 9,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      italic: true,
      align: 'center',
      valign: 'middle',
    });
  }
  
  // ========== SECTION 4: HERO - TAX RESULT (Y 4.70 → 5.50) ==========
  // This is THE main information - unmissable, no overlap possible
  
  // Label centered
  slide.addText('Estimation du montant de votre impôt sur le revenu', {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.labelHeight,
    fontSize: 12,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    align: 'center',
    valign: 'middle',
  });
  
  // Tax amount - LARGE, BOLD, CENTERED (the HERO element)
  slide.addText(data.irNet === 0 ? 'Non imposable' : euro(data.irNet), {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y + LAYOUT.hero.labelHeight,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.valueHeight,
    fontSize: 26,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'center',
    valign: 'middle',
  });
  
  // Decorative line below (premium separator)
  slide.addShape('line', {
    x: slideWidth / 2 - 2,
    y: LAYOUT.hero.lineY,
    w: 4,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1.5 },
  });
  
  // ========== SECTION 5: MARGIN INFO - TERTIARY (Y 5.60 → 5.82) ==========
  const nextTmiInfo = calculateMarginToNextTmi(data.taxablePerPart, data.tmiRate);
  if (nextTmiInfo && nextTmiInfo.margin > 0) {
    slide.addText(`Encore ${euro(nextTmiInfo.margin * data.partsNb)} avant la tranche ${nextTmiInfo.nextRate}%`, {
      x: LAYOUT.marginX,
      y: LAYOUT.marginInfo.y,
      w: LAYOUT.contentWidth,
      h: LAYOUT.marginInfo.height,
      fontSize: 9,
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
