/**
 * Credit Global Synthesis Slide Builder
 * 
 * Premium multi-loan overview slide - AERATED DESIGN
 * Comprehensible in 3 seconds:
 * - HERO at top (Mensualité initiale)
 * - 3 KPIs (Capital total, Durée max, Coût total)
 * - Mini-cards for each loan
 * - Smoothing badge if enabled
 * 
 * IMPORTANT: Uses standard Serenity template (title, accent line, subtitle, footer)
 * Subtitle MUST use COORDS_CONTENT.subtitle (below accent line)
 */

import PptxGenJS from 'pptxgenjs';
import type { CreditGlobalSynthesisSlideSpec, PptxThemeRoles, ExportContext } from '../theme/types';
import { 
  TYPO, 
  COORDS_CONTENT, 
  COORDS_FOOTER,
  addTextBox,
  addAccentLine,
  addFooter,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';
import type { BusinessIconName } from '../icons/addBusinessIcon';

// ============================================================================
// CONSTANTS - PREMIUM AERATED LAYOUT
// ============================================================================

const SLIDE_SIZE = { width: 13.3333, height: 7.5 };

// Content zone boundaries (below subtitle, above footer)
const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

const LAYOUT = {
  // HERO zone (mensualité initiale) - prominent at top
  hero: {
    y: CONTENT_TOP_Y + 0.15,
    height: 1.1,
  },
  
  // 3 KPIs row - centered, generous spacing
  kpi: {
    y: CONTENT_TOP_Y + 1.45,
    height: 1.0,
    marginX: 2.0,
    gap: 0.5,
    iconSize: 0.5,
  },
  
  // Mini-cards for loans - clean visual
  cards: {
    y: CONTENT_TOP_Y + 2.7,
    height: 1.2,
    marginX: 1.5,
    gap: 0.4,
    cardHeight: 1.0,
  },
  
  // Footer info (total remboursé + smoothing badge)
  footerInfo: {
    y: CONTENT_BOTTOM_Y - 0.5,
    height: 0.4,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

function formatDuree(mois: number): string {
  const annees = Math.floor(mois / 12);
  const moisReste = mois % 12;
  if (moisReste === 0) return `${annees} an${annees > 1 ? 's' : ''}`;
  return `${annees} an${annees > 1 ? 's' : ''} ${moisReste} mois`;
}

/**
 * Get color for loan index (using theme variations)
 */
function getLoanColor(index: number, theme: PptxThemeRoles): string {
  const colors = [
    roleColor(theme, 'bgMain'),      // Loan 1: main color
    roleColor(theme, 'accent'),      // Loan 2: accent
    theme.colors.color3.replace('#', ''), // Loan 3: color3
  ];
  return colors[index - 1] || colors[0];
}

/**
 * Lighten a hex color
 */
function lightenColor(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * percent));
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * percent));
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * percent));
  return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
}

// ============================================================================
// MAIN BUILDER - PREMIUM AERATED DESIGN
// ============================================================================

export function buildCreditGlobalSynthesis(
  pptx: PptxGenJS,
  data: CreditGlobalSynthesisSlideSpec,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  
  // White background
  slide.background = { color: 'FFFFFF' };
  
  // ========== STANDARD HEADER (using Serenity helpers) ==========
  
  // Title (H1, ALL CAPS, LEFT-ALIGNED) - using helper with COORDS_CONTENT.title
  addTextBox(slide, 'Synthèse globale de votre financement', COORDS_CONTENT.title, {
    fontSize: TYPO.sizes.h1,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Accent line under title - using helper
  addAccentLine(slide, theme, 'content');
  
  // Subtitle (H2) - MUST use COORDS_CONTENT.subtitle (below accent line)
  addTextBox(slide, 'Vue d\'ensemble de votre montage multi-prêts', COORDS_CONTENT.subtitle, {
    fontSize: TYPO.sizes.h2,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
  });
  
  // ========== HERO ZONE: MENSUALITÉ INITIALE ==========
  
  const heroY = LAYOUT.hero.y;
  const initialMensualite = data.paymentPeriods.length > 0 ? data.paymentPeriods[0].total : 0;
  
  // HERO label
  slide.addText('VOTRE MENSUALITÉ', {
    x: 0,
    y: heroY,
    w: SLIDE_SIZE.width,
    h: 0.35,
    fontSize: 12,
    color: roleColor(theme, 'textBody'),
    fontFace: TYPO.fontFace,
    align: 'center',
  });
  
  // HERO value (big, prominent)
  slide.addText(formatEuro(initialMensualite) + ' / mois', {
    x: 0,
    y: heroY + 0.35,
    w: SLIDE_SIZE.width,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: roleColor(theme, 'textMain'),
    fontFace: TYPO.fontFace,
    align: 'center',
  });
  
  // ========== 3 KPIs ROW (Capital, Durée, Coût total) ==========
  
  const kpiData = [
    { icon: 'money' as BusinessIconName, label: 'Capital total', value: formatEuro(data.totalCapital) },
    { icon: 'calculator' as BusinessIconName, label: 'Durée maximale', value: formatDuree(data.maxDureeMois) },
    { icon: 'chart-up' as BusinessIconName, label: 'Coût total crédit', value: formatEuro(data.coutTotalCredit) },
  ];
  
  const kpiCount = kpiData.length;
  const kpiAvailableW = SLIDE_SIZE.width - 2 * LAYOUT.kpi.marginX;
  const kpiW = (kpiAvailableW - (kpiCount - 1) * LAYOUT.kpi.gap) / kpiCount;
  const kpiY = LAYOUT.kpi.y;
  
  kpiData.forEach((kpi, idx) => {
    const kpiX = LAYOUT.kpi.marginX + idx * (kpiW + LAYOUT.kpi.gap);
    
    // Icon (centered)
    addBusinessIconToSlide(
      slide,
      kpi.icon,
      {
        x: kpiX + kpiW / 2 - LAYOUT.kpi.iconSize / 2,
        y: kpiY,
        w: LAYOUT.kpi.iconSize,
        h: LAYOUT.kpi.iconSize,
      },
      theme,
      'accent'
    );
    
    // Label
    slide.addText(kpi.label, {
      x: kpiX,
      y: kpiY + LAYOUT.kpi.iconSize + 0.08,
      w: kpiW,
      h: 0.22,
      fontSize: 10,
      color: roleColor(theme, 'textBody'),
      fontFace: TYPO.fontFace,
      align: 'center',
    });
    
    // Value
    slide.addText(kpi.value, {
      x: kpiX,
      y: kpiY + LAYOUT.kpi.iconSize + 0.32,
      w: kpiW,
      h: 0.30,
      fontSize: 16,
      bold: true,
      color: roleColor(theme, 'textMain'),
      fontFace: TYPO.fontFace,
      align: 'center',
    });
  });
  
  // ========== MINI-CARDS: ONE PER LOAN ==========
  
  const cardsY = LAYOUT.cards.y;
  const loansCount = Math.min(data.loans.length, 3);
  const cardsAvailableW = SLIDE_SIZE.width - 2 * LAYOUT.cards.marginX;
  const cardW = (cardsAvailableW - (loansCount - 1) * LAYOUT.cards.gap) / loansCount;
  
  data.loans.slice(0, 3).forEach((loan, idx) => {
    const cardX = LAYOUT.cards.marginX + idx * (cardW + LAYOUT.cards.gap);
    const cardColor = getLoanColor(loan.index, theme);
    
    // Card background (rounded rect simulation with fill)
    slide.addShape('rect', {
      x: cardX,
      y: cardsY,
      w: cardW,
      h: LAYOUT.cards.cardHeight,
      fill: { color: lightenColor(cardColor, 0.85) },
      line: { color: cardColor, width: 1 },
    });
    
    // Card header (loan number)
    slide.addText(`PRÊT N°${loan.index}`, {
      x: cardX,
      y: cardsY + 0.08,
      w: cardW,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: cardColor,
      fontFace: TYPO.fontFace,
      align: 'center',
    });
    
    // Card capital (main value)
    slide.addText(formatEuro(loan.capital), {
      x: cardX,
      y: cardsY + 0.35,
      w: cardW,
      h: 0.30,
      fontSize: 14,
      bold: true,
      color: roleColor(theme, 'textMain'),
      fontFace: TYPO.fontFace,
      align: 'center',
    });
    
    // Card duration
    slide.addText(formatDuree(loan.dureeMois), {
      x: cardX,
      y: cardsY + 0.68,
      w: cardW,
      h: 0.22,
      fontSize: 10,
      color: roleColor(theme, 'textBody'),
      fontFace: TYPO.fontFace,
      align: 'center',
    });
  });
  
  // ========== FOOTER INFO (Total remboursé + Smoothing badge) ==========
  
  const footerInfoY = LAYOUT.footerInfo.y;
  
  // Total remboursé
  const totalRembourse = data.totalCapital + data.coutTotalCredit;
  slide.addText(`Total remboursé : ${formatEuro(totalRembourse)}`, {
    x: COORDS_CONTENT.margin.x,
    y: footerInfoY,
    w: COORDS_CONTENT.margin.w * 0.5,
    h: 0.3,
    fontSize: 11,
    color: roleColor(theme, 'textBody'),
    fontFace: TYPO.fontFace,
    align: 'left',
  });
  
  // Smoothing badge (if enabled)
  if (data.smoothingEnabled) {
    const smoothingLabel = data.smoothingMode === 'duree' 
      ? 'Lissage activé : durée constante' 
      : 'Lissage activé : mensualité constante';
    
    // Badge background
    const badgeX = COORDS_CONTENT.margin.x + COORDS_CONTENT.margin.w - 3.2;
    slide.addShape('rect', {
      x: badgeX,
      y: footerInfoY + 0.02,
      w: 3.0,
      h: 0.26,
      fill: { color: lightenColor(roleColor(theme, 'accent'), 0.7) },
      line: { color: roleColor(theme, 'accent'), width: 0.5 },
    });
    
    // Badge text
    slide.addText(smoothingLabel, {
      x: badgeX,
      y: footerInfoY + 0.02,
      w: 3.0,
      h: 0.26,
      fontSize: 9,
      bold: true,
      color: roleColor(theme, 'accent'),
      fontFace: TYPO.fontFace,
      align: 'center',
      valign: 'middle',
    });
  }
  
  // ========== STANDARD FOOTER ==========
  
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildCreditGlobalSynthesis;
