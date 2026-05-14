/**
 * buildTresorerieFlowMechanism.ts — Mécanisme des flux Trésorerie société.
 *
 * Lecture linéaire volontaire : apports → banque protégée → revenus → poches.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieFlowMechanismSlideSpec } from '../theme/types';
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
const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const WHITE = 'FFFFFF';

function colorForTone(
  theme: ExportContext['theme'],
  tone: TresorerieFlowMechanismSlideSpec['steps'][number]['tone'],
): string {
  if (tone === 'main') return roleColor(theme, 'bgMain');
  if (tone === 'accent') return roleColor(theme, 'accent');
  if (tone === 'muted') return theme.colors.color5.replace('#', '');
  return theme.colors.color8.replace('#', '');
}

function drawArrow(
  slide: PptxGenJS.Slide,
  params: {
    x: number;
    y: number;
    w: number;
    color: string;
    index: number;
  },
): void {
  const { x, y, w, color, index } = params;
  slide.addShape('line', {
    x,
    y,
    w,
    h: 0,
    line: {
      color,
      width: 2,
      endArrowType: 'triangle',
    } as PptxGenJS.ShapeLineProps,
  });
  slide.addShape('ellipse', {
    x: x + w / 2 - 0.13,
    y: y - 0.13,
    w: 0.26,
    h: 0.26,
    fill: { color },
    line: { color, width: 0 },
  });
  addTextFr(slide, `${index}`, {
    x: x + w / 2 - 0.13,
    y: y - 0.13,
    w: 0.26,
    h: 0.26,
    fontSize: 8.2,
    bold: true,
    color: WHITE,
    align: 'center',
    valign: 'middle',
  });
}

export function buildTresorerieFlowMechanism(
  pptx: PptxGenJS,
  spec: TresorerieFlowMechanismSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const steps = spec.steps.slice(0, 4);
  const gap = 0.30;
  const cardW = (CONTENT_W - gap * 3) / 4;
  const cardY = CONTENT_TOP_Y + 0.92;
  const cardH = 2.44;
  const arrowY = cardY + cardH / 2;
  const textMain = roleColor(theme, 'textMain');
  const textBody = roleColor(theme, 'textBody');
  const panelBorder = roleColor(theme, 'panelBorder');

  slide.addShape('roundRect', {
    x: MARGIN_X + CONTENT_W - 4.72,
    y: CONTENT_TOP_Y + 0.08,
    w: 4.72,
    h: 0.36,
    fill: { color: theme.colors.color7.replace('#', '') },
    line: { color: panelBorder, width: 0.5 },
    rectRadius: 0.06,
  });
  addTextFr(
    slide,
    'Lecture : banque sécurisée → revenus associés → excédent investi',
    {
      x: MARGIN_X + CONTENT_W - 4.54,
      y: CONTENT_TOP_Y + 0.16,
      w: 4.36,
      h: 0.16,
      fontSize: 8.3,
      color: textMain,
      align: 'center',
      valign: 'middle',
      fit: 'shrink',
    },
  );

  steps.forEach((step, index) => {
    const x = MARGIN_X + index * (cardW + gap);
    const toneColor = colorForTone(theme, step.tone);

    slide.addShape('roundRect', {
      x,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: WHITE },
      line: { color: panelBorder, width: 0.7 },
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
      h: 0.16,
      fill: { color: toneColor },
      line: { color: toneColor, width: 0 },
    });
    slide.addShape('ellipse', {
      x: x + 0.20,
      y: cardY + 0.34,
      w: 0.62,
      h: 0.62,
      fill: { color: toneColor },
      line: { color: toneColor, width: 0 },
    });
    addBusinessIconToSlide(slide, step.iconKey, {
      x: x + 0.34,
      y: cardY + 0.48,
      w: 0.34,
      h: 0.34,
    }, theme, 'white');
    addTextFr(slide, `0${index + 1}`, {
      x: x + cardW - 0.64,
      y: cardY + 0.35,
      w: 0.42,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: toneColor,
      align: 'right',
    });
    addTextFr(slide, step.title, {
      x: x + 0.22,
      y: cardY + 1.12,
      w: cardW - 0.44,
      h: 0.34,
      fontSize: 12.4,
      bold: true,
      color: textMain,
      fit: 'shrink',
    });
    addTextFr(slide, step.label, {
      x: x + 0.22,
      y: cardY + 1.50,
      w: cardW - 0.44,
      h: 0.50,
      fontSize: 9,
      color: textBody,
      breakLine: false,
      fit: 'shrink',
    });
    if (step.value) {
      addTextFr(slide, step.value, {
        x: x + 0.22,
        y: cardY + 2.10,
        w: cardW - 0.44,
        h: 0.28,
        fontSize: 14,
        bold: true,
        color: toneColor,
        fit: 'shrink',
      });
    }

    if (index < steps.length - 1) {
      drawArrow(slide, {
        x: x + cardW + 0.07,
        y: arrowY,
        w: gap - 0.14,
        color: toneColor,
        index: index + 1,
      });
    }
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieFlowMechanism;
