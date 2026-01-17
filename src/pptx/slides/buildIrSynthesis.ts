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
// LAYOUT CONSTANTS (inches) - ALL WITHIN CONTENT ZONE
// Premium design: airy spacing, clear hierarchy
// ============================================================================

const LAYOUT = {
  // Use standard margins from design system
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  
  // KPI Section (top of content zone) - AIRY
  kpi: {
    iconSize: 0.55,  // Slightly larger icons
    iconY: CONTENT_TOP_Y + 0.05, // 2.43 - icons at top
    labelY: CONTENT_TOP_Y + 0.65, // 3.03 - label below icon
    valueY: CONTENT_TOP_Y + 0.95, // 3.33 - main value
    detailY: CONTENT_TOP_Y + 1.35, // 3.73 - detail lines
    colWidth: 2.8,   // Wider columns
    colSpacing: 0.1, // Tighter spacing between columns
  },
  
  // TMI Bar (middle of content zone) - PROMINENT
  bar: {
    y: CONTENT_TOP_Y + 1.85, // 4.23 - moved up slightly
    height: 0.5,     // Slightly thinner for elegance
    marginX: 0.7,    // More bar width
  },
  
  // Active bracket callout - below bar
  callout: {
    y: CONTENT_TOP_Y + 2.45, // 4.83
    height: 0.35,
  },
  
  // Tax result (prominent center) - HERO SECTION
  result: {
    labelY: CONTENT_TOP_Y + 2.95, // 5.33
    valueY: CONTENT_TOP_Y + 3.25, // 5.63
    lineY: CONTENT_TOP_Y + 3.75,  // 6.13 - decorative line
  },
  
  // Margin to next TMI (bottom info)
  margin: {
    y: CONTENT_TOP_Y + 3.95, // 6.33
    height: 0.25,
  },
} as const;

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
  
  // ========== 4 KPI COLUMNS (PREMIUM DESIGN) ==========
  // KPI data with proper breakdown for couples
  const totalRevenue = data.income1 + data.income2;
  
  const kpiData: Array<{
    icon: BusinessIconName;
    label: string;
    value: string;
    subLines?: string[];  // Additional detail lines below value
  }> = [
    {
      icon: 'money',
      label: 'Estimation de vos revenus',
      value: '', // Value will be shown via subLines for clarity
      subLines: data.isCouple 
        ? [`Déclarant 1`, `${euro(data.income1)}`, `Déclarant 2`, `${euro(data.income2)}`]
        : [`${euro(totalRevenue)}`],
    },
    {
      icon: 'cheque',
      label: 'Estimation du revenu imposable',
      value: euro(data.taxableIncome),
    },
    {
      icon: 'balance',
      label: 'Nombre de parts fiscales',
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
    
    // Icon (centered, using theme accent color)
    const iconDataUri = getBusinessIconDataUri(kpi.icon, { color: theme.accent });
    slide.addImage({
      data: iconDataUri,
      x: centerX - LAYOUT.kpi.iconSize / 2,
      y: LAYOUT.kpi.iconY,
      w: LAYOUT.kpi.iconSize,
      h: LAYOUT.kpi.iconSize,
    });
    
    // Label (sentence case, not uppercase - more readable)
    slide.addText(kpi.label, {
      x: colX,
      y: LAYOUT.kpi.labelY,
      w: LAYOUT.kpi.colWidth,
      h: 0.28,
      fontSize: 9,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      align: 'center',
      valign: 'middle',
    });
    
    // Main value (bold, black, centered) - if provided
    if (kpi.value) {
      slide.addText(kpi.value, {
        x: colX,
        y: LAYOUT.kpi.valueY,
        w: LAYOUT.kpi.colWidth,
        h: 0.35,
        fontSize: 16,
        fontFace: TYPO.fontFace,
        color: theme.textMain.replace('#', ''),
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    }
    
    // Sub-lines (for income breakdown - couple case)
    if (kpi.subLines && kpi.subLines.length > 0) {
      // For couple: show "Déclarant 1" then amount, "Déclarant 2" then amount
      if (data.isCouple && kpi.subLines.length === 4) {
        // Déclarant 1 label
        slide.addText(kpi.subLines[0], {
          x: colX,
          y: LAYOUT.kpi.valueY - 0.05,
          w: LAYOUT.kpi.colWidth,
          h: 0.22,
          fontSize: 9,
          fontFace: TYPO.fontFace,
          color: theme.textBody.replace('#', ''),
          align: 'center',
          valign: 'middle',
        });
        // Déclarant 1 value
        slide.addText(kpi.subLines[1], {
          x: colX,
          y: LAYOUT.kpi.valueY + 0.15,
          w: LAYOUT.kpi.colWidth,
          h: 0.25,
          fontSize: 12,
          fontFace: TYPO.fontFace,
          color: theme.textMain.replace('#', ''),
          bold: true,
          align: 'center',
          valign: 'middle',
        });
        // Déclarant 2 label
        slide.addText(kpi.subLines[2], {
          x: colX,
          y: LAYOUT.kpi.valueY + 0.38,
          w: LAYOUT.kpi.colWidth,
          h: 0.22,
          fontSize: 9,
          fontFace: TYPO.fontFace,
          color: theme.textBody.replace('#', ''),
          align: 'center',
          valign: 'middle',
        });
        // Déclarant 2 value
        slide.addText(kpi.subLines[3], {
          x: colX,
          y: LAYOUT.kpi.valueY + 0.58,
          w: LAYOUT.kpi.colWidth,
          h: 0.25,
          fontSize: 12,
          fontFace: TYPO.fontFace,
          color: theme.textMain.replace('#', ''),
          bold: true,
          align: 'center',
          valign: 'middle',
        });
      } else {
        // Single person: just show the total
        slide.addText(kpi.subLines[0], {
          x: colX,
          y: LAYOUT.kpi.valueY,
          w: LAYOUT.kpi.colWidth,
          h: 0.35,
          fontSize: 16,
          fontFace: TYPO.fontFace,
          color: theme.textMain.replace('#', ''),
          bold: true,
          align: 'center',
          valign: 'middle',
        });
      }
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
  
  // ========== ACTIVE BRACKET CALLOUT (Amount in current TMI) ==========
  if (data.tmiRate > 0) {
    const activeBracketIdx = TMI_BRACKETS.findIndex(b => b.rate === data.tmiRate);
    if (activeBracketIdx >= 0) {
      const calloutX = LAYOUT.bar.marginX + activeBracketIdx * segmentWidth;
      const amountInBracket = getAmountInCurrentBracket(data.taxablePerPart, data.tmiRate, data.partsNb);
      
      // Simple callout with amount - white background, subtle border
      slide.addShape('rect', {
        x: calloutX + (segmentWidth - 0.03) / 2 - 0.7, // Centered under segment
        y: LAYOUT.callout.y,
        w: 1.4,
        h: LAYOUT.callout.height,
        fill: { color: 'FFFFFF' },
        line: { color: theme.accent.replace('#', ''), width: 0.75 },
      });
      
      // Amount text
      slide.addText(euro(amountInBracket), {
        x: calloutX + (segmentWidth - 0.03) / 2 - 0.7,
        y: LAYOUT.callout.y,
        w: 1.4,
        h: LAYOUT.callout.height,
        fontSize: 10,
        fontFace: TYPO.fontFace,
        color: theme.textMain.replace('#', ''),
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    }
  }
  
  // ========== TAX RESULT (HERO SECTION) ==========
  // Label - "Estimation du montant de votre impôt sur le revenu :"
  slide.addText('Estimation du montant de votre impôt sur le revenu :', {
    x: LAYOUT.marginX,
    y: LAYOUT.result.labelY,
    w: slideWidth - LAYOUT.marginX * 2 - 2.5, // Leave space for value
    h: 0.35,
    fontSize: 12,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    align: 'right',
    valign: 'middle',
  });
  
  // Tax amount (inline with label, bold, prominent)
  slide.addText(data.irNet === 0 ? 'Non imposable' : euro(data.irNet), {
    x: slideWidth / 2 + 1.5,
    y: LAYOUT.result.labelY,
    w: 3,
    h: 0.35,
    fontSize: 16,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'left',
    valign: 'middle',
  });
  
  // Decorative line below (premium separator)
  slide.addShape('line', {
    x: slideWidth / 2 - 2.5,
    y: LAYOUT.result.lineY,
    w: 5,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1 },
  });
  
  // ========== MARGIN TO NEXT TMI ==========
  const marginInfo = calculateMarginToNextTmi(data.taxablePerPart, data.tmiRate);
  if (marginInfo && marginInfo.margin > 0) {
    slide.addText(`Encore ${euro(marginInfo.margin * data.partsNb)} avant la tranche ${marginInfo.nextRate}%`, {
      x: LAYOUT.marginX,
      y: LAYOUT.margin.y,
      w: LAYOUT.contentWidth,
      h: LAYOUT.margin.height,
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
