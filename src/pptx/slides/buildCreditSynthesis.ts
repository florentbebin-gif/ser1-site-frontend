/**
 * Credit Synthesis Slide Builder (Slide 3)
 * 
 * Premium visual layout for Credit simulation:
 * - HERO metric: Coût total du crédit (central, impossible to miss)
 * - 4 KPI cards: Capital, Durée, Mensualité, Taux
 * - Visual: Split bar showing Capital vs Coût total
 * 
 * Design: White background, generous spacing, institutional look
 * Readable in 3 seconds - hierarchy: HERO > KPIs > Visual
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
} from '../designSystem/serenity';
import { getBusinessIconDataUri, type BusinessIconName } from '../../icons/business/businessIconLibrary';

// ============================================================================
// TYPES
// ============================================================================

export interface CreditSynthesisData {
  capitalEmprunte: number;
  dureeMois: number;
  tauxNominal: number;       // taux annuel %
  tauxAssurance: number;     // taux annuel %
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;   // intérêts + assurance
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
}

// ============================================================================
// CONTENT ZONE BOUNDARIES (STRICT - NO OVERFLOW)
// ============================================================================

const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

// ============================================================================
// LAYOUT CONSTANTS (inches) - PREMIUM DESIGN
// 
// ZONE ALLOCATION:
// - KPIs:       Y 2.70 → 3.85 (1.15") - 4 columns with icons, labels, values
// - GAP:        Y 3.85 → 4.10 (0.25") - breathing room
// - HERO:       Y 4.10 → 5.30 (1.20") - PRIMARY: Coût total du crédit
// - GAP:        Y 5.30 → 5.50 (0.20") - breathing room
// - VISUAL BAR: Y 5.50 → 6.20 (0.70") - Capital vs Coût total split bar
// - Buffer:     Y 6.20 → 6.80 (0.60" safety margin to footer)
// ============================================================================

const VERTICAL_SHIFT = 0.32;

const LAYOUT = {
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  slideWidth: SLIDE_SIZE.width, // 13.3333
  
  // ===== SECTION 1: KPIs (4 columns) =====
  kpi: {
    iconSize: 0.48,
    iconY: CONTENT_TOP_Y + VERTICAL_SHIFT,           // 2.70
    labelY: CONTENT_TOP_Y + VERTICAL_SHIFT + 0.54,   // 3.24
    valueY: CONTENT_TOP_Y + VERTICAL_SHIFT + 0.78,   // 3.48
    colWidth: 2.8,
    colSpacing: 0.18,
    sectionEndY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.15, // 3.85
  },
  
  // ===== SECTION 2: HERO - Coût total du crédit =====
  hero: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.40,        // 4.10
    labelHeight: 0.28,
    valueHeight: 0.52,
    subLabelHeight: 0.24,
    lineY: CONTENT_TOP_Y + VERTICAL_SHIFT + 2.50,    // 5.20
    sectionEndY: CONTENT_TOP_Y + VERTICAL_SHIFT + 2.60, // 5.30
  },
  
  // ===== SECTION 3: Visual Bar (Capital vs Coût) =====
  bar: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 2.80,        // 5.50
    height: 0.38,
    legendY: CONTENT_TOP_Y + VERTICAL_SHIFT + 3.25,  // 5.95
    legendHeight: 0.22,
    marginX: 1.5,
    sectionEndY: CONTENT_TOP_Y + VERTICAL_SHIFT + 3.50, // 6.20
  },
} as const;

// Safety check: ensure nothing exceeds content zone
const SAFETY_CHECK = {
  lastElementEndY: LAYOUT.bar.sectionEndY,
  footerStartY: CONTENT_BOTTOM_Y,
  safetyMargin: CONTENT_BOTTOM_Y - LAYOUT.bar.sectionEndY, // Should be > 0.4"
};

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function pct(n: number, decimals: number = 2): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`;
}

function formatDuree(mois: number): string {
  const ans = Math.floor(mois / 12);
  const moisRestants = mois % 12;
  if (moisRestants === 0) {
    return `${ans} an${ans > 1 ? 's' : ''}`;
  }
  return `${ans} an${ans > 1 ? 's' : ''} ${moisRestants} mois`;
}

/**
 * Get color for bar segment using theme gradient
 */
function getBarColor(segment: 'capital' | 'interets' | 'assurance', theme: PptxThemeRoles): string {
  switch (segment) {
    case 'capital':
      return theme.colors.color4.replace('#', ''); // Lighter, represents principal
    case 'interets':
      return theme.colors.color2.replace('#', ''); // Darker, represents cost
    case 'assurance':
      return theme.colors.color5.replace('#', ''); // Accent, represents insurance
  }
}

/**
 * Calculate relative luminance for text contrast
 */
function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getTextColorForBackground(bgColor: string, theme: PptxThemeRoles): string {
  const luminance = getRelativeLuminance(bgColor);
  return luminance < 0.4 ? 'FFFFFF' : theme.textMain.replace('#', '');
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build Credit Synthesis slide (premium KPI layout)
 */
export function buildCreditSynthesis(
  pptx: PptxGenJS,
  data: CreditSynthesisData,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  
  // White background
  slide.background = { color: 'FFFFFF' };
  
  const slideWidth = SLIDE_SIZE.width;
  
  // ========== STANDARD HEADER (from design system) ==========
  
  // Title (H1, ALL CAPS, LEFT-ALIGNED)
  addTextBox(slide, 'Synthèse de votre financement', COORDS_CONTENT.title, {
    fontSize: TYPO.sizes.h1,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Accent line under title
  addAccentLine(slide, theme, 'content');
  
  // Subtitle (H2)
  addTextBox(slide, 'Principaux indicateurs de votre crédit', COORDS_CONTENT.subtitle, {
    fontSize: TYPO.sizes.h2,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
  });
  
  // ========== SECTION 1: 4 KPI COLUMNS ==========
  const kpiData: Array<{
    icon: BusinessIconName;
    label: string;
    value: string;
    subValue?: string;
  }> = [
    {
      icon: 'money',
      label: 'Capital emprunté',
      value: euro(data.capitalEmprunte),
    },
    {
      icon: 'calculator',
      label: 'Durée du prêt',
      value: formatDuree(data.dureeMois),
      subValue: `(${data.dureeMois} mois)`,
    },
    {
      icon: 'cheque',
      label: 'Mensualité totale',
      value: euro(data.mensualiteTotale),
      subValue: `dont ${euro(data.mensualiteTotale - data.mensualiteHorsAssurance)} assurance`,
    },
    {
      icon: 'percent',
      label: 'Taux nominal',
      value: pct(data.tauxNominal),
      subValue: data.tauxAssurance > 0 ? `+ ${pct(data.tauxAssurance)} assurance` : undefined,
    },
  ];
  
  const totalKpiWidth = LAYOUT.kpi.colWidth * 4 + LAYOUT.kpi.colSpacing * 3;
  const kpiStartX = (slideWidth - totalKpiWidth) / 2;
  
  kpiData.forEach((kpi, idx) => {
    const colX = kpiStartX + idx * (LAYOUT.kpi.colWidth + LAYOUT.kpi.colSpacing);
    const centerX = colX + LAYOUT.kpi.colWidth / 2;
    
    // Icon (color5, centered)
    const iconDataUri = getBusinessIconDataUri(kpi.icon, { color: theme.colors.color5 });
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
    
    // Main value
    slide.addText(kpi.value, {
      x: colX,
      y: LAYOUT.kpi.valueY,
      w: LAYOUT.kpi.colWidth,
      h: 0.30,
      fontSize: 15,
      fontFace: TYPO.fontFace,
      color: theme.textMain.replace('#', ''),
      bold: true,
      align: 'center',
      valign: 'middle',
    });
    
    // Sub-value (if present)
    if (kpi.subValue) {
      slide.addText(kpi.subValue, {
        x: colX,
        y: LAYOUT.kpi.valueY + 0.30,
        w: LAYOUT.kpi.colWidth,
        h: 0.20,
        fontSize: 8,
        fontFace: TYPO.fontFace,
        color: theme.textBody.replace('#', ''),
        italic: true,
        align: 'center',
        valign: 'top',
      });
    }
  });
  
  // ========== SECTION 2: HERO - Coût total du crédit ==========
  
  // Hero label
  slide.addText('Coût total de votre crédit', {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.labelHeight,
    fontSize: 14,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    align: 'center',
    valign: 'middle',
  });
  
  // Hero value - VERY LARGE (32pt), BOLD = impossible to miss
  slide.addText(euro(data.coutTotalCredit), {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y + LAYOUT.hero.labelHeight,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.valueHeight,
    fontSize: 32,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'center',
    valign: 'middle',
  });
  
  // Breakdown under hero (intérêts + assurance)
  const breakdownText = `(${euro(data.coutTotalInterets)} intérêts + ${euro(data.coutTotalAssurance)} assurance)`;
  slide.addText(breakdownText, {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y + LAYOUT.hero.labelHeight + LAYOUT.hero.valueHeight,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.subLabelHeight,
    fontSize: 10,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    italic: true,
    align: 'center',
    valign: 'top',
  });
  
  // Decorative accent line below hero
  slide.addShape('line', {
    x: slideWidth / 2 - 1.8,
    y: LAYOUT.hero.lineY,
    w: 3.6,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1.5 },
  });
  
  // ========== SECTION 3: Visual Bar - Capital vs Coût Total ==========
  // Shows "Total remboursé" split into Capital (what you borrowed) and Coût (what it costs)
  
  const totalRembourse = data.capitalEmprunte + data.coutTotalCredit;
  const capitalRatio = data.capitalEmprunte / totalRembourse;
  const coutRatio = data.coutTotalCredit / totalRembourse;
  
  const barWidth = slideWidth - LAYOUT.bar.marginX * 2;
  const capitalBarWidth = barWidth * capitalRatio;
  const coutBarWidth = barWidth * coutRatio;
  
  const capitalColor = getBarColor('capital', theme);
  const coutColor = getBarColor('interets', theme);
  
  // Capital segment (left)
  slide.addShape('rect', {
    x: LAYOUT.bar.marginX,
    y: LAYOUT.bar.y,
    w: capitalBarWidth - 0.02,
    h: LAYOUT.bar.height,
    fill: { color: capitalColor },
    line: { color: capitalColor, width: 0 },
  });
  
  // Coût segment (right)
  slide.addShape('rect', {
    x: LAYOUT.bar.marginX + capitalBarWidth,
    y: LAYOUT.bar.y,
    w: coutBarWidth,
    h: LAYOUT.bar.height,
    fill: { color: coutColor },
    line: { color: coutColor, width: 0 },
  });
  
  // Labels inside bar segments
  const capitalTextColor = getTextColorForBackground(capitalColor, theme);
  const coutTextColor = getTextColorForBackground(coutColor, theme);
  
  // Capital label (if segment wide enough)
  if (capitalBarWidth > 1.5) {
    slide.addText(`Capital : ${euro(data.capitalEmprunte)}`, {
      x: LAYOUT.bar.marginX,
      y: LAYOUT.bar.y,
      w: capitalBarWidth - 0.02,
      h: LAYOUT.bar.height,
      fontSize: 10,
      fontFace: TYPO.fontFace,
      color: capitalTextColor,
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  }
  
  // Coût label (if segment wide enough)
  if (coutBarWidth > 1.5) {
    slide.addText(`Coût : ${euro(data.coutTotalCredit)}`, {
      x: LAYOUT.bar.marginX + capitalBarWidth,
      y: LAYOUT.bar.y,
      w: coutBarWidth,
      h: LAYOUT.bar.height,
      fontSize: 10,
      fontFace: TYPO.fontFace,
      color: coutTextColor,
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  }
  
  // Legend below bar
  const legendY = LAYOUT.bar.legendY;
  const legendCenterX = slideWidth / 2;
  
  slide.addText(`Total remboursé : ${euro(totalRembourse)}`, {
    x: legendCenterX - 2,
    y: legendY,
    w: 4,
    h: LAYOUT.bar.legendHeight,
    fontSize: 11,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'center',
    valign: 'middle',
  });
  
  // ========== STANDARD FOOTER (from design system) ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildCreditSynthesis;
