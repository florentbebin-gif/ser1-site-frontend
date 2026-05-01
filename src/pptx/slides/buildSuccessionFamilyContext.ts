import type PptxGenJS from 'pptxgenjs';
import type {
  ExportContext,
  SuccessionFamilyContextSlideSpec,
  SuccessionFiliationNode,
} from '../theme/types';
import {
  addCardPanelWithShadow,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const NODE_W = 80;
const NODE_H = 24;

const GEO = {
  contextY: 2.40,
  contextH: 0.74,
  chartX: 1.18,
  chartY: 3.32,
  chartW: 10.96,
  chartH: 2.58,
  dispositionY: 6.12,
  dispositionH: 0.72,
} as const;

function fitChart(spec: SuccessionFamilyContextSlideSpec): {
  x: number;
  y: number;
  scale: number;
} {
  const width = Math.max(1, spec.filiation.svgWidth);
  const height = Math.max(1, spec.filiation.svgHeight);
  const scale = Math.min(GEO.chartW / width, GEO.chartH / height);
  return {
    x: GEO.chartX + (GEO.chartW - width * scale) / 2,
    y: GEO.chartY + (GEO.chartH - height * scale) / 2,
    scale,
  };
}

function nodeFill(node: SuccessionFiliationNode, ctx: ExportContext): string {
  if (node.deceased) return roleColor(ctx.theme, 'panelBorder');
  if (node.kind === 'enfant_commun') return roleColor(ctx.theme, 'accent');
  return roleColor(ctx.theme, 'panelBg');
}

function nodeLine(node: SuccessionFiliationNode, ctx: ExportContext): PptxGenJS.ShapeLineProps {
  if (node.deceased) {
    return { color: roleColor(ctx.theme, 'textBody'), width: 0.75, dashType: 'dash' };
  }
  if (node.kind === 'epoux') {
    return { color: roleColor(ctx.theme, 'textMain'), width: 0.75, transparency: 35 };
  }
  if (node.kind === 'tierce') {
    return { color: roleColor(ctx.theme, 'textBody'), width: 0.65, dashType: 'dash', transparency: 35 };
  }
  return { color: roleColor(ctx.theme, 'panelBorder'), width: 0.65 };
}

function nodeTextColor(node: SuccessionFiliationNode, ctx: ExportContext): string {
  if (node.kind === 'enfant_commun' && !node.deceased) return roleColor(ctx.theme, 'white');
  return roleColor(ctx.theme, 'textMain');
}

function drawSafeLine(
  slide: PptxGenJS.Slide,
  start: { x: number; y: number },
  end: { x: number; y: number },
  line: PptxGenJS.ShapeLineProps,
): void {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;

  slide.addShape('line', {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(dx),
    h: Math.abs(dy),
    flipH: (dx < 0) !== (dy < 0),
    line,
  });
}

function drawContextBand(
  slide: PptxGenJS.Slide,
  spec: SuccessionFamilyContextSlideSpec,
  ctx: ExportContext,
): void {
  if (!spec.situationLabel) return;

  const { theme } = ctx;
  addCardPanelWithShadow(slide, { x: 0.92, y: GEO.contextY, w: 11.5, h: GEO.contextH }, theme);

  const items = [
    { label: 'Situation familiale', value: spec.situationLabel },
    ...(spec.regimeLabel ? [{ label: 'Régime matrimonial', value: spec.regimeLabel }] : []),
    ...(spec.pacsConventionLabel ? [{ label: 'Convention PACS', value: spec.pacsConventionLabel }] : []),
  ];

  const gap = 0.24;
  const itemW = (10.96 - gap * Math.max(items.length - 1, 0)) / Math.max(items.length, 1);

  items.forEach((item, index) => {
    const x = 1.22 + index * (itemW + gap);
    addTextFr(slide, item.label, {
      x,
      y: GEO.contextY + 0.16,
      w: itemW,
      h: 0.18,
      fontSize: 9,
      color: roleColor(theme, 'textBody'),
      valign: 'middle',
    });
    addTextFr(slide, item.value, {
      x,
      y: GEO.contextY + 0.40,
      w: itemW,
      h: 0.24,
      fontSize: 11,
      color: roleColor(theme, 'textMain'),
      bold: true,
      valign: 'middle',
    });
  });
}

function drawFiliation(
  slide: PptxGenJS.Slide,
  spec: SuccessionFamilyContextSlideSpec,
  ctx: ExportContext,
): void {
  const origin = fitChart(spec);
  const scaleX = (x: number) => origin.x + x * origin.scale;
  const scaleY = (y: number) => origin.y + y * origin.scale;

  for (const group of spec.filiation.groups) {
    slide.addShape('roundRect', {
      x: scaleX(group.x),
      y: scaleY(group.y),
      w: group.w * origin.scale,
      h: group.h * origin.scale,
      fill: { color: roleColor(ctx.theme, 'panelBg'), transparency: 100 },
      line: { color: roleColor(ctx.theme, 'panelBorder'), width: 0.75, dashType: 'dash' },
      rectRadius: 0.08,
    });
  }

  for (const edge of spec.filiation.edges) {
    drawSafeLine(
      slide,
      { x: scaleX(edge.x1), y: scaleY(edge.y1) },
      { x: scaleX(edge.x2), y: scaleY(edge.y2) },
      {
        color: roleColor(ctx.theme, 'panelBorder'),
        width: 0.8,
        ...(edge.dashed ? { dashType: 'dash' as const } : {}),
      },
    );
  }

  for (const node of spec.filiation.nodes) {
    const x = scaleX(node.x);
    const y = scaleY(node.y);
    const w = NODE_W * origin.scale;
    const h = NODE_H * origin.scale;
    slide.addShape('roundRect', {
      x,
      y,
      w,
      h,
      fill: { color: nodeFill(node, ctx) },
      line: nodeLine(node, ctx),
      rectRadius: 0.07,
    });
    addTextFr(slide, node.label, {
      x: x + 0.04,
      y,
      w: Math.max(0.1, w - 0.08),
      h,
      fontSize: 9,
      color: nodeTextColor(node, ctx),
      bold: node.kind === 'epoux',
      align: 'center',
      valign: 'middle',
      fit: 'shrink',
    });
  }
}

function drawDispositions(
  slide: PptxGenJS.Slide,
  spec: SuccessionFamilyContextSlideSpec,
  ctx: ExportContext,
): void {
  const dispositions = spec.dispositions.length > 0
    ? spec.dispositions.join(' · ')
    : 'Aucune disposition particulière ni donation antérieure renseignée.';

  addCardPanelWithShadow(slide, { x: 0.92, y: GEO.dispositionY, w: 11.5, h: GEO.dispositionH }, ctx.theme);

  addTextFr(slide, 'Dispositions retenues', {
    x: 1.20,
    y: GEO.dispositionY + 0.18,
    w: 2.2,
    h: 0.22,
    fontSize: 10,
    color: roleColor(ctx.theme, 'textMain'),
    bold: true,
    valign: 'middle',
  });
  addTextFr(slide, dispositions, {
    x: 3.18,
    y: GEO.dispositionY + 0.13,
    w: 8.94,
    h: 0.42,
    fontSize: 8.6,
    color: roleColor(ctx.theme, 'textBody'),
    fit: 'shrink',
    valign: 'middle',
  });
}

export function buildSuccessionFamilyContext(
  pptx: PptxGenJS,
  spec: SuccessionFamilyContextSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  addHeader(slide, spec.title, spec.subtitle, ctx.theme, 'content');
  drawContextBand(slide, spec, ctx);
  drawFiliation(slide, spec, ctx);
  drawDispositions(slide, spec, ctx);
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildSuccessionFamilyContext;
