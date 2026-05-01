/**
 * Succession Synthesis Slide Builder (P1-02)
 *
 * Layout : en-tête + 4 KPI avec icônes + hero central.
 * Reprend le pattern visuel IR/PER — sans tableau dense.
 */

import type PptxGenJS from 'pptxgenjs';
import type { SuccessionSynthesisSlideSpec, ExportContext } from '../theme/types';
import {
  SLIDE_SIZE,
  addCardPanelWithShadow,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { getBusinessIconDataUri } from '../../icons/business/businessIconLibrary';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const GEO = {
  kpiIconY: 2.72,
  kpiLabelY: 3.24,
  kpiValueY: 3.52,
  kpiColW: 2.15,
  kpiGap: 0.38,
  heroX: 3.05,
  heroY: 4.38,
  heroW: 7.25,
  heroH: 1.28,
} as const;

function drawKpis(slide: PptxGenJS.Slide, spec: SuccessionSynthesisSlideSpec, ctx: ExportContext): void {
  const { theme } = ctx;
  const totalW = GEO.kpiColW * 4 + GEO.kpiGap * 3;
  const startX = (SLIDE_SIZE.width - totalW) / 2;

  spec.kpis.forEach((kpi, index) => {
    const x = startX + index * (GEO.kpiColW + GEO.kpiGap);
    const centerX = x + GEO.kpiColW / 2;
    const iconDataUri = getBusinessIconDataUri(kpi.icon, { color: theme.colors.color5 });
    slide.addImage({
      data: iconDataUri,
      x: centerX - 0.16,
      y: GEO.kpiIconY,
      w: 0.32,
      h: 0.32,
    });
    addTextFr(slide, kpi.label, {
      x,
      y: GEO.kpiLabelY,
      w: GEO.kpiColW,
      h: 0.22,
      fontSize: 9,
      color: roleColor(theme, 'textBody'),
      align: 'center',
      valign: 'middle',
    });
    addTextFr(slide, kpi.value, {
      x,
      y: GEO.kpiValueY,
      w: GEO.kpiColW,
      h: 0.32,
      fontSize: 15,
      color: roleColor(theme, 'textMain'),
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  });
}

function drawHero(slide: PptxGenJS.Slide, spec: SuccessionSynthesisSlideSpec, ctx: ExportContext): void {
  const { theme } = ctx;
  addCardPanelWithShadow(slide, { x: GEO.heroX, y: GEO.heroY, w: GEO.heroW, h: GEO.heroH }, theme);
  addTextFr(slide, spec.heroLabel, {
    x: GEO.heroX,
    y: GEO.heroY + 0.18,
    w: GEO.heroW,
    h: 0.24,
    fontSize: 12,
    color: roleColor(theme, 'textBody'),
    align: 'center',
    valign: 'middle',
  });
  addTextFr(slide, spec.heroValue, {
    x: GEO.heroX,
    y: GEO.heroY + 0.45,
    w: GEO.heroW,
    h: 0.44,
    fontSize: 30,
    color: roleColor(theme, 'textMain'),
    bold: true,
    align: 'center',
    valign: 'middle',
  });
  if (spec.heroCaption) {
    addTextFr(slide, spec.heroCaption, {
      x: GEO.heroX,
      y: GEO.heroY + 0.94,
      w: GEO.heroW,
      h: 0.18,
      fontSize: 9,
      color: roleColor(theme, 'textBody'),
      italic: true,
      align: 'center',
      valign: 'middle',
    });
  }
}

export function buildSuccessionSynthesis(
  pptx: PptxGenJS,
  spec: SuccessionSynthesisSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  addHeader(slide, spec.title, spec.subtitle, ctx.theme, 'content');
  drawKpis(slide, spec, ctx);
  drawHero(slide, spec, ctx);
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildSuccessionSynthesis;
