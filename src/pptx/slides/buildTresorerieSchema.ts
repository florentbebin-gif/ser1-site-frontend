/**
 * buildTresorerieSchema.ts — Contexte société et associé.
 *
 * La slide reste volontairement synthétique : organigramme lisible et quatre
 * repères clés. Le détail société / associé est porté par l'annexe paramètres.
 */

import type PptxGenJS from 'pptxgenjs';
import { computeTresoOrgchartLayout } from '@/features/tresorerie-societe/tresoOrgchartLayout';
import type { ExportContext, TresorerieSchemaSlideSpec } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  COORDS_CONTENT,
  COORDS_FOOTER,
  SHADOW_PARAMS,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconToSlide, type BusinessIconName } from '../icons/addBusinessIcon';

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;
const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;
const WHITE = 'FFFFFF';

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function needsLightText(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance < 145;
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

function drawMetricTile(
  slide: PptxGenJS.Slide,
  params: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    value: string;
    detail?: string;
    iconKey: BusinessIconName;
    ctx: ExportContext;
    emphasized?: boolean;
  },
): void {
  const { x, y, w, h, label, value, detail, iconKey, ctx, emphasized } = params;
  const { theme } = ctx;
  const fill = emphasized ? roleColor(theme, 'bgMain') : WHITE;
  const textColor = emphasized ? WHITE : roleColor(theme, 'textMain');
  const bodyColor = emphasized ? WHITE : roleColor(theme, 'textBody');
  const iconRole = emphasized ? 'white' : 'accent';
  const compact = h < 0.90;

  slide.addShape('roundRect', {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: emphasized ? fill : roleColor(theme, 'panelBorder'), width: 0.7 },
    rectRadius: 0.08,
  });
  addBusinessIconToSlide(slide, iconKey, {
    x: x + 0.12,
    y: y + (compact ? 0.16 : 0.18),
    w: compact ? 0.26 : 0.28,
    h: compact ? 0.26 : 0.28,
  }, theme, iconRole);
  addTextFr(slide, label, {
    x: x + 0.48,
    y: y + 0.09,
    w: w - 0.60,
    h: 0.20,
    fontSize: 8.5,
    color: bodyColor,
    fit: 'shrink',
  });
  addTextFr(slide, value, {
    x: x + 0.48,
    y: y + (compact ? 0.30 : 0.34),
    w: w - 0.60,
    h: compact ? 0.28 : 0.32,
    fontSize: compact ? 11 : 11.5,
    bold: true,
    color: textColor,
    fit: 'shrink',
  });
  if (detail) {
    addTextFr(slide, detail, {
      x: x + 0.48,
      y: y + (compact ? 0.58 : 0.68),
      w: w - 0.60,
      h: compact ? 0.18 : 0.20,
      fontSize: 7.4,
      italic: true,
      color: bodyColor,
      fit: 'shrink',
    });
  }
}

export function buildTresorerieSchema(
  pptx: PptxGenJS,
  spec: TresorerieSchemaSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const totalH = CONTENT_BOTTOM_Y - CONTENT_TOP_Y;
  const chartW = 7.30;
  const sideGap = 0.30;
  const sideX = MARGIN_X + chartW + sideGap;
  const sideW = CONTENT_W - chartW - sideGap;
  const textMain = roleColor(theme, 'textMain');
  const textBody = roleColor(theme, 'textBody');
  const panelBorder = roleColor(theme, 'panelBorder');
  const orgchartAccent = theme.colors.color5.replace('#', '');
  const orgchartAccentText = needsLightText(orgchartAccent) ? WHITE : textMain;
  const orgchartText = textMain;
  const orgchartLine = panelBorder;

  slide.addShape('roundRect', {
    x: MARGIN_X,
    y: CONTENT_TOP_Y,
    w: chartW,
    h: totalH,
    fill: { color: WHITE },
    line: { color: panelBorder, width: 0.75 },
    rectRadius: 0.10,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: SHADOW_PARAMS.blur,
      offset: SHADOW_PARAMS.offset,
      opacity: SHADOW_PARAMS.opacity,
      color: roleColor(theme, 'shadowBase'),
    },
  });
  addTextFr(slide, 'Organigramme du groupe', {
    x: MARGIN_X + 0.22,
    y: CONTENT_TOP_Y + 0.12,
    w: chartW - 0.44,
    h: 0.28,
    fontSize: 11,
    bold: true,
    color: orgchartText,
    valign: 'middle',
  });
  slide.addShape('line', {
    x: MARGIN_X + 0.22,
    y: CONTENT_TOP_Y + 0.48,
    w: chartW - 0.44,
    h: 0,
    line: { color: orgchartLine, width: 0.7, transparency: 40 },
  });

  const chartAreaTop = CONTENT_TOP_Y + 0.62;
  const chartAreaH = totalH - 0.76;
  const layout = computeTresoOrgchartLayout(spec.orgchartCompany);
  const chartPadding = 0.22;
  const chartScale = Math.min(
    (chartW - chartPadding * 2) / Math.max(1, layout.svgWidth),
    (chartAreaH - chartPadding * 2) / Math.max(1, layout.svgHeight),
  );
  const chartOriginX = MARGIN_X + (chartW - layout.svgWidth * chartScale) / 2;
  const chartOriginY = chartAreaTop + (chartAreaH - layout.svgHeight * chartScale) / 2;
  const scaleX = (x: number) => chartOriginX + x * chartScale;
  const scaleY = (y: number) => chartOriginY + y * chartScale;

  layout.edges.forEach(edge => {
    drawSafeLine(
      slide,
      { x: scaleX(edge.x1), y: scaleY(edge.y1) },
      { x: scaleX(edge.x2), y: scaleY(edge.y2) },
      { color: orgchartLine, width: 1 },
    );
  });

  layout.labels.forEach(label => {
    const x = scaleX(label.x);
    const y = scaleY(label.y);
    slide.addShape('roundRect', {
      x: x - 0.30,
      y: y - 0.13,
      w: 0.60,
      h: 0.26,
      fill: { color: orgchartAccent },
      line: { color: orgchartAccent, width: 0 },
      rectRadius: 0.05,
    });
    addTextFr(slide, label.text, {
      x: x - 0.30,
      y: y - 0.13,
      w: 0.60,
      h: 0.26,
      fontSize: 9,
      bold: true,
      align: 'center',
      valign: 'middle',
      color: orgchartAccentText,
    });
  });

  layout.nodes.forEach(node => {
    const x = scaleX(node.x);
    const y = scaleY(node.y);
    const w = node.width * chartScale;
    const h = node.height * chartScale;
    const isCompany = node.kind === 'company';
    const details = isCompany ? [spec.essentials.companyKindLabel] : [node.meta].filter(Boolean);

    slide.addShape('roundRect', {
      x,
      y,
      w,
      h,
      fill: { color: isCompany ? orgchartAccent : WHITE },
      line: { color: isCompany ? orgchartAccent : panelBorder, width: isCompany ? 0 : 0.8 },
      rectRadius: 0.08,
    });
    addTextFr(slide, truncate(node.label, 32), {
      x: x + 0.05,
      y: y + (isCompany ? h * 0.12 : h * 0.18),
      w: Math.max(0.1, w - 0.10),
      h: h * 0.40,
      fontSize: isCompany ? 12 : 10.5,
      bold: true,
      align: 'center',
      valign: 'middle',
      color: isCompany ? orgchartAccentText : textMain,
      fit: 'shrink',
    });
    details.forEach((detail, index) => {
      addTextFr(slide, truncate(detail ?? '', 30), {
        x: x + 0.05,
        y: y + h * (isCompany ? 0.58 + index * 0.18 : 0.62),
        w: Math.max(0.1, w - 0.10),
        h: h * 0.20,
        fontSize: 8.6,
        align: 'center',
        valign: 'middle',
        color: isCompany ? orgchartAccentText : textBody,
        fit: 'shrink',
      });
    });
  });

  slide.addShape('roundRect', {
    x: sideX,
    y: CONTENT_TOP_Y,
    w: sideW,
    h: totalH,
    fill: { color: WHITE },
    line: { color: panelBorder, width: 0.75 },
    rectRadius: 0.10,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: 12,
      offset: 5,
      opacity: 0.14,
      color: roleColor(theme, 'shadowBase'),
    },
  });
  slide.addShape('rect', {
    x: sideX,
    y: CONTENT_TOP_Y,
    w: sideW,
    h: 0.58,
    fill: { color: roleColor(theme, 'bgMain') },
    line: { color: roleColor(theme, 'bgMain'), width: 0 },
  });
  addTextFr(slide, 'Repères clés', {
    x: sideX + 0.22,
    y: CONTENT_TOP_Y + 0.12,
    w: sideW - 0.44,
    h: 0.34,
    fontSize: 13,
    bold: true,
    color: WHITE,
    valign: 'middle',
  });

  const protectedCash = spec.essentials.minimumBankBalance + spec.essentials.workingCapitalRequirement;
  const metrics = [
    {
      label: 'Société',
      value: spec.essentials.companyKindLabel,
      detail: spec.essentials.legalForm.toUpperCase(),
      iconKey: 'buildings' as const,
      emphasized: true,
    },
    {
      label: 'Trésorerie initiale',
      value: euro(spec.essentials.treasuryInitial),
      iconKey: 'money' as const,
    },
    {
      label: 'Banque protégée',
      value: euro(protectedCash),
      detail: 'Solde minimum + fonds de roulement',
      iconKey: 'bank' as const,
    },
    {
      label: 'Horizon',
      value: `${spec.essentials.projectionStartYear} → ${
        spec.essentials.projectionStartYear + Math.max(0, spec.essentials.horizonYears - 1)
      }`,
      detail: `${spec.essentials.horizonYears} année(s)`,
      iconKey: 'chart-up' as const,
    },
  ];
  const tileGap = 0.16;
  const tileX = sideX + 0.20;
  const tileTopY = CONTENT_TOP_Y + 0.82;
  const sideInnerW = sideW - 0.40;
  const companyTileH = 0.82;
  const smallTileW = (sideInnerW - tileGap) / 2;
  const smallTileH = 1.08;
  const horizonTileH = 0.84;
  metrics.forEach((metric, index) => {
    const tile =
      index === 0
        ? { x: tileX, y: tileTopY, w: sideInnerW, h: companyTileH }
        : index === 3
          ? {
              x: tileX,
              y: tileTopY + companyTileH + tileGap + smallTileH + tileGap,
              w: sideInnerW,
              h: horizonTileH,
            }
          : {
              x: tileX + (index - 1) * (smallTileW + tileGap),
              y: tileTopY + companyTileH + tileGap,
              w: smallTileW,
              h: smallTileH,
            };
    drawMetricTile(slide, {
      x: tile.x,
      y: tile.y,
      w: tile.w,
      h: tile.h,
      label: metric.label,
      value: metric.value,
      detail: metric.detail,
      iconKey: metric.iconKey,
      emphasized: metric.emphasized,
      ctx,
    });
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieSchema;
