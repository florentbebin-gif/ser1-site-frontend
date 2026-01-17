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
// ============================================================================

const LAYOUT = {
  // Use standard margins from design system
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  
  // KPI Section (top of content zone)
  kpi: {
    iconSize: 0.5,
    iconY: CONTENT_TOP_Y + 0.1, // 2.48
    labelY: CONTENT_TOP_Y + 0.7, // 3.08
    valueY: CONTENT_TOP_Y + 1.0, // 3.38
    detailY: CONTENT_TOP_Y + 1.4, // 3.78
    colWidth: 2.7,
    colSpacing: 0.15,
  },
  
  // TMI Bar (middle of content zone)
  bar: {
    y: CONTENT_TOP_Y + 2.0, // 4.38
    height: 0.6,
    marginX: 1.0,
  },
  
  // Active bracket callout
  callout: {
    y: CONTENT_TOP_Y + 2.7, // 5.08
    height: 0.4,
  },
  
  // Tax result (center of content zone)
  result: {
    y: CONTENT_TOP_Y + 3.2, // 5.58
    height: 0.8,
  },
  
  // Margin to next TMI (bottom of content zone)
  margin: {
    y: CONTENT_TOP_Y + 4.1, // 6.48
    height: 0.3,
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
 * Get color intensity for bracket (gradient from light to dark)
 */
function getBracketColor(rate: number, theme: PptxThemeRoles, isActive: boolean): string {
  // Use theme accent with varying opacity simulation via color mixing
  const accent = theme.accent.replace('#', '');
  
  if (isActive) {
    return accent; // Full accent color for active bracket
  }
  
  // Desaturated/lighter versions for inactive brackets
  const intensityMap: Record<number, string> = {
    0: 'E8E8E8',   // Very light gray
    11: 'D0D0D0',  // Light gray
    30: 'B8B8B8',  // Medium gray
    41: 'A0A0A0',  // Darker gray
    45: '888888',  // Dark gray
  };
  
  return intensityMap[rate] || 'CCCCCC';
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
  
  // ========== 4 KPI COLUMNS ==========
  const kpiData: Array<{
    icon: BusinessIconName;
    label: string;
    value: string;
    details?: string[];
  }> = [
    {
      icon: 'money',
      label: 'Estimation de vos revenus',
      value: data.isCouple 
        ? '' 
        : euro(data.income1 + data.income2),
      details: data.isCouple 
        ? [`Déclarant 1 : ${euro(data.income1)}`, `Déclarant 2 : ${euro(data.income2)}`]
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
    
    // Icon (centered, outline style via accent color)
    const iconDataUri = getBusinessIconDataUri(kpi.icon, { color: theme.accent });
    slide.addImage({
      data: iconDataUri,
      x: centerX - LAYOUT.kpi.iconSize / 2,
      y: LAYOUT.kpi.iconY,
      w: LAYOUT.kpi.iconSize,
      h: LAYOUT.kpi.iconSize,
    });
    
    // Label (small, centered)
    slide.addText(kpi.label.toUpperCase(), {
      x: colX,
      y: LAYOUT.kpi.labelY,
      w: LAYOUT.kpi.colWidth,
      h: 0.3,
      fontSize: 9,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      align: 'center',
      valign: 'middle',
    });
    
    // Value (bold, centered)
    if (kpi.value) {
      slide.addText(kpi.value, {
        x: colX,
        y: LAYOUT.kpi.valueY,
        w: LAYOUT.kpi.colWidth,
        h: 0.4,
        fontSize: 18,
        fontFace: TYPO.fontFace,
        color: theme.textMain.replace('#', ''),
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    }
    
    // Details (for couple income breakdown)
    if (kpi.details && kpi.details.length > 0) {
      kpi.details.forEach((detail, detailIdx) => {
        slide.addText(detail, {
          x: colX,
          y: LAYOUT.kpi.valueY + detailIdx * 0.3,
          w: LAYOUT.kpi.colWidth,
          h: 0.3,
          fontSize: 11,
          fontFace: TYPO.fontFace,
          color: theme.textBody.replace('#', ''),
          align: 'center',
          valign: 'middle',
        });
      });
    }
  });
  
  // ========== TMI BRACKET BAR ==========
  const segmentWidth = barWidth / TMI_BRACKETS.length;
  
  TMI_BRACKETS.forEach((bracket, idx) => {
    const segX = LAYOUT.bar.marginX + idx * segmentWidth;
    const isActive = bracket.rate === data.tmiRate;
    const bgColor = getBracketColor(bracket.rate, theme, isActive);
    
    // Segment rectangle
    slide.addShape('rect', {
      x: segX,
      y: LAYOUT.bar.y,
      w: segmentWidth - 0.02, // Small gap between segments
      h: LAYOUT.bar.height,
      fill: { color: bgColor },
      line: { color: isActive ? theme.accent.replace('#', '') : 'CCCCCC', width: isActive ? 2 : 0.5 },
    });
    
    // Rate label centered in segment
    slide.addText(bracket.label, {
      x: segX,
      y: LAYOUT.bar.y,
      w: segmentWidth - 0.02,
      h: LAYOUT.bar.height,
      fontSize: 14,
      fontFace: TYPO.fontFace,
      color: isActive ? 'FFFFFF' : '666666',
      bold: isActive,
      align: 'center',
      valign: 'middle',
    });
  });
  
  // ========== ACTIVE BRACKET CALLOUT ==========
  if (data.tmiRate > 0) {
    const activeBracketIdx = TMI_BRACKETS.findIndex(b => b.rate === data.tmiRate);
    if (activeBracketIdx >= 0) {
      const calloutX = LAYOUT.bar.marginX + activeBracketIdx * segmentWidth;
      const amountInBracket = getAmountInCurrentBracket(data.taxablePerPart, data.tmiRate, data.partsNb);
      
      // Callout box (beige accent)
      slide.addShape('rect', {
        x: calloutX,
        y: LAYOUT.callout.y,
        w: segmentWidth - 0.02,
        h: LAYOUT.callout.height,
        fill: { color: 'F5F0E8' }, // Beige clair
        line: { color: theme.accent.replace('#', ''), width: 1 },
      });
      
      // Amount in bracket
      slide.addText(euro(amountInBracket), {
        x: calloutX,
        y: LAYOUT.callout.y,
        w: segmentWidth - 0.02,
        h: LAYOUT.callout.height,
        fontSize: 11,
        fontFace: TYPO.fontFace,
        color: theme.textMain.replace('#', ''),
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    }
  }
  
  // ========== TAX RESULT (CENTER) ==========
  // Decorative line above
  slide.addShape('line', {
    x: slideWidth / 2 - 2,
    y: LAYOUT.result.y - 0.15,
    w: 4,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1.5 },
  });
  
  // Label
  slide.addText('Estimation du montant de votre impôt sur le revenu', {
    x: LAYOUT.marginX,
    y: LAYOUT.result.y,
    w: slideWidth - LAYOUT.marginX * 2,
    h: 0.35,
    fontSize: 14,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    align: 'center',
    valign: 'middle',
  });
  
  // Tax amount (large, bold)
  slide.addText(data.irNet === 0 ? 'Non imposable' : euro(data.irNet), {
    x: LAYOUT.marginX,
    y: LAYOUT.result.y + 0.35,
    w: slideWidth - LAYOUT.marginX * 2,
    h: 0.55,
    fontSize: 28,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'center',
    valign: 'middle',
  });
  
  // Decorative line below
  slide.addShape('line', {
    x: slideWidth / 2 - 2,
    y: LAYOUT.result.y + LAYOUT.result.height + 0.05,
    w: 4,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1.5 },
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
