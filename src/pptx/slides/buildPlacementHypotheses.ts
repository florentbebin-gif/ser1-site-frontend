/**
 * Placement Hypotheses Slide Builder (slide 8)
 *
 * Layout: 2×2 grid of info cards, each with icon + title + body lines.
 */

import type PptxGenJS from 'pptxgenjs';
import type { PlacementHypothesesSlideSpec, ExportContext } from '../theme/types';
import {
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  RADIUS,
  addHeader,
  addFooter,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;

const GRID = {
  marginX: 1.2,
  gapX: 0.35,
  gapY: 0.30,
  cols: 2,
  rows: 2,
  get totalW() { return 13.3333 - 2 * this.marginX; },
  get cardW() { return (this.totalW - this.gapX) / this.cols; },
  topY: CONTENT_TOP_Y + 0.10,
  get availableH() { return CONTENT_BOTTOM_Y - this.topY - 0.10; },
  get cardH() { return (this.availableH - this.gapY) / this.rows; },
  iconSize: 0.30,
  iconPadding: 0.18,
  titleH: 0.28,
  bodyPadTop: 0.06,
} as const;

// ============================================================================
// MAIN BUILDER
// ============================================================================

export function buildPlacementHypotheses(
  pptx: PptxGenJS,
  spec: PlacementHypothesesSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  // Header
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  // Render up to 4 cards in 2×2 grid
  const cards = spec.sections.slice(0, 4);

  cards.forEach((section, idx) => {
    const col = idx % GRID.cols;
    const row = Math.floor(idx / GRID.cols);

    const cardX = GRID.marginX + col * (GRID.cardW + GRID.gapX);
    const cardY = GRID.topY + row * (GRID.cardH + GRID.gapY);

    // Card background (light panel with border)
    slide.addShape('roundRect', {
      x: cardX,
      y: cardY,
      w: GRID.cardW,
      h: GRID.cardH,
      rectRadius: RADIUS.panel,
      fill: { color: 'FFFFFF' },
      line: { color: roleColor(theme, 'panelBorder'), width: 0.75 },
    });

    // Icon
    addBusinessIconToSlide(
      slide,
      section.icon,
      {
        x: cardX + GRID.iconPadding,
        y: cardY + GRID.iconPadding,
        w: GRID.iconSize,
        h: GRID.iconSize,
      },
      theme,
      'accent',
    );

    // Title (next to icon)
    addTextFr(slide, section.title, {
      x: cardX + GRID.iconPadding + GRID.iconSize + 0.12,
      y: cardY + GRID.iconPadding,
      w: GRID.cardW - GRID.iconPadding - GRID.iconSize - 0.30,
      h: GRID.titleH,
      fontSize: TYPO.sizes.bodySmall,
      bold: true,
      color: roleColor(theme, 'textMain'),
      align: 'left',
      valign: 'middle',
    });

    // Body lines
    const bodyText = section.body.join('\n');
    const bodyY = cardY + GRID.iconPadding + GRID.iconSize + GRID.bodyPadTop;
    const bodyH = GRID.cardH - GRID.iconPadding - GRID.iconSize - GRID.bodyPadTop - 0.12;

    addTextFr(slide, bodyText, {
      x: cardX + GRID.iconPadding,
      y: bodyY,
      w: GRID.cardW - 2 * GRID.iconPadding,
      h: bodyH,
      fontSize: TYPO.sizes.bodyXSmall,
      color: roleColor(theme, 'textBody'),
      align: 'left',
      valign: 'top',
      lineSpacingMultiple: 1.2,
    });
  });

  // Footer
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPlacementHypotheses;
