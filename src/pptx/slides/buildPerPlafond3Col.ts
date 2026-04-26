import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, PerPlafond3ColSlideSpec, PerPlafondColumn } from '../theme/types';
import {
  RADIUS,
  TYPO,
  addCardPanelWithShadow,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconDirect } from '../icons/addBusinessIcon';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const GEO = {
  marginX: 0.92,
  introY: 2.42,
  panelX: 0.92,
  panelY: 3.00,
  panelW: 11.5,
  panelH: 3.5,
  noteY: 6.60,
} as const;

function euro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function clean(color: string): string {
  return color.replace('#', '');
}

function variantColor(spec: PerPlafond3ColSlideSpec, theme: ExportContext['theme']): string {
  return clean(spec.variant === 'madelin' ? theme.colors.color3 : theme.colors.color5);
}

function drawColumn(
  slide: PptxGenJS.Slide,
  column: PerPlafondColumn,
  index: number,
  spec: PerPlafond3ColSlideSpec,
  ctx: ExportContext,
): void {
  const { theme } = ctx;
  const accent = variantColor(spec, theme);
  const colW = GEO.panelW / 3;
  const x = GEO.panelX + index * colW;
  const innerX = x + 0.32;
  const centerX = x + colW / 2;

  if (index > 0) {
    slide.addShape('line', {
      x,
      y: GEO.panelY + 0.34,
      w: 0,
      h: GEO.panelH - 0.68,
      line: { color: roleColor(theme, 'panelBorder'), width: 0.75 },
    });
  }

  slide.addShape('roundRect', {
    x: centerX - 0.28,
    y: GEO.panelY + 0.35,
    w: 0.56,
    h: 0.56,
    rectRadius: RADIUS.panel,
    fill: { color: accent, transparency: 86 },
    line: { color: accent, transparency: 100 },
  });
  addBusinessIconDirect(slide, column.iconName, {
    x: centerX - 0.15,
    y: GEO.panelY + 0.48,
    w: 0.30,
    h: 0.30,
    color: `#${accent}`,
  });

  addTextFr(slide, column.heading, {
    x: x + 0.22,
    y: GEO.panelY + 1.02,
    w: colW - 0.44,
    h: 0.44,
    fontSize: 11,
    color: roleColor(theme, 'textMain'),
    bold: true,
    align: 'center',
    valign: 'middle',
  });

  const d1Y = GEO.panelY + 1.76;
  addTextFr(slide, 'Déclarant 1', {
    x: innerX,
    y: d1Y,
    w: colW - 0.64,
    h: 0.18,
    fontSize: 8,
    color: roleColor(theme, 'textBody'),
    bold: true,
  });
  addTextFr(slide, euro(column.values.declarant1), {
    x: innerX,
    y: d1Y + 0.20,
    w: colW - 0.64,
    h: 0.34,
    fontSize: 17,
    color: accent,
    bold: true,
  });

  if (spec.isCouple) {
    slide.addShape('line', {
      x: innerX,
      y: d1Y + 0.74,
      w: colW - 0.64,
      h: 0,
      line: { color: roleColor(theme, 'panelBorder'), width: 0.5 },
    });
    addTextFr(slide, 'Déclarant 2', {
      x: innerX,
      y: d1Y + 0.92,
      w: colW - 0.64,
      h: 0.18,
      fontSize: 8,
      color: roleColor(theme, 'textBody'),
      bold: true,
    });
    addTextFr(slide, euro(column.values.declarant2 ?? 0), {
      x: innerX,
      y: d1Y + 1.12,
      w: colW - 0.64,
      h: 0.34,
      fontSize: 17,
      color: accent,
      bold: true,
    });
  }

  if (column.caption) {
    addTextFr(slide, column.caption, {
      x: x + 0.30,
      y: GEO.panelY + GEO.panelH - 0.42,
      w: colW - 0.60,
      h: 0.22,
      fontSize: 8,
      color: roleColor(theme, 'textBody'),
      italic: true,
      align: 'center',
      valign: 'middle',
    });
  }
}

export function buildPerPlafond3Col(
  pptx: PptxGenJS,
  spec: PerPlafond3ColSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content', 22, TYPO.sizes.h2);
  addTextFr(slide, spec.intro, {
    x: GEO.marginX,
    y: GEO.introY,
    w: 11.5,
    h: 0.48,
    fontSize: 11,
    color: roleColor(theme, 'textBody'),
    valign: 'middle',
  });

  addCardPanelWithShadow(slide, { x: GEO.panelX, y: GEO.panelY, w: GEO.panelW, h: GEO.panelH }, theme);
  spec.columns.forEach((column, index) => drawColumn(slide, column, index, spec, ctx));

  if (spec.note) {
    addTextFr(slide, spec.note, {
      x: GEO.marginX,
      y: GEO.noteY,
      w: 11.5,
      h: 0.28,
      fontSize: 9,
      color: roleColor(theme, 'textBody'),
      italic: true,
      align: 'center',
      valign: 'middle',
    });
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPerPlafond3Col;
