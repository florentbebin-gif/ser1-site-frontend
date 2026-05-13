/**
 * buildTresorerieSynthesis.ts — Synthèse avant annexe comptable.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieSynthesisSlideSpec } from '../theme/types';
import {
  COORDS_CONTENT,
  SHADOW_PARAMS,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';

const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;
const TOP_Y = COORDS_CONTENT.content.y;
const WHITE = 'FFFFFF';

function drawKpi(
  slide: PptxGenJS.Slide,
  spec: TresorerieSynthesisSlideSpec['kpis'][number],
  index: number,
  ctx: ExportContext,
): void {
  const { theme } = ctx;
  const gap = 0.28;
  const cardW = (CONTENT_W - gap * 3) / 4;
  const x = MARGIN_X + index * (cardW + gap);
  const y = TOP_Y + 0.02;
  const accent = roleColor(theme, 'accent');

  slide.addShape('roundRect', {
    x,
    y,
    w: cardW,
    h: 1.32,
    fill: { color: WHITE },
    line: { color: theme.colors.color8.replace('#', ''), width: 0.7 },
    rectRadius: 0.10,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: 10,
      offset: 4,
      opacity: 0.14,
      color: roleColor(theme, 'shadowBase'),
    },
  });
  slide.addShape('rect', {
    x,
    y,
    w: cardW,
    h: 0.14,
    fill: { color: index === 0 ? accent : theme.colors.color5.replace('#', '') },
    line: { color: index === 0 ? accent : theme.colors.color5.replace('#', ''), width: 0 },
  });
  addBusinessIconToSlide(slide, spec.iconKey, {
    x: x + 0.16,
    y: y + 0.37,
    w: 0.36,
    h: 0.36,
  }, theme, 'accent');
  addTextFr(slide, spec.label, {
    x: x + 0.62,
    y: y + 0.26,
    w: cardW - 0.78,
    h: 0.28,
    fontSize: 8.8,
    color: roleColor(theme, 'textBody'),
    fit: 'shrink',
  });
  addTextFr(slide, spec.value, {
    x: x + 0.62,
    y: y + 0.58,
    w: cardW - 0.78,
    h: 0.38,
    fontSize: 16,
    bold: true,
    color: roleColor(theme, 'textMain'),
    fit: 'shrink',
  });
}

export function buildTresorerieSynthesis(
  pptx: PptxGenJS,
  spec: TresorerieSynthesisSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  const accent = roleColor(theme, 'accent');

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');
  spec.kpis.slice(0, 4).forEach((kpi, index) => drawKpi(slide, kpi, index, ctx));

  const heroX = MARGIN_X + 1.35;
  const heroY = TOP_Y + 1.85;
  const heroW = CONTENT_W - 2.70;
  const heroH = 2.10;
  slide.addShape('roundRect', {
    x: heroX,
    y: heroY,
    w: heroW,
    h: heroH,
    fill: { color: accent },
    line: { color: accent, width: 0 },
    rectRadius: 0.14,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: SHADOW_PARAMS.blur,
      offset: SHADOW_PARAMS.offset,
      opacity: SHADOW_PARAMS.opacity,
      color: roleColor(theme, 'shadowBase'),
    },
  });
  addTextFr(slide, spec.hero.label, {
    x: heroX + 0.35,
    y: heroY + 0.34,
    w: heroW - 0.70,
    h: 0.28,
    fontSize: 13,
    color: WHITE,
    align: 'center',
    valign: 'middle',
  });
  addTextFr(slide, spec.hero.value, {
    x: heroX + 0.35,
    y: heroY + 0.72,
    w: heroW - 0.70,
    h: 0.62,
    fontSize: 31,
    bold: true,
    color: WHITE,
    align: 'center',
    valign: 'middle',
  });
  if (spec.hero.caption) {
    addTextFr(slide, spec.hero.caption, {
      x: heroX + 0.45,
      y: heroY + 1.45,
      w: heroW - 0.90,
      h: 0.28,
      fontSize: 10.5,
      italic: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieSynthesis;
