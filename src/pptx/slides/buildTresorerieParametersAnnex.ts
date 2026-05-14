/**
 * buildTresorerieParametersAnnex.ts — Annexe paramètres Trésorerie société.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieParametersAnnexSlideSpec } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  COORDS_CONTENT,
  SHADOW_PARAMS,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';

const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;
const TOP_Y = COORDS_CONTENT.content.y;
const WHITE = 'FFFFFF';

function drawRow(
  slide: PptxGenJS.Slide,
  params: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    value: string;
    accent?: boolean;
    ctx: ExportContext;
  },
): void {
  const { x, y, w, h, label, value, accent, ctx } = params;
  const { theme } = ctx;
  const fill = accent ? theme.colors.color8.replace('#', '') : WHITE;

  slide.addShape('roundRect', {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: roleColor(theme, 'panelBorder'), width: 0.45 },
    rectRadius: 0.05,
  });
  addTextFr(slide, label, {
    x: x + 0.12,
    y: y + 0.05,
    w: w - 0.24,
    h: 0.16,
    fontSize: 7.7,
    color: roleColor(theme, 'textBody'),
    fit: 'shrink',
  });
  addTextFr(slide, value, {
    x: x + 0.12,
    y: y + 0.22,
    w: w - 0.24,
    h: h - 0.27,
    fontSize: accent ? 11 : 9.2,
    bold: true,
    color: roleColor(theme, 'textMain'),
    fit: 'shrink',
    valign: 'middle',
  });
}

export function buildTresorerieParametersAnnex(
  pptx: PptxGenJS,
  spec: TresorerieParametersAnnexSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const gap = 0.24;
  const cardW = (CONTENT_W - gap * 2) / 3;
  const cardY = TOP_Y + 0.08;
  const cardH = 4.52;
  const headerH = 0.64;
  const accent = roleColor(theme, 'accent');

  spec.sections.slice(0, 3).forEach((section, index) => {
    const x = MARGIN_X + index * (cardW + gap);
    const headerFill = index === 0 ? accent : theme.colors.color5.replace('#', '');

    slide.addShape('roundRect', {
      x,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: WHITE },
      line: { color: roleColor(theme, 'panelBorder'), width: 0.7 },
      rectRadius: 0.10,
      shadow: {
        type: SHADOW_PARAMS.type,
        angle: SHADOW_PARAMS.angle,
        blur: 12,
        offset: 5,
        opacity: 0.15,
        color: roleColor(theme, 'shadowBase'),
      },
    });
    slide.addShape('rect', {
      x,
      y: cardY,
      w: cardW,
      h: headerH,
      fill: { color: headerFill },
      line: { color: headerFill, width: 0 },
    });
    addBusinessIconToSlide(slide, section.iconKey, {
      x: x + 0.18,
      y: cardY + 0.16,
      w: 0.32,
      h: 0.32,
    }, theme, 'white');
    addTextFr(slide, section.title, {
      x: x + 0.62,
      y: cardY + 0.12,
      w: cardW - 0.82,
      h: 0.40,
      fontSize: 12,
      bold: true,
      color: WHITE,
      valign: 'middle',
      fit: 'shrink',
    });

    const rows = section.rows.slice(0, 6);
    const rowGap = 0.12;
    const rowAreaY = cardY + headerH + 0.20;
    const rowH = Math.min(0.56, (cardH - headerH - 0.40 - rowGap * (rows.length - 1)) / Math.max(1, rows.length));
    rows.forEach((row, rowIndex) => {
      drawRow(slide, {
        x: x + 0.18,
        y: rowAreaY + rowIndex * (rowH + rowGap),
        w: cardW - 0.36,
        h: rowH,
        label: row.label,
        value: row.value,
        accent: row.accent,
        ctx,
      });
    });
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieParametersAnnex;
