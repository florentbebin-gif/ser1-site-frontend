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
  SLIDE_SIZE,
  TYPO,
  COORDS_CONTENT, 
  COORDS_FOOTER,
  addTextBox,
  addHeader,
  addFooter,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';
import type { BusinessIconName } from '../icons/addBusinessIcon';

// ============================================================================
// CONSTANTS - PREMIUM AERATED LAYOUT
// ============================================================================

// Content zone boundaries (below subtitle, above footer)
const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

const LAYOUT = {
  // HERO zone (mensualité initiale) - prominent at top
  hero: {
    y: CONTENT_TOP_Y + 0.05,
    height: 0.85,
  },
  
  // 3 KPIs row - centered, compact
  kpi: {
    y: CONTENT_TOP_Y + 0.95,
    height: 0.85,
    marginX: 2.0,
    gap: 0.4,
    iconSize: 0.4,
  },
  
  // Timeline paliers (central visual)
  timeline: {
    y: CONTENT_TOP_Y + 1.95,
    height: 1.1,
    marginX: 1.2,
    barHeight: 0.5,
  },
  
  // Insurance mini-bar
  insurance: {
    y: CONTENT_TOP_Y + 3.15,
    height: 0.55,
    marginX: 1.2,
  },
  
  // Footer info (total remboursé + smoothing badge)
  footerInfo: {
    y: CONTENT_BOTTOM_Y - 0.45,
    height: 0.35,
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
  
  // ========== STANDARD HEADER (centralized) ==========
  addHeader(slide, 'Synthèse globale de votre financement', 'Vue d\'ensemble de votre montage multi-prêts', theme, 'content');
  
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
    { icon: 'chart-up' as BusinessIconName, label: 'Coût total', value: formatEuro(data.coutTotalCredit) },
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
      y: kpiY + LAYOUT.kpi.iconSize + 0.26,
      w: kpiW,
      h: 0.28,
      fontSize: 14,
      bold: true,
      color: roleColor(theme, 'textMain'),
      fontFace: TYPO.fontFace,
      align: 'center',
    });
  });
  
  // ========== TIMELINE PALIERS (payment periods visualization) ==========
  
  const timelineY = LAYOUT.timeline.y;
  const timelineW = SLIDE_SIZE.width - 2 * LAYOUT.timeline.marginX;
  const periods = data.paymentPeriods;
  
  if (periods.length > 0) {
    // Timeline label
    slide.addText('ÉVOLUTION DE VOS MENSUALITÉS', {
      x: LAYOUT.timeline.marginX,
      y: timelineY,
      w: timelineW,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: roleColor(theme, 'textBody'),
      fontFace: TYPO.fontFace,
      align: 'left',
    });
    
    // Calculate segment widths based on periods (equal segments for simplicity)
    const segmentCount = Math.min(periods.length, 4); // Max 4 segments to avoid clutter
    const segmentGap = 0.08;
    const segmentW = (timelineW - (segmentCount - 1) * segmentGap) / segmentCount;
    const barY = timelineY + 0.30;
    
    periods.slice(0, 4).forEach((period, idx) => {
      const segX = LAYOUT.timeline.marginX + idx * (segmentW + segmentGap);
      const segColor = idx === 0 ? roleColor(theme, 'bgMain') : roleColor(theme, 'accent');
      
      // Segment bar
      slide.addShape('rect', {
        x: segX,
        y: barY,
        w: segmentW,
        h: LAYOUT.timeline.barHeight,
        fill: { color: segColor },
      });
      
      // Period label (top of bar)
      slide.addText(period.label, {
        x: segX,
        y: barY + 0.05,
        w: segmentW,
        h: 0.18,
        fontSize: 8,
        color: 'FFFFFF',
        fontFace: TYPO.fontFace,
        align: 'center',
      });
      
      // Mensualité value (center of bar)
      slide.addText(formatEuro(period.total) + '/mois', {
        x: segX,
        y: barY + 0.22,
        w: segmentW,
        h: 0.22,
        fontSize: 11,
        bold: true,
        color: 'FFFFFF',
        fontFace: TYPO.fontFace,
        align: 'center',
      });
    });
  }
  
  // ========== INSURANCE MINI-BAR (death coverage visualization) ==========
  
  const insuranceY = LAYOUT.insurance.y;
  const insuranceW = SLIDE_SIZE.width - 2 * LAYOUT.insurance.marginX;
  const totalInsuranceCost = data.coutTotalAssurance;
  
  if (totalInsuranceCost > 0) {
    // Insurance label
    slide.addText('COUVERTURE ASSURANCE DÉCÈS', {
      x: LAYOUT.insurance.marginX,
      y: insuranceY,
      w: insuranceW * 0.4,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: roleColor(theme, 'textBody'),
      fontFace: TYPO.fontFace,
      align: 'left',
    });
    
    // Insurance bar (full duration coverage)
    const barX = LAYOUT.insurance.marginX + insuranceW * 0.42;
    const barW = insuranceW * 0.38;
    
    slide.addShape('rect', {
      x: barX,
      y: insuranceY,
      w: barW,
      h: 0.22,
      fill: { color: lightenColor(roleColor(theme, 'accent'), 0.6) },
      line: { color: roleColor(theme, 'accent'), width: 0.5 },
    });
    
    // Duration label inside bar
    slide.addText(`Couverture sur ${formatDuree(data.maxDureeMois)}`, {
      x: barX,
      y: insuranceY,
      w: barW,
      h: 0.22,
      fontSize: 8,
      color: roleColor(theme, 'textMain'),
      fontFace: TYPO.fontFace,
      align: 'center',
      valign: 'middle',
    });
    
    // Cost label
    slide.addText(`Coût : ${formatEuro(totalInsuranceCost)}`, {
      x: LAYOUT.insurance.marginX + insuranceW * 0.82,
      y: insuranceY,
      w: insuranceW * 0.18,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: roleColor(theme, 'textMain'),
      fontFace: TYPO.fontFace,
      align: 'right',
    });
  }
  
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
