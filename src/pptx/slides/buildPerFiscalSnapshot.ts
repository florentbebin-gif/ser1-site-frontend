/**
 * PER Fiscal Snapshot Slide (Slide 3)
 *
 * Reprend l'organisation de la slide 3 IR (`buildIrSynthesis`) :
 * - 4 KPI columns en haut (revenus, revenu imposable, parts, TMI)
 * - Barre des tranches TMI à largeurs proportionnelles + curseur triangulaire
 * - Callout "Montant des revenus dans cette TMI"
 * - Hero "Estimation du montant de votre impôt sur le revenu" + montant XL
 * - Mention "Marge avant changement de TMI"
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, PerFiscalSnapshotSlideSpec } from '../theme/types';
import {
  SLIDE_SIZE,
  TYPO,
  addFooter,
  addHeader,
  addTextFr,
} from '../designSystem/serenity';
import { getBusinessIconDataUri, type BusinessIconName } from '../../icons/business/businessIconLibrary';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  LAYOUT,
  TMI_BRACKETS,
  TMI_WIDTHS,
  TOTAL_WEIGHT,
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

export function buildPerFiscalSnapshot(
  pptx: PptxGenJS,
  spec: PerFiscalSnapshotSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  const slideWidth = SLIDE_SIZE.width;
  const barWidth = slideWidth - LAYOUT.bar.marginX * 2;

  const tmiPercent = Math.round((spec.tmiRate || 0) * 100);
  const safeTaxablePerPart = Number.isFinite(spec.taxablePerPart) ? spec.taxablePerPart : 0;
  const safeParts = spec.partsNb > 0 ? spec.partsNb : 1;
  const totalRevenu = spec.revenuImposableD1 + spec.revenuImposableD2;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  // ========== 4 KPI COLUMNS ==========
  const kpiData: Array<{
    icon: BusinessIconName;
    label: string;
    value: string;
    subValue?: string;
  }> = [
    {
      icon: 'money',
      label: 'Revenus imposables',
      value: spec.isCouple ? '' : euro(totalRevenu),
      subValue: spec.isCouple
        ? `D1 : ${euro(spec.revenuImposableD1)}  |  D2 : ${euro(spec.revenuImposableD2)}`
        : undefined,
    },
    {
      icon: 'cheque',
      label: 'Revenu fiscal de référence',
      value: euro(spec.revenuImposableFoyer),
    },
    {
      icon: 'balance',
      label: 'Parts fiscales',
      value: fmt2(spec.partsNb),
    },
    {
      icon: 'gauge',
      label: 'TMI',
      value: tmiPercent === 0 ? 'Non imposable' : pct(tmiPercent),
    },
  ];

  const totalKpiWidth = LAYOUT.kpi.colWidth * 4 + LAYOUT.kpi.colSpacing * 3;
  const kpiStartX = (slideWidth - totalKpiWidth) / 2;

  kpiData.forEach((kpi, idx) => {
    const colX = kpiStartX + idx * (LAYOUT.kpi.colWidth + LAYOUT.kpi.colSpacing);
    const centerX = colX + LAYOUT.kpi.colWidth / 2;

    const iconDataUri = getBusinessIconDataUri(kpi.icon, { color: theme.colors.color5 });
    slide.addImage({
      data: iconDataUri,
      x: centerX - LAYOUT.kpi.iconSize / 2,
      y: LAYOUT.kpi.iconY,
      w: LAYOUT.kpi.iconSize,
      h: LAYOUT.kpi.iconSize,
    });

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

  // ========== TMI BRACKET BAR ==========
  let currentX = LAYOUT.bar.marginX;
  let activeSegmentCenterX = 0;
  let activeSegmentWidth = 0;

  TMI_BRACKETS.forEach((bracket) => {
    const isActive = bracket.rate === tmiPercent;
    const bgColor = getBracketColor(bracket.rate, theme);

    const weight = TMI_WIDTHS[bracket.rate as keyof typeof TMI_WIDTHS] || 1;
    const segmentWidth = (barWidth * weight) / TOTAL_WEIGHT;
    const gap = 0.02;

    if (isActive) {
      activeSegmentCenterX = currentX + (segmentWidth - gap) / 2;
      activeSegmentWidth = segmentWidth - gap;
    }

    slide.addShape('rect', {
      x: currentX,
      y: LAYOUT.bar.y,
      w: segmentWidth - gap,
      h: LAYOUT.bar.height,
      fill: { color: bgColor },
      line: { color: bgColor, width: 0 },
    });

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

  // ========== TRIANGLE CURSOR ==========
  if (tmiPercent > 0 && activeSegmentCenterX > 0) {
    const triangleWidth = 0.22;
    const triangleHeight = 0.14;
    const cursorY = LAYOUT.cursor.y + 0.02;

    const positionRatio = getCursorPositionInBracket(
      safeTaxablePerPart,
      tmiPercent,
      undefined,
      spec.montantDansLaTMI,
    );
    const xOffset = getCursorXOffset(positionRatio, activeSegmentWidth, tmiPercent);
    const cursorCenterX = activeSegmentCenterX + xOffset;

    slide.addShape('triangle', {
      x: cursorCenterX - triangleWidth / 2,
      y: cursorY,
      w: triangleWidth,
      h: triangleHeight,
      fill: { color: theme.colors.color5.replace('#', '') },
      line: { color: theme.colors.color5.replace('#', ''), width: 0 },
    });
  }

  // ========== CALLOUT "Montant des revenus dans cette TMI" ==========
  const amountInTmi = getAmountInCurrentBracket(safeTaxablePerPart, tmiPercent, safeParts);

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

  // ========== HERO — IR ESTIMÉ ==========
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

  addTextFr(slide, spec.irEstime === 0 ? 'Non imposable' : euro(spec.irEstime), {
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

  slide.addShape('line', {
    x: slideWidth / 2 - 1.5,
    y: LAYOUT.hero.lineY,
    w: 3,
    h: 0,
    line: { color: theme.accent.replace('#', ''), width: 1.5 },
  });

  // ========== MARGIN INFO ==========
  const nextTmiInfo = calculateMarginToNextTmi(safeTaxablePerPart, tmiPercent);
  const marginValue = spec.montantDansLaTMI > 0
    ? spec.montantDansLaTMI
    : (nextTmiInfo ? nextTmiInfo.margin * safeParts : null);
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

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPerFiscalSnapshot;
