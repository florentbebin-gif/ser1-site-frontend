/**
 * Credit Global Synthesis Slide Builder
 * 
 * REPRODUCES EXACTLY the reference mockup:
 * - Title + beige underline
 * - Subtitle: "Vue d'ensemble de votre montage multi-prêts"
 * - Central: "VOTRE MENSUALITÉ" + big value
 * - 3 KPIs with thin icons (Capital, Durée, Coût)
 * - Timeline with 2 colored segments + dates above + gray ticks below with capital labels
 * - Bottom row: 3 icons (Total remboursé, Lissage, Assurance décès)
 * 
 * IMPORTANT: Uses standard Serenity template (title, accent line, subtitle, footer)
 */

import PptxGenJS from 'pptxgenjs';
import type { CreditGlobalSynthesisSlideSpec, PptxThemeRoles, ExportContext } from '../theme/types';
import {
  SLIDE_SIZE,
  TYPO,
  COORDS_CONTENT, 
  COORDS_FOOTER,
  addHeader,
  addFooter,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';
import type { BusinessIconName } from '../icons/addBusinessIcon';

// ============================================================================
// CONSTANTS - LAYOUT MATCHING REFERENCE MOCKUP
// ============================================================================

const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

const LAYOUT = {
  // HERO zone (VOTRE MENSUALITÉ)
  hero: {
    y: CONTENT_TOP_Y + 0.05,
    height: 0.75,
  },
  
  // 3 KPIs row
  kpi: {
    y: CONTENT_TOP_Y + 0.85,
    height: 0.80,
    marginX: 2.0,
    gap: 0.5,
    iconSize: 0.35,
  },
  
  // Timeline with paliers
  timeline: {
    y: CONTENT_TOP_Y + 1.75,
    marginX: 1.0,
    barHeight: 0.40,
    tickHeight: 0.18,
  },
  
  // Bottom info row (3 elements with icons)
  bottomRow: {
    y: CONTENT_BOTTOM_Y - 0.55,
    height: 0.45,
    marginX: 1.0,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function formatEuro(n: number): string {
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

function formatEuroShort(n: number): string {
  if (n >= 1000) {
    return Math.round(n / 1000).toLocaleString('fr-FR') + ' K€';
  }
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

function formatDuree(mois: number): string {
  const annees = Math.floor(mois / 12);
  const moisReste = mois % 12;
  if (moisReste === 0) return `${annees} an${annees > 1 ? 's' : ''}`;
  return `${annees} an${annees > 1 ? 's' : ''} ${moisReste} mois`;
}

function formatDate(dateStr: string): string {
  // Convert "À partir de 01/2025" or date string to "01/2025"
  if (dateStr.includes('/')) {
    const match = dateStr.match(/(\d{2}\/\d{4})/);
    return match ? match[1] : dateStr;
  }
  return dateStr;
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
// MAIN BUILDER - MATCHING REFERENCE MOCKUP EXACTLY
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
  
  // ========== STANDARD HEADER ==========
  addHeader(slide, 'Synthèse globale de votre financement', 'Vue d\'ensemble de votre montage multi-prêts', theme, 'content');
  
  // ========== HERO: VOTRE MENSUALITÉ ==========
  const heroY = LAYOUT.hero.y;
  const initialMensualite = data.paymentPeriods.length > 0 ? data.paymentPeriods[0].total : 0;
  
  slide.addText('VOTRE MENSUALITÉ', {
    x: 0, y: heroY, w: SLIDE_SIZE.width, h: 0.30,
    fontSize: 11, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'center',
    lang: 'fr-FR',
  });
  
  slide.addText(formatEuro(initialMensualite) + ' / mois', {
    x: 0, y: heroY + 0.28, w: SLIDE_SIZE.width, h: 0.50,
    fontSize: 28, bold: true, color: roleColor(theme, 'textMain'), fontFace: TYPO.fontFace, align: 'center',
    lang: 'fr-FR',
  });
  
  // ========== 3 KPIs ROW ==========
  const kpiData = [
    { icon: 'money' as BusinessIconName, label: 'Capital total', value: formatEuro(data.totalCapital) },
    { icon: 'calendar' as BusinessIconName, label: 'Durée maximale', value: formatDuree(data.maxDureeMois) },
    { icon: 'chart-up' as BusinessIconName, label: 'Coût total', value: formatEuro(data.coutTotalCredit) },
  ];
  
  const kpiCount = kpiData.length;
  const kpiAvailableW = SLIDE_SIZE.width - 2 * LAYOUT.kpi.marginX;
  const kpiW = (kpiAvailableW - (kpiCount - 1) * LAYOUT.kpi.gap) / kpiCount;
  const kpiY = LAYOUT.kpi.y;
  
  kpiData.forEach((kpi, idx) => {
    const kpiX = LAYOUT.kpi.marginX + idx * (kpiW + LAYOUT.kpi.gap);
    
    addBusinessIconToSlide(slide, kpi.icon, {
      x: kpiX + kpiW / 2 - LAYOUT.kpi.iconSize / 2,
      y: kpiY,
      w: LAYOUT.kpi.iconSize,
      h: LAYOUT.kpi.iconSize,
    }, theme, 'accent');
    
    slide.addText(kpi.label, {
      x: kpiX, y: kpiY + LAYOUT.kpi.iconSize + 0.06, w: kpiW, h: 0.20,
      fontSize: 10, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'center',
      lang: 'fr-FR',
    });
    
    slide.addText(kpi.value, {
      x: kpiX, y: kpiY + LAYOUT.kpi.iconSize + 0.24, w: kpiW, h: 0.26,
      fontSize: 14, bold: true, color: roleColor(theme, 'textMain'), fontFace: TYPO.fontFace, align: 'center',
      lang: 'fr-FR',
    });
  });
  
  // ========== TIMELINE WITH PALIERS ==========
  const periods = data.paymentPeriods;
  const timelineY = LAYOUT.timeline.y;
  const timelineW = SLIDE_SIZE.width - 2 * LAYOUT.timeline.marginX;
  
  if (periods.length > 0) {
    const segmentCount = Math.min(periods.length, 2); // Max 2 segments like reference
    const segmentW = timelineW / segmentCount;
    const barY = timelineY + 0.22;
    
    // Compute capital per period from loans
    const capitalPeriod1 = data.totalCapital;
    const capitalPeriod2 = data.loans.length > 1 
      ? data.loans.reduce((sum, loan) => loan.dureeMois > (data.loans[0]?.dureeMois || 0) ? sum + loan.capital : sum, 0)
      : data.totalCapital;
    
    // Date labels ABOVE the bars
    const startYear = new Date().getFullYear();
    const period1End = Math.floor((data.loans[0]?.dureeMois || data.maxDureeMois) / 12);
    const dateLabels = [
      `01/${startYear}`,
      `01/${startYear + period1End}`,
      `01/${startYear + Math.floor(data.maxDureeMois / 12)}`,
    ];
    
    // Draw date labels above
    slide.addText(dateLabels[0], {
      x: LAYOUT.timeline.marginX, y: timelineY, w: 0.6, h: 0.20,
      fontSize: 8, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'left',
      lang: 'fr-FR',
    });
    
    if (segmentCount >= 2) {
      slide.addText(dateLabels[1], {
        x: LAYOUT.timeline.marginX + segmentW - 0.3, y: timelineY, w: 0.6, h: 0.20,
        fontSize: 8, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'center',
        lang: 'fr-FR',
      });
    }
    
    slide.addText(dateLabels[dateLabels.length - 1], {
      x: LAYOUT.timeline.marginX + timelineW - 0.6, y: timelineY, w: 0.6, h: 0.20,
      fontSize: 8, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'right',
      lang: 'fr-FR',
    });
    
    // Draw colored segments
    periods.slice(0, 2).forEach((period, idx) => {
      const segX = LAYOUT.timeline.marginX + idx * segmentW;
      const segColor = idx === 0 ? roleColor(theme, 'bgMain') : lightenColor(roleColor(theme, 'bgMain'), 0.4);
      
      slide.addShape('rect', {
        x: segX, y: barY, w: segmentW, h: LAYOUT.timeline.barHeight,
        fill: { color: segColor },
      });
      
      slide.addText(formatEuro(period.total) + '/mois', {
        x: segX, y: barY + 0.08, w: segmentW, h: 0.24,
        fontSize: 11, bold: true, color: 'FFFFFF', fontFace: TYPO.fontFace, align: 'center',
        lang: 'fr-FR',
      });
    });
    
    // Draw gray ticks below with capital labels
    const tickY = barY + LAYOUT.timeline.barHeight + 0.08;
    const tickGap = 0.02;
    
    periods.slice(0, 2).forEach((period, pIdx) => {
      const periodYears = pIdx === 0 
        ? Math.floor((data.loans[0]?.dureeMois || data.maxDureeMois) / 12) 
        : Math.floor(data.maxDureeMois / 12) - Math.floor((data.loans[0]?.dureeMois || 0) / 12);
      const capitalLabel = pIdx === 0 ? formatEuroShort(capitalPeriod1) : formatEuroShort(capitalPeriod2);
      const tickCount = Math.min(periodYears, 10);
      const tickW = (segmentW - (tickCount - 1) * tickGap) / tickCount;
      
      for (let t = 0; t < tickCount; t++) {
        const tickX = LAYOUT.timeline.marginX + pIdx * segmentW + t * (tickW + tickGap);
        
        // Gray tick
        slide.addShape('rect', {
          x: tickX, y: tickY, w: tickW, h: LAYOUT.timeline.tickHeight,
          fill: { color: 'D0D0D0' },
        });
        
        // Capital label under each tick
        slide.addText(capitalLabel, {
          x: tickX, y: tickY + LAYOUT.timeline.tickHeight + 0.02, w: tickW, h: 0.14,
          fontSize: 6, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'center',
          lang: 'fr-FR',
        });
      }
    });
  }
  
  // ========== BOTTOM ROW: 3 ELEMENTS WITH ICONS ==========
  const bottomY = LAYOUT.bottomRow.y;
  const bottomW = SLIDE_SIZE.width - 2 * LAYOUT.bottomRow.marginX;
  const bottomItemW = bottomW / 3;
  const iconSize = 0.32;
  
  const totalRembourse = data.totalCapital + data.coutTotalCredit;
  const smoothingLabel = data.smoothingEnabled 
    ? (data.smoothingMode === 'duree' ? 'Lissage activé : durée constante' : 'Lissage activé : mensualité constante')
    : '';
  
  const bottomItems = [
    { icon: 'building' as BusinessIconName, label: 'Total remboursé :', value: formatEuro(totalRembourse) },
    { icon: 'umbrella' as BusinessIconName, label: smoothingLabel, value: '' },
    { icon: 'shield' as BusinessIconName, label: 'Coût assurance décès :', value: formatEuro(data.coutTotalAssurance) },
  ];
  
  bottomItems.forEach((item, idx) => {
    const itemX = LAYOUT.bottomRow.marginX + idx * bottomItemW;
    
    addBusinessIconToSlide(slide, item.icon, {
      x: itemX + bottomItemW / 2 - iconSize / 2,
      y: bottomY,
      w: iconSize,
      h: iconSize,
    }, theme, 'textBody');
    
    if (item.value) {
      slide.addText(`${item.label} ${item.value}`, {
        x: itemX, y: bottomY + iconSize + 0.04, w: bottomItemW, h: 0.18,
        fontSize: 9, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'center',
        lang: 'fr-FR',
      });
    } else if (item.label) {
      slide.addText(item.label, {
        x: itemX, y: bottomY + iconSize + 0.04, w: bottomItemW, h: 0.18,
        fontSize: 9, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'center',
        lang: 'fr-FR',
      });
    }
  });
  
  // ========== STANDARD FOOTER ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildCreditGlobalSynthesis;
