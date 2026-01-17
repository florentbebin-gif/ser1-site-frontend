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
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles } from '../theme/types';
import { SLIDE_SIZE, TYPO } from '../designSystem/serenity';
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
// LAYOUT CONSTANTS (inches)
// ============================================================================

const LAYOUT = {
  // Safe margins
  marginX: 0.6,
  marginTop: 0.5,
  marginBottom: 1.0, // Footer space
  
  // KPI Section (top)
  kpi: {
    y: 0.6,
    iconSize: 0.55,
    iconY: 0.7,
    labelY: 1.35,
    valueY: 1.65,
    detailY: 2.1,
    colWidth: 3.0,
    colSpacing: 0.2,
  },
  
  // TMI Bar (middle)
  bar: {
    y: 3.2,
    height: 0.7,
    marginX: 1.2,
  },
  
  // Active bracket callout
  callout: {
    y: 4.1,
    height: 0.5,
  },
  
  // Tax result (bottom center)
  result: {
    y: 5.0,
    height: 0.9,
  },
  
  // Margin to next TMI
  margin: {
    y: 5.9,
    height: 0.4,
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
 */
export function buildIrSynthesis(
  pptx: PptxGenJS,
  data: IrSynthesisData,
  theme: PptxThemeRoles,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  
  // White background
  slide.background = { color: 'FFFFFF' };
  
  const slideWidth = SLIDE_SIZE.width;
  const barWidth = slideWidth - LAYOUT.bar.marginX * 2;
  
  // ========== TITLE ==========
  slide.addText('SYNTHÈSE DE VOTRE SIMULATION', {
    x: LAYOUT.marginX,
    y: LAYOUT.marginTop,
    w: slideWidth - LAYOUT.marginX * 2,
    h: 0.5,
    fontSize: TYPO.sizes.h1,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'center',
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
      w: slideWidth - LAYOUT.marginX * 2,
      h: LAYOUT.margin.height,
      fontSize: 10,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      italic: true,
      align: 'center',
      valign: 'middle',
    });
  }
  
  // ========== FOOTER ==========
  slide.addText(`${slideIndex}`, {
    x: slideWidth - 1.5,
    y: SLIDE_SIZE.height - 0.5,
    w: 1,
    h: 0.3,
    fontSize: TYPO.sizes.footer,
    fontFace: TYPO.fontFace,
    color: '999999',
    align: 'right',
  });
}

export default buildIrSynthesis;
