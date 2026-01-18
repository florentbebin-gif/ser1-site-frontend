/**
 * Credit Loan Synthesis Slide Builder
 * 
 * Per-loan detail slide with premium KPI layout.
 * Reuses the same visual style as the original synthesis slide,
 * but for individual loans in a multi-loan scenario.
 * 
 * Shows: Capital, Duration, Rate, Monthly Payment, Total Cost
 */

import PptxGenJS from 'pptxgenjs';
import type { CreditLoanSynthesisSlideSpec, PptxThemeRoles, ExportContext } from '../theme/types';
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
  title: { x: COORDS_CONTENT.title.x, y: COORDS_CONTENT.title.y, w: COORDS_CONTENT.title.w, h: 0.5 },
  subtitle: { x: COORDS_CONTENT.title.x, y: COORDS_CONTENT.title.y + 0.55, w: COORDS_CONTENT.title.w, h: 0.35 },
  accentLine: { x: COORDS_CONTENT.accentLine.x, y: COORDS_CONTENT.accentLine.y, w: COORDS_CONTENT.accentLine.w },
  
  kpi: {
    topY: 2.3,
    height: 1.1,
    marginX: 1.0,
    gap: 0.3,
    iconSize: 0.5,
  },
  
  visualBar: {
    topY: 3.8,
    height: 0.8,
    marginX: 1.5,
  },
  
  hero: {
    topY: 4.9,
    height: 0.9,
  },
  
  details: {
    topY: 5.9,
    height: 0.6,
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

function formatPct(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export function buildCreditLoanSynthesis(
  pptx: PptxGenJS,
  data: CreditLoanSynthesisSlideSpec,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  
  // White background
  slide.background = { color: 'FFFFFF' };
  
  // ========== HEADER ==========
  
  const loanLabel = `SYNTHÈSE PRÊT N°${data.loanIndex}`;
  const creditTypeLabel = data.creditType === 'infine' ? 'Crédit in fine' : 'Crédit amortissable';
  
  // Title
  slide.addText(loanLabel, {
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
  slide.addText(creditTypeLabel, {
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
  
  const kpiData: Array<{ icon: BusinessIconName; label: string; value: string }> = [
    { icon: 'money', label: 'Capital emprunté', value: formatEuro(data.capitalEmprunte) },
    { icon: 'calculator', label: 'Durée', value: formatDuree(data.dureeMois) },
    { icon: 'gauge', label: 'Taux nominal', value: formatPct(data.tauxNominal) },
    { icon: 'bank', label: 'Mensualité totale', value: formatEuro(data.mensualiteTotale) },
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
      y: kpiY + LAYOUT.kpi.iconSize + 0.1,
      w: kpiW,
      h: 0.22,
      fontSize: 9,
      color: theme.colors.color9.replace('#', ''),
      fontFace: 'Arial',
      align: 'center',
    });
    
    // Value
    slide.addText(kpi.value, {
      x: kpiX,
      y: kpiY + LAYOUT.kpi.iconSize + 0.35,
      w: kpiW,
      h: 0.3,
      fontSize: 15,
      bold: true,
      color: roleColor(theme, 'textMain'),
      fontFace: 'Arial',
      align: 'center',
    });
  });
  
  // ========== VISUAL BAR (Capital vs Coût) ==========
  
  const barY = LAYOUT.visualBar.topY;
  const barW = SLIDE_SIZE.width - 2 * LAYOUT.visualBar.marginX;
  const totalCost = data.coutTotalInterets + data.coutTotalAssurance;
  const totalAmount = data.capitalEmprunte + totalCost;
  const capitalRatio = totalAmount > 0 ? data.capitalEmprunte / totalAmount : 0.8;
  const costRatio = 1 - capitalRatio;
  
  // Capital segment
  slide.addShape('rect', {
    x: LAYOUT.visualBar.marginX,
    y: barY,
    w: barW * capitalRatio,
    h: 0.4,
    fill: { color: roleColor(theme, 'bgMain') },
  });
  
  // Capital label
  slide.addText(`Capital : ${formatEuro(data.capitalEmprunte)}`, {
    x: LAYOUT.visualBar.marginX,
    y: barY,
    w: barW * capitalRatio,
    h: 0.4,
    fontSize: 10,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
    align: 'center',
    valign: 'middle',
  });
  
  // Cost segment
  slide.addShape('rect', {
    x: LAYOUT.visualBar.marginX + barW * capitalRatio,
    y: barY,
    w: barW * costRatio,
    h: 0.4,
    fill: { color: roleColor(theme, 'accent') },
  });
  
  // Cost label
  if (costRatio > 0.15) {
    slide.addText(`Coût : ${formatEuro(totalCost)}`, {
      x: LAYOUT.visualBar.marginX + barW * capitalRatio,
      y: barY,
      w: barW * costRatio,
      h: 0.4,
      fontSize: 10,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Arial',
      align: 'center',
      valign: 'middle',
    });
  }
  
  // Legend
  slide.addText(`Intérêts : ${formatEuro(data.coutTotalInterets)}  |  Assurance : ${formatEuro(data.coutTotalAssurance)}`, {
    x: LAYOUT.visualBar.marginX,
    y: barY + 0.48,
    w: barW,
    h: 0.22,
    fontSize: 9,
    color: theme.colors.color9.replace('#', ''),
    fontFace: 'Arial',
    align: 'center',
  });
  
  // ========== HERO: TOTAL COST ==========
  
  const heroY = LAYOUT.hero.topY;
  
  // Decorative line
  slide.addShape('rect', {
    x: SLIDE_SIZE.width / 2 - 2,
    y: heroY - 0.05,
    w: 4,
    h: 0.02,
    fill: { color: roleColor(theme, 'accent') },
  });
  
  // HERO value
  slide.addText(`COÛT TOTAL : ${formatEuro(totalCost)}`, {
    x: 0,
    y: heroY,
    w: SLIDE_SIZE.width,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: roleColor(theme, 'textMain'),
    fontFace: 'Arial',
    align: 'center',
  });
  
  // Total remboursé
  slide.addText(`Total remboursé : ${formatEuro(totalAmount)}`, {
    x: 0,
    y: heroY + 0.5,
    w: SLIDE_SIZE.width,
    h: 0.25,
    fontSize: 11,
    italic: true,
    color: theme.colors.color9.replace('#', ''),
    fontFace: 'Arial',
    align: 'center',
  });
  
  // ========== DETAILS ROW ==========
  
  const detailsY = LAYOUT.details.topY;
  const assurModeLabel = data.assuranceMode === 'CI' ? 'Capital initial' : 'Capital restant dû';
  
  slide.addText(`Assurance : ${formatPct(data.tauxAssurance)} (${assurModeLabel})  |  Mensualité hors assurance : ${formatEuro(data.mensualiteHorsAssurance)}`, {
    x: 0,
    y: detailsY,
    w: SLIDE_SIZE.width,
    h: 0.25,
    fontSize: 9,
    color: theme.colors.color9.replace('#', ''),
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

export default buildCreditLoanSynthesis;
