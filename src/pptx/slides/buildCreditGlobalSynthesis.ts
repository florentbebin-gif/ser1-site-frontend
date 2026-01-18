/**
 * Credit Global Synthesis Slide Builder
 * 
 * Premium multi-loan overview slide with:
 * - 4 KPIs (Total Capital, Max Duration, Total Cost, Insurance)
 * - Timeline visualization of payment periods (paliers)
 * - Multi-loan split bar visualization
 * - Smoothing badge if enabled
 * - HERO metric: Total cost
 * 
 * Design: Ultra-premium, comprehensible in 3 seconds
 */

import PptxGenJS from 'pptxgenjs';
import type { CreditGlobalSynthesisSlideSpec, PptxThemeRoles, ExportContext } from '../theme/types';
import { 
  TYPO, 
  COORDS_CONTENT, 
  COORDS_FOOTER,
  addFooter,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';
import type { BusinessIconName } from '../icons/addBusinessIcon';

// ============================================================================
// CONSTANTS
// ============================================================================

const SLIDE_SIZE = { width: 13.3333, height: 7.5 };

const LAYOUT = {
  // Header (using COORDS_CONTENT structure)
  title: { x: COORDS_CONTENT.title.x, y: COORDS_CONTENT.title.y, w: COORDS_CONTENT.title.w, h: 0.5 },
  subtitle: { x: COORDS_CONTENT.title.x, y: COORDS_CONTENT.title.y + 0.55, w: COORDS_CONTENT.title.w, h: 0.35 },
  accentLine: { x: COORDS_CONTENT.accentLine.x, y: COORDS_CONTENT.accentLine.y, w: COORDS_CONTENT.accentLine.w },
  
  // Content zones
  contentTopY: 2.15,
  contentBottomY: COORDS_FOOTER.date.y - 0.15,
  
  // KPIs row
  kpi: {
    topY: 2.15,
    height: 0.95,
    marginX: 0.8,
    gap: 0.25,
    iconSize: 0.45,
  },
  
  // Timeline (paliers)
  timeline: {
    topY: 3.25,
    height: 1.35,
    marginX: 1.2,
    barHeight: 0.28,
    labelHeight: 0.22,
    gap: 0.12,
  },
  
  // Loans split bar
  loansBar: {
    topY: 4.75,
    height: 0.85,
    marginX: 1.2,
    barHeight: 0.35,
  },
  
  // HERO (total cost)
  hero: {
    topY: 5.75,
    height: 0.7,
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
// MAIN BUILDER
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
  
  // ========== HEADER ==========
  
  // Title
  slide.addText('SYNTHÈSE GLOBALE DE VOTRE FINANCEMENT', {
    x: LAYOUT.title.x,
    y: LAYOUT.title.y,
    w: LAYOUT.title.w,
    h: LAYOUT.title.h,
    fontSize: TYPO.sizes.h1,
    bold: true,
    color: roleColor(theme, 'textMain'),
    fontFace: TYPO.fontFace,
  });
  
  // Subtitle
  slide.addText('Récapitulatif de votre projet immobilier', {
    x: LAYOUT.subtitle.x,
    y: LAYOUT.subtitle.y,
    w: LAYOUT.subtitle.w,
    h: LAYOUT.subtitle.h,
    fontSize: TYPO.sizes.h2,
    color: roleColor(theme, 'textBody'),
    fontFace: TYPO.fontFace,
  });
  
  // Accent line
  slide.addShape('line', {
    x: LAYOUT.accentLine.x,
    y: LAYOUT.accentLine.y,
    w: LAYOUT.accentLine.w,
    h: 0,
    line: { color: roleColor(theme, 'accent'), width: 1.5 },
  });
  
  // ========== KPIs ROW ==========
  
  const kpiData = [
    { icon: 'money' as const, label: 'Capital total', value: formatEuro(data.totalCapital) },
    { icon: 'calculator' as const, label: 'Durée max.', value: formatDuree(data.maxDureeMois) },
    { icon: 'chart-up' as const, label: 'Coût intérêts', value: formatEuro(data.coutTotalInterets) },
    { icon: 'balance' as const, label: 'Coût assurance', value: formatEuro(data.coutTotalAssurance) },
  ];
  
  const kpiCount = kpiData.length;
  const kpiAvailableW = SLIDE_SIZE.width - 2 * LAYOUT.kpi.marginX;
  const kpiW = (kpiAvailableW - (kpiCount - 1) * LAYOUT.kpi.gap) / kpiCount;
  
  kpiData.forEach((kpi, idx) => {
    const kpiX = LAYOUT.kpi.marginX + idx * (kpiW + LAYOUT.kpi.gap);
    const kpiY = LAYOUT.kpi.topY;
    
    // Icon
    addBusinessIconToSlide(
      slide,
      kpi.icon as BusinessIconName,
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
      fontSize: 9,
      color: theme.colors.color9,
      fontFace: 'Arial',
      align: 'center',
    });
    
    // Value
    slide.addText(kpi.value, {
      x: kpiX,
      y: kpiY + LAYOUT.kpi.iconSize + 0.30,
      w: kpiW,
      h: 0.28,
      fontSize: 14,
      bold: true,
      color: roleColor(theme, 'textMain'),
      fontFace: 'Arial',
      align: 'center',
    });
  });
  
  // ========== TIMELINE (PALIERS) ==========
  
  if (data.paymentPeriods.length > 1) {
    const timelineY = LAYOUT.timeline.topY;
    const timelineW = SLIDE_SIZE.width - 2 * LAYOUT.timeline.marginX;
    
    // Section title
    slide.addText('ÉVOLUTION DE VOS MENSUALITÉS', {
      x: LAYOUT.timeline.marginX,
      y: timelineY,
      w: timelineW,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: roleColor(theme, 'textMain'),
      fontFace: 'Arial',
    });
    
    // Find max mensualité for scaling
    const maxMensu = Math.max(...data.paymentPeriods.map(p => p.total));
    
    // Draw period bars
    const barStartY = timelineY + 0.35;
    const periodsCount = Math.min(data.paymentPeriods.length, 4); // Max 4 periods
    
    data.paymentPeriods.slice(0, periodsCount).forEach((period, idx) => {
      const barY = barStartY + idx * (LAYOUT.timeline.barHeight + LAYOUT.timeline.gap);
      const barWidthRatio = maxMensu > 0 ? period.total / maxMensu : 0;
      const barW = timelineW * 0.6 * barWidthRatio;
      
      // Period label
      slide.addText(period.label, {
        x: LAYOUT.timeline.marginX,
        y: barY,
        w: timelineW * 0.25,
        h: LAYOUT.timeline.barHeight,
        fontSize: 8,
        color: theme.colors.color9,
        fontFace: 'Arial',
        align: 'left',
        valign: 'middle',
      });
      
      // Bar
      slide.addShape('rect', {
        x: LAYOUT.timeline.marginX + timelineW * 0.28,
        y: barY,
        w: Math.max(barW, 0.3),
        h: LAYOUT.timeline.barHeight,
        fill: { color: lightenColor(roleColor(theme, 'bgMain'), 0.3 - idx * 0.1) },
        line: { color: roleColor(theme, 'bgMain'), width: 0.5 },
      });
      
      // Amount
      slide.addText(formatEuro(period.total), {
        x: LAYOUT.timeline.marginX + timelineW * 0.28 + Math.max(barW, 0.3) + 0.1,
        y: barY,
        w: timelineW * 0.2,
        h: LAYOUT.timeline.barHeight,
        fontSize: 10,
        bold: true,
        color: roleColor(theme, 'textMain'),
        fontFace: 'Arial',
        align: 'left',
        valign: 'middle',
      });
    });
  }
  
  // ========== LOANS SPLIT BAR ==========
  
  if (data.loans.length > 1) {
    const loansBarY = LAYOUT.loansBar.topY;
    const loansBarW = SLIDE_SIZE.width - 2 * LAYOUT.loansBar.marginX;
    
    // Section title with smoothing badge
    let titleText = 'RÉPARTITION DES PRÊTS';
    slide.addText(titleText, {
      x: LAYOUT.loansBar.marginX,
      y: loansBarY,
      w: loansBarW * 0.5,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: roleColor(theme, 'textMain'),
      fontFace: 'Arial',
    });
    
    // Smoothing badge
    if (data.smoothingEnabled) {
      const smoothingLabel = data.smoothingMode === 'duree' 
        ? '🔵 Lissage: Durée constante' 
        : '🔵 Lissage: Mensualité constante';
      slide.addText(smoothingLabel, {
        x: LAYOUT.loansBar.marginX + loansBarW * 0.5,
        y: loansBarY,
        w: loansBarW * 0.5,
        h: 0.25,
        fontSize: 9,
        italic: true,
        color: roleColor(theme, 'accent'),
        fontFace: 'Arial',
        align: 'right',
      });
    }
    
    // Split bar
    const barY = loansBarY + 0.32;
    let currentX = LAYOUT.loansBar.marginX;
    
    data.loans.forEach((loan, idx) => {
      const loanRatio = data.totalCapital > 0 ? loan.capital / data.totalCapital : 0;
      const segmentW = loansBarW * loanRatio;
      
      if (segmentW > 0.1) {
        // Bar segment
        slide.addShape('rect', {
          x: currentX,
          y: barY,
          w: segmentW,
          h: LAYOUT.loansBar.barHeight,
          fill: { color: getLoanColor(loan.index, theme) },
        });
        
        // Label inside bar
        if (segmentW > 1.5) {
          slide.addText(`Prêt ${loan.index}: ${formatEuro(loan.capital)}`, {
            x: currentX,
            y: barY,
            w: segmentW,
            h: LAYOUT.loansBar.barHeight,
            fontSize: 9,
            bold: true,
            color: 'FFFFFF',
            fontFace: 'Arial',
            align: 'center',
            valign: 'middle',
          });
        }
        
        currentX += segmentW;
      }
    });
    
    // Legend below bar
    const legendY = barY + LAYOUT.loansBar.barHeight + 0.08;
    let legendX = LAYOUT.loansBar.marginX;
    
    data.loans.forEach((loan) => {
      // Color dot
      slide.addShape('ellipse', {
        x: legendX,
        y: legendY + 0.05,
        w: 0.12,
        h: 0.12,
        fill: { color: getLoanColor(loan.index, theme) },
      });
      
      // Label
      const labelText = `Prêt ${loan.index}: ${formatEuro(loan.capital)} sur ${formatDuree(loan.dureeMois)}`;
      slide.addText(labelText, {
        x: legendX + 0.18,
        y: legendY,
        w: 3.5,
        h: 0.22,
        fontSize: 8,
        color: theme.colors.color9,
        fontFace: 'Arial',
        align: 'left',
      });
      
      legendX += 4;
    });
  }
  
  // ========== HERO: TOTAL COST ==========
  
  const heroY = LAYOUT.hero.topY;
  
  // Decorative line
  slide.addShape('rect', {
    x: SLIDE_SIZE.width / 2 - 2,
    y: heroY - 0.08,
    w: 4,
    h: 0.02,
    fill: { color: roleColor(theme, 'accent') },
  });
  
  // HERO value
  slide.addText(`COÛT TOTAL DU CRÉDIT : ${formatEuro(data.coutTotalCredit)}`, {
    x: 0,
    y: heroY,
    w: SLIDE_SIZE.width,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: roleColor(theme, 'textMain'),
    fontFace: 'Arial',
    align: 'center',
  });
  
  // Total remboursé (smaller, secondary)
  const totalRembourse = data.totalCapital + data.coutTotalCredit;
  slide.addText(`Total remboursé : ${formatEuro(totalRembourse)}`, {
    x: 0,
    y: heroY + 0.45,
    w: SLIDE_SIZE.width,
    h: 0.25,
    fontSize: 10,
    italic: true,
    color: theme.colors.color9,
    fontFace: 'Arial',
    align: 'center',
  });
  
  // ========== FOOTER ==========
  
  addFooter(
    slide,
    {
      generatedAt: ctx.generatedAt,
      footerDisclaimer: ctx.footerDisclaimer,
      showSlideNumbers: ctx.showSlideNumbers,
      theme,
    },
    slideIndex,
    'onLight'
  );
}

export default buildCreditGlobalSynthesis;
