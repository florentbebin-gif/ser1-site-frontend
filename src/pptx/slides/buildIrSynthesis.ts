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

import type PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles, ExportContext } from '../theme/types';
import {
  SLIDE_SIZE,
  TYPO,
  addHeader,
  addFooter,
  addTextFr,
} from '../designSystem/serenity';
import { getBusinessIconDataUri, type BusinessIconName } from '../../icons/business/businessIconLibrary';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  LAYOUT,
  TOTAL_WEIGHT,
  TMI_BRACKETS,
  TMI_WIDTHS,
  calculateMarginToNextTmi,
  euro,
  fmt2,
  getAmountInCurrentBracket,
  getBracketColor,
  getCursorPositionInBracket,
  getCursorXOffset,
  getTextColorForBackground,
  pct,
} from './buildIrSynthesis.helpers';

import type { IrSynthesisData } from './buildIrSynthesis.helpers';
export type { IrSynthesisData } from './buildIrSynthesis.helpers';

// ============================================================================
// MAIN BUILDER
// ============================================================================
export function buildIrSynthesis(
  pptx: PptxGenJS,
  data: IrSynthesisData,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const safeTaxablePerPart = Number.isFinite(data.taxablePerPart) ? data.taxablePerPart : 0;
  
  const slideWidth = SLIDE_SIZE.width;
  const barWidth = slideWidth - LAYOUT.bar.marginX * 2;
  
  // ========== STANDARD HEADER (from design system) ==========
  
  // Title (H1, ALL CAPS, LEFT-ALIGNED) - using helper
  // Add header (title + accent line + subtitle) with text-based positioning
  addHeader(slide, 'Synthèse de votre simulation', 'Principaux indicateurs fiscaux', theme, 'content');
  
  // ========== SECTION 1: 4 KPI COLUMNS (Y 2.38 → 3.55) ==========
  // Compact, aligned, premium design
  const totalRevenue = data.income1 + data.income2;
  
  const kpiData: Array<{
    icon: BusinessIconName;
    label: string;
    value: string;
    subValue?: string; // For couples: "D1: X € | D2: Y €"
  }> = [
    {
      icon: 'money',
      label: "Vos revenus d'activités",
      value: data.isCouple ? '' : euro(totalRevenue),
      subValue: data.isCouple 
        ? `D1: ${euro(data.income1)} | D2: ${euro(data.income2)}`
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
    
    // Icon (color5, centered) - premium look
    const iconDataUri = getBusinessIconDataUri(kpi.icon, { color: theme.colors.color5 });
    slide.addImage({
      data: iconDataUri,
      x: centerX - LAYOUT.kpi.iconSize / 2,
      y: LAYOUT.kpi.iconY,
      w: LAYOUT.kpi.iconSize,
      h: LAYOUT.kpi.iconSize,
    });
    
    // Label (sentence case, gray)
    addTextFr(slide, kpi.label, {
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
    
    // Main value OR sub-value for couples
    if (kpi.value) {
      addTextFr(slide, kpi.value, {
        x: colX,
        y: LAYOUT.kpi.valueY,
        w: LAYOUT.kpi.colWidth,
        h: 0.32,
        fontSize: 15,
        fontFace: TYPO.fontFace,
        color: theme.textMain.replace('#', ''),
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    } else if (kpi.subValue) {
      // Compact inline for couples: "D1: X € | D2: Y €"
      addTextFr(slide, kpi.subValue, {
        x: colX,
        y: LAYOUT.kpi.valueY,
        w: LAYOUT.kpi.colWidth,
        h: 0.32,
        fontSize: 10,
        fontFace: TYPO.fontFace,
        color: theme.textMain.replace('#', ''),
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    }
  });
  
  // ========== TMI BRACKET BAR (PROPORTIONAL WIDTHS, COLOR3→COLOR2 GRADIENT) ==========
  let currentX = LAYOUT.bar.marginX;
  let activeSegmentCenterX = 0;
  let activeSegmentWidth = 0;
  
  TMI_BRACKETS.forEach((bracket) => {
    const isActive = bracket.rate === data.tmiRate;
    const bgColor = getBracketColor(bracket.rate, theme);
    
    // Calculate proportional width based on income range
    const weight = TMI_WIDTHS[bracket.rate as keyof typeof TMI_WIDTHS] || 1;
    const segmentWidth = (barWidth * weight) / TOTAL_WEIGHT;
    const gap = 0.02; // Tiny gap between segments
    
    // Track active segment for cursor positioning
    if (isActive) {
      activeSegmentCenterX = currentX + (segmentWidth - gap) / 2;
      activeSegmentWidth = segmentWidth - gap;
    }
    
    // Segment rectangle - NO BORDER (clean look)
    slide.addShape('rect', {
      x: currentX,
      y: LAYOUT.bar.y,
      w: segmentWidth - gap,
      h: LAYOUT.bar.height,
      fill: { color: bgColor },
      line: { color: bgColor, width: 0 },
    });
    
    // Rate label centered in segment
    // Text color adapts to background luminance
    const textColor = getTextColorForBackground(bgColor, theme);
    addTextFr(slide, bracket.label, {
      x: currentX,
      y: LAYOUT.bar.y,
      w: segmentWidth - gap,
      h: LAYOUT.bar.height,
      fontSize: 11,
      fontFace: TYPO.fontFace,
      color: textColor,
      bold: isActive,
      align: 'center',
      valign: 'middle',
    });
    
    currentX += segmentWidth;
  });
  
  // ========== PREMIUM TRIANGLE CURSOR (intelligent positioning) ==========
  if (data.tmiRate > 0 && activeSegmentCenterX > 0) {
    const triangleWidth = 0.22;
    const triangleHeight = 0.14;
    const cursorY = LAYOUT.cursor.y + 0.02;
    
    // Calculate intelligent cursor position based on tmiBaseGlobal/tmiMarginGlobal (same source as displayed values)
    const positionRatio = getCursorPositionInBracket(
      safeTaxablePerPart,
      data.tmiRate,
      data.tmiBaseGlobal,
      data.tmiMarginGlobal
    );
    const xOffset = getCursorXOffset(positionRatio, activeSegmentWidth, data.tmiRate);
    const cursorCenterX = activeSegmentCenterX + xOffset;
    
    // Draw isoceles triangle pointing DOWN using 'triangle' shape
    // PptxGenJS 'triangle' default points down - no rotation needed
    slide.addShape('triangle', {
      x: cursorCenterX - triangleWidth / 2,
      y: cursorY,
      w: triangleWidth,
      h: triangleHeight,
      fill: { color: theme.colors.color5.replace('#', '') },
      line: { color: theme.colors.color5.replace('#', ''), width: 0 },
    });
  }
  
  // ========== SECTION 3: CALLOUT - SECONDARY INFO ==========
  // "Montant des revenus dans cette TMI : X €" - uses tmiBaseGlobal from IR card, or fallback to calculated value
  const amountInTmi = (data.tmiBaseGlobal !== undefined && data.tmiBaseGlobal !== null)
    ? data.tmiBaseGlobal
    : getAmountInCurrentBracket(safeTaxablePerPart, data.tmiRate, data.partsNb);

  addTextFr(slide, `Montant des revenus dans cette TMI : ${euro(amountInTmi)}`, {
    x: LAYOUT.marginX,
    y: LAYOUT.callout.y,
    w: LAYOUT.contentWidth,
    h: LAYOUT.callout.height,
    fontSize: 10,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    italic: true,
    align: 'center',
    valign: 'middle',
  });
  
  // ========== SECTION 4: HERO - TAX RESULT ==========
  // THE main information - IMPOSSIBLE TO MISS
  
  // Label centered
  addTextFr(slide, 'Estimation du montant de votre impôt sur le revenu', {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.labelHeight,
    fontSize: 13,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    align: 'center',
    valign: 'middle',
  });
  
  // Tax amount - VERY LARGE (30pt), BOLD, CENTERED = HERO
  addTextFr(slide, data.irNet === 0 ? 'Non imposable' : euro(data.irNet), {
    x: LAYOUT.marginX,
    y: LAYOUT.hero.y + LAYOUT.hero.labelHeight,
    w: LAYOUT.contentWidth,
    h: LAYOUT.hero.valueHeight,
    fontSize: 30,
    fontFace: TYPO.fontFace,
    color: theme.textMain.replace('#', ''),
    bold: true,
    align: 'center',
    valign: 'middle',
  });
  
  // Decorative accent line below (premium touch)
  slide.addShape('line', {
    x: slideWidth / 2 - 1.5,
    y: LAYOUT.hero.lineY,
    w: 3,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1.5 },
  });
  
  // ========== SECTION 5: MARGIN INFO - TERTIARY ==========
  // "Marge avant changement de TMI : X €" - uses tmiMarginGlobal from IR card, or fallback to calculated value
  const nextTmiInfo = calculateMarginToNextTmi(safeTaxablePerPart, data.tmiRate);
  const marginValue = (data.tmiMarginGlobal !== undefined && data.tmiMarginGlobal !== null)
    ? data.tmiMarginGlobal
    : (nextTmiInfo ? nextTmiInfo.margin * data.partsNb : null);
  const marginText = marginValue !== null ? euro(marginValue) : '—';

  addTextFr(slide, `Marge avant changement de TMI : ${marginText}`, {
    x: LAYOUT.marginX,
    y: LAYOUT.marginInfo.y,
    w: LAYOUT.contentWidth,
    h: LAYOUT.marginInfo.height,
    fontSize: 10,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    italic: true,
    align: 'center',
    valign: 'middle',
  });
  
  // ========== STANDARD FOOTER (from design system) ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildIrSynthesis;
