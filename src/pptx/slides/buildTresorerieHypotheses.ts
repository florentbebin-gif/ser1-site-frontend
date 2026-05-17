/**
 * buildTresorerieHypotheses.ts — Hypothèses Trésorerie société regroupées.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieHypothesesSlideSpec } from '../theme/types';
import {
  COORDS_CONTENT,
  COORDS_FOOTER,
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
const BOTTOM_Y = COORDS_FOOTER.date.y - 0.18;
const WHITE = 'FFFFFF';

function drawSection(
  slide: PptxGenJS.Slide,
  section: TresorerieHypothesesSlideSpec['sections'][number],
  index: number,
  ctx: ExportContext,
): void {
  const { theme } = ctx;
  const gapX = 0.28;
  const gapY = 0.3;
  const cardW = (CONTENT_W - gapX) / 2;
  const cardH = (BOTTOM_Y - TOP_Y - gapY) / 2;
  const x = MARGIN_X + (index % 2) * (cardW + gapX);
  const y = TOP_Y + Math.floor(index / 2) * (cardH + gapY);
  const headerColor =
    index === 0
      ? roleColor(theme, 'accent')
      : index === 1
        ? theme.colors.color5.replace('#', '')
        : index === 2
          ? theme.colors.color8.replace('#', '')
          : theme.colors.color2.replace('#', '');
  const headerTextColor = index === 2 ? roleColor(theme, 'textMain') : WHITE;

  slide.addShape('roundRect', {
    x,
    y,
    w: cardW,
    h: cardH,
    fill: { color: headerColor },
    line: { color: headerColor, width: 0 },
    rectRadius: 0.1,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: 10,
      offset: 4,
      opacity: 0.15,
      color: roleColor(theme, 'shadowBase'),
    },
  });
  slide.addShape('rect', {
    x: x + 0.02,
    y: y + 0.52,
    w: cardW - 0.04,
    h: cardH - 0.54,
    fill: { color: WHITE },
    line: { color: WHITE, width: 0 },
  });
  addBusinessIconToSlide(
    slide,
    section.iconKey,
    {
      x: x + 0.18,
      y: y + 0.14,
      w: 0.26,
      h: 0.26,
    },
    theme,
    index === 2 ? 'accent' : 'white',
  );
  addTextFr(slide, section.title, {
    x: x + 0.54,
    y: y + 0.1,
    w: cardW - 0.72,
    h: 0.34,
    fontSize: 11.5,
    bold: true,
    color: headerTextColor,
    valign: 'middle',
  });
  addTextFr(slide, section.items.map((item) => `• ${item}`).join('\n'), {
    x: x + 0.22,
    y: y + 0.72,
    w: cardW - 0.44,
    h: cardH - 0.88,
    fontSize: 8.9,
    color: roleColor(theme, 'textBody'),
    breakLine: false,
    fit: 'shrink',
    valign: 'top',
  });
}

export function buildTresorerieHypotheses(
  pptx: PptxGenJS,
  spec: TresorerieHypothesesSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  addHeader(slide, spec.title, spec.subtitle, ctx.theme, 'content');
  spec.sections.slice(0, 4).forEach((section, index) => drawSection(slide, section, index, ctx));
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieHypotheses;
