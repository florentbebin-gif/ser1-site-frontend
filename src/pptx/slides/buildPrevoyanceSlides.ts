import type PptxGenJS from 'pptxgenjs';
import type {
  ExportContext,
  PrevoyanceContractsTableSlideSpec,
  PrevoyanceRoChartSlideSpec,
} from '../theme/types';
import {
  COORDS_CONTENT,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;
const TOP_Y = COORDS_CONTENT.content.y;

function clean(hex: string): string {
  return hex.replace('#', '');
}

function addStackedBar(
  slide: PptxGenJS.Slide,
  ctx: ExportContext,
  row: { label: string; segments: Array<{ label: string; valuePct: number }>; totalPct: number },
  y: number,
  x: number,
  w: number,
): void {
  const textMain = roleColor(ctx.theme, 'textMain');
  const textBody = roleColor(ctx.theme, 'textBody');
  const border = roleColor(ctx.theme, 'panelBorder');
  const colors = [ctx.theme.colors.color3, ctx.theme.colors.color6, ctx.theme.colors.color2];

  addTextFr(slide, row.label, {
    x,
    y,
    w: 1.35,
    h: 0.22,
    fontSize: 8.4,
    color: textBody,
    fit: 'shrink',
  });

  slide.addShape('rect', {
    x: x + 1.48,
    y: y + 0.03,
    w,
    h: 0.18,
    fill: { color: border, transparency: 64 },
    line: { color: border, width: 0.3 },
  });

  let cursor = x + 1.48;
  row.segments.forEach((segment, index) => {
    const segmentW = Math.max(0, Math.min(w, (w * segment.valuePct) / 100));
    if (segmentW <= 0) return;
    const fill = clean(colors[index % colors.length] ?? ctx.theme.colors.color3);
    slide.addShape('rect', {
      x: cursor,
      y: y + 0.03,
      w: segmentW,
      h: 0.18,
      fill: { color: fill, transparency: 6 },
      line: { color: fill, width: 0 },
    });
    cursor += segmentW;
  });

  addTextFr(slide, `${Math.round(row.totalPct)} %`, {
    x: x + 1.48 + w + 0.12,
    y,
    w: 0.5,
    h: 0.22,
    fontSize: 8.4,
    bold: true,
    color: textMain,
    fit: 'shrink',
  });
}

function addRoPanel(
  slide: PptxGenJS.Slide,
  ctx: ExportContext,
  title: string,
  rows: PrevoyanceRoChartSlideSpec['arretRows'],
  x: number,
  y: number,
  w: number,
): void {
  const textMain = roleColor(ctx.theme, 'textMain');
  const border = roleColor(ctx.theme, 'panelBorder');
  slide.addShape('roundRect', {
    x,
    y,
    w,
    h: 2.04,
    rectRadius: 0.08,
    fill: { color: clean(ctx.theme.panelBg) },
    line: { color: border, width: 0.8 },
  });
  addTextFr(slide, title, {
    x: x + 0.18,
    y: y + 0.14,
    w: w - 0.36,
    h: 0.24,
    fontSize: 10.2,
    bold: true,
    color: textMain,
    fit: 'shrink',
  });
  rows.slice(0, 5).forEach((row, index) => {
    addStackedBar(slide, ctx, row, y + 0.52 + index * 0.28, x + 0.18, w - 2.5);
  });
}

export function buildPrevoyanceRoChart(
  pptx: PptxGenJS,
  spec: PrevoyanceRoChartSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const textBody = roleColor(ctx.theme, 'textBody');
  addHeader(slide, spec.title, spec.subtitle, ctx.theme, 'content');

  addTextFr(slide, spec.regimeLabels.join(' + '), {
    x: MARGIN_X,
    y: TOP_Y - 0.1,
    w: CONTENT_W,
    h: 0.24,
    fontSize: 9.2,
    italic: true,
    color: textBody,
    fit: 'shrink',
  });

  addRoPanel(slide, ctx, 'Arrêt de travail', spec.arretRows, MARGIN_X, TOP_Y + 0.32, 5.72);
  addRoPanel(slide, ctx, 'Invalidité', spec.invaliditeRows, MARGIN_X + 6.02, TOP_Y + 0.32, 5.72);

  addTextFr(slide, `Décès RO : ${spec.decesCapitalLabel}`, {
    x: MARGIN_X,
    y: TOP_Y + 2.62,
    w: CONTENT_W,
    h: 0.28,
    fontSize: 11,
    bold: true,
    color: roleColor(ctx.theme, 'textMain'),
    fit: 'shrink',
  });
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export function buildPrevoyanceContractsTable(
  pptx: PptxGenJS,
  spec: PrevoyanceContractsTableSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const textMain = roleColor(ctx.theme, 'textMain');
  const textBody = roleColor(ctx.theme, 'textBody');
  const border = roleColor(ctx.theme, 'panelBorder');
  const headerFill = roleColor(ctx.theme, 'bgMain');
  addHeader(slide, spec.title, spec.subtitle, ctx.theme, 'content');

  addTextFr(slide, spec.modeLabel, {
    x: MARGIN_X,
    y: TOP_Y - 0.1,
    w: CONTENT_W,
    h: 0.24,
    fontSize: 9,
    italic: true,
    color: textBody,
    fit: 'shrink',
  });

  const labelW = 3.1;
  const columnCount = Math.max(1, spec.columns.length);
  const colW = (CONTENT_W - labelW) / columnCount;
  const tableY = TOP_Y + 0.34;
  const rowH = Math.min(0.42, 4.85 / Math.max(1, spec.rows.length + 1));

  slide.addShape('rect', {
    x: MARGIN_X + labelW,
    y: tableY,
    w: CONTENT_W - labelW,
    h: rowH,
    fill: { color: headerFill },
    line: { color: headerFill, width: 0 },
  });
  spec.columns.forEach((column, index) => {
    addTextFr(slide, column, {
      x: MARGIN_X + labelW + index * colW,
      y: tableY + 0.05,
      w: colW,
      h: rowH - 0.08,
      fontSize: 8.4,
      bold: true,
      color: clean(ctx.theme.white),
      align: 'center',
      fit: 'shrink',
    });
  });

  spec.rows.forEach((row, rowIndex) => {
    const y = tableY + rowH * (rowIndex + 1);
    slide.addShape('line', {
      x: MARGIN_X,
      y,
      w: CONTENT_W,
      h: 0,
      line: { color: border, width: 0.5 },
    });
    addTextFr(slide, row.label, {
      x: MARGIN_X + 0.08,
      y: y + 0.06,
      w: labelW - 0.16,
      h: rowH - 0.08,
      fontSize: 7.8,
      italic: true,
      color: textMain,
      fit: 'shrink',
    });
    row.values.slice(0, columnCount).forEach((value, index) => {
      addTextFr(slide, value || 'NC', {
        x: MARGIN_X + labelW + index * colW + 0.06,
        y: y + 0.06,
        w: colW - 0.12,
        h: rowH - 0.08,
        fontSize: 7.4,
        color: textBody,
        align: 'center',
        fit: 'shrink',
      });
    });
  });

  slide.addShape('rect', {
    x: MARGIN_X,
    y: tableY,
    w: CONTENT_W,
    h: rowH * (spec.rows.length + 1),
    fill: { color: clean(ctx.theme.panelBg), transparency: 100 },
    line: { color: border, width: 0.8 },
  });
  addFooter(slide, ctx, slideIndex, 'onLight');
}
