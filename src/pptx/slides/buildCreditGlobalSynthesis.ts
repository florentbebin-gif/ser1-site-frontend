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
    dateH: 0.20,
    tickGap: 0.08,
    labelH: 0.12,
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
  // Icons from repo: money, gauge (duration), chart-up (cost)
  const kpiData = [
    { icon: 'money' as BusinessIconName, label: 'Capital total', value: formatEuro(data.totalCapital) },
    { icon: 'gauge' as BusinessIconName, label: 'Durée maximale', value: formatDuree(data.maxDureeMois) },
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
  
  // ========== TIMELINE WITH PALIERS (up to 3 segments) ==========
  const periods = data.paymentPeriods;
  const kpiBottomY = LAYOUT.kpi.y + LAYOUT.kpi.iconSize + 0.24 + 0.26;
  const timelineBlockH = LAYOUT.timeline.dateH + 0.22 + LAYOUT.timeline.barHeight + 0.08 + LAYOUT.timeline.tickHeight + 0.02 + LAYOUT.timeline.labelH;
  const timelineY = kpiBottomY + (LAYOUT.bottomRow.y - kpiBottomY - timelineBlockH) / 2;
  const timelineW = SLIDE_SIZE.width - 2 * LAYOUT.timeline.marginX;
  const totalYears = Math.floor(data.maxDureeMois / 12);
  
  if (periods.length > 0) {
    const segmentCount = Math.min(periods.length, 3); // Support up to 3 segments
    const barY = timelineY + 0.22;
    
    // Calculate segment durations from loan end dates (sorted by duration ASC)
    // Each period corresponds to when a loan ends
    const sortedLoans = [...data.loans].sort((a, b) => a.dureeMois - b.dureeMois);
    const breakpoints = [0, ...sortedLoans.map(l => l.dureeMois)]; // [0, dur1, dur2, dur3]
    
    // Segment durations = differences between consecutive breakpoints
    const segmentDurations: number[] = [];
    for (let i = 0; i < segmentCount; i++) {
      const start = breakpoints[i] || 0;
      const end = breakpoints[i + 1] || data.maxDureeMois;
      segmentDurations.push(Math.max(0, end - start));
    }
    
    // Ensure we cover full duration
    const computedTotal = segmentDurations.reduce((a, b) => a + b, 0);
    if (computedTotal < data.maxDureeMois && segmentDurations.length > 0) {
      segmentDurations[segmentDurations.length - 1] += (data.maxDureeMois - computedTotal);
    }
    
    const totalDuration = segmentDurations.reduce((a, b) => a + b, 0) || data.maxDureeMois;
    const segmentWidths = segmentDurations.map(d => (d / totalDuration) * timelineW);
    
    // 3-color palette from theme (dark -> medium -> light)
    const segmentColors = [
      roleColor(theme, 'bgMain'),
      lightenColor(roleColor(theme, 'bgMain'), 0.25),
      lightenColor(roleColor(theme, 'bgMain'), 0.50),
    ];
    
    // Text colors: white for dark segments, textMain for light
    const textColors = ['FFFFFF', 'FFFFFF', roleColor(theme, 'textMain')];
    
    // Date labels ABOVE the bars (compact format on single line)
    const startYear = new Date().getFullYear();
    let cumulativeYears = 0;
    const datePositions: { label: string; x: number; align: 'left' | 'center' | 'right' }[] = [];
    
    // Start date
    datePositions.push({ label: `01/${startYear}`, x: LAYOUT.timeline.marginX, align: 'left' });
    
    // Intermediate dates
    let xOffset = 0;
    for (let i = 0; i < segmentCount - 1; i++) {
      xOffset += segmentWidths[i];
      cumulativeYears += Math.floor(segmentDurations[i] / 12);
      datePositions.push({ 
        label: `01/${startYear + cumulativeYears}`, 
        x: LAYOUT.timeline.marginX + xOffset - 0.35, 
        align: 'center' 
      });
    }
    
    // End date
    datePositions.push({ 
      label: `01/${startYear + totalYears}`, 
      x: LAYOUT.timeline.marginX + timelineW - 0.7, 
      align: 'right' 
    });
    
    // Draw date labels (wider zones to prevent wrapping)
    datePositions.forEach(dp => {
      slide.addText(dp.label, {
        x: dp.x, y: timelineY, w: 0.7, h: 0.20,
        fontSize: 8, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: dp.align,
        lang: 'fr-FR',
      });
    });
    
    // Draw colored segments
    let segX = LAYOUT.timeline.marginX;
    periods.slice(0, 3).forEach((period, idx) => {
      const segW = segmentWidths[idx];
      const segColor = segmentColors[idx];
      const txtColor = textColors[idx];
      
      slide.addShape('rect', {
        x: segX, y: barY, w: segW, h: LAYOUT.timeline.barHeight,
        fill: { color: segColor },
      });
      
      slide.addText(formatEuro(period.total) + '/mois', {
        x: segX, y: barY + 0.08, w: segW, h: 0.24,
        fontSize: 11, bold: true, color: txtColor, fontFace: TYPO.fontFace, align: 'center',
        lang: 'fr-FR',
      });
      
      segX += segW;
    });
    
    // ========== INSURANCE HISTOGRAM BARS (1 bar per year over total duration) ==========
    const tickY = barY + LAYOUT.timeline.barHeight + 0.08;
    const tickGap = 0.015;
    const tickCount = totalYears;
    const tickW = (timelineW - (tickCount - 1) * tickGap) / tickCount;
    
    // Calculate annual insurance (assume constant if no per-year data)
    const annualInsurance = (data.coutTotalAssurance / totalYears) || 0;
    const maxInsurance = annualInsurance; // For proportional height (all same if constant)
    
    for (let t = 0; t < tickCount; t++) {
      const tickX = LAYOUT.timeline.marginX + t * (tickW + tickGap);
      
      // Gray tick bar
      slide.addShape('rect', {
        x: tickX, y: tickY, w: tickW, h: LAYOUT.timeline.tickHeight,
        fill: { color: 'D0D0D0' },
      });
      
      // Capital label under each tick (K€ format)
      // Calculate remaining capital at this year
      const yearFraction = t / totalYears;
      const remainingCapital = data.totalCapital * (1 - yearFraction * 0.8); // Approximate linear decrease
      slide.addText(formatEuroShort(remainingCapital), {
        x: tickX, y: tickY + LAYOUT.timeline.tickHeight + 0.02, w: tickW, h: 0.12,
        fontSize: 5, color: roleColor(theme, 'textBody'), fontFace: TYPO.fontFace, align: 'center',
        lang: 'fr-FR',
      });
    }
  }
  
  // ========== BOTTOM ROW: 3 ELEMENTS WITH ICONS ==========
  const bottomY = LAYOUT.bottomRow.y;
  const bottomW = SLIDE_SIZE.width - 2 * LAYOUT.bottomRow.marginX;
  const iconSize = 0.32;
  
  const totalRembourse = data.totalCapital + data.coutTotalCredit;
  const smoothingLabel = data.smoothingEnabled 
    ? (data.smoothingMode === 'duree' ? 'Lissage activé : durée constante' : 'Lissage activé : mensualité constante')
    : '';
  const capitalDecesInitial = data.capitalDecesInitial ?? 0;
  
  // Icons from repo: buildings, checklist (smoothing), balance (insurance)
  const bottomItems = [
    { icon: 'buildings' as BusinessIconName, label: 'Total remboursé :', value: formatEuro(totalRembourse) },
    ...(data.smoothingEnabled ? [{ icon: 'checklist' as BusinessIconName, label: smoothingLabel, value: '' }] : []),
    { icon: 'balance' as BusinessIconName, label: 'Capital décès initial :', value: formatEuro(capitalDecesInitial) },
  ];
  
  const bottomItemW = bottomW / Math.max(bottomItems.length, 1);
  
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
