/**
 * Placement Detail Slide Builder (slides 4-5-6)
 *
 * Layout: 2 panels side-by-side with icon+label+value metrics.
 * Same color scheme as synthesis: color5 (P1), color3 (P2).
 */

import type PptxGenJS from 'pptxgenjs';
import type { PlacementDetailSlideSpec, ExportContext } from '../theme/types';
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
import { addBusinessIconDirect } from '../icons/addBusinessIcon';

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

const PANEL = {
  gap: 0.40,
  marginX: 1.2,
  get totalW() { return 13.3333 - 2 * this.marginX; },
  get panelW() { return (this.totalW - this.gap) / 2; },
  topY: CONTENT_TOP_Y + 0.10,
  get height() { return CONTENT_BOTTOM_Y - this.topY - 0.10; },
  bandeauH: 0.38,
  metricIconSize: 0.26,
  metricPaddingX: 0.22,
  metricValuePadRight: 0.18,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

function lightenHex(hex: string, pct: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * pct));
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * pct));
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * pct));
  return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
}

function contrastText(bgHex: string): string {
  const clean = bgHex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
}

// ============================================================================
// PANEL RENDERER
// ============================================================================

function drawDetailPanel(
  slide: PptxGenJS.Slide,
  data: PlacementDetailSlideSpec['produit1'],
  panelX: number,
  panelW: number,
  panelY: number,
  panelH: number,
  productColor: string,
  theme: ExportContext['theme'],
): void {
  const cleanColor = productColor.replace('#', '');
  const lightFill = lightenHex(cleanColor, 0.75);
  const bandeauText = contrastText(cleanColor);

  // Panel outline
  slide.addShape('roundRect', {
    x: panelX,
    y: panelY,
    w: panelW,
    h: panelH,
    rectRadius: RADIUS.panel,
    fill: { color: lightFill },
    line: { color: cleanColor, width: 1.5 },
  });

  // Bandeau
  slide.addShape('rect', {
    x: panelX + 0.01,
    y: panelY + 0.01,
    w: panelW - 0.02,
    h: PANEL.bandeauH,
    fill: { color: cleanColor },
  });

  addTextFr(slide, data.label, {
    x: panelX,
    y: panelY + 0.02,
    w: panelW,
    h: PANEL.bandeauH - 0.04,
    fontSize: TYPO.sizes.bodySmall + 1,
    bold: true,
    color: bandeauText,
    align: 'center',
    valign: 'middle',
  });

  // Reserve space for params at bottom of panel
  const hasParams = data.params && data.params.length > 0;
  const paramsReservedH = hasParams ? 0.12 + data.params!.length * 0.13 : 0;

  // Metrics rows
  const metricsCount = data.metrics.length;
  const metricsStartY = panelY + PANEL.bandeauH + 0.20;
  const metricsAvailH = panelH - PANEL.bandeauH - 0.40 - paramsReservedH;
  const rowSpacing = metricsCount > 1 ? metricsAvailH / metricsCount : metricsAvailH;

  data.metrics.forEach((metric, idx) => {
    const rowY = metricsStartY + idx * rowSpacing;

    // Icon
    addBusinessIconDirect(slide, metric.icon, {
      x: panelX + PANEL.metricPaddingX,
      y: rowY,
      w: PANEL.metricIconSize,
      h: PANEL.metricIconSize,
      color: `#${cleanColor}`,
    });

    // Label
    addTextFr(slide, metric.label, {
      x: panelX + PANEL.metricPaddingX + PANEL.metricIconSize + 0.12,
      y: rowY - 0.02,
      w: panelW - PANEL.metricPaddingX - PANEL.metricIconSize - 0.30,
      h: 0.16,
      fontSize: TYPO.sizes.bodyXSmall,
      color: roleColor(theme, 'textBody'),
      align: 'left',
      valign: 'middle',
    });

    // Value
    addTextFr(slide, metric.value, {
      x: panelX + PANEL.metricPaddingX + PANEL.metricIconSize + 0.12,
      y: rowY + 0.14,
      w: panelW - PANEL.metricPaddingX - PANEL.metricIconSize - 0.30,
      h: 0.18,
      fontSize: TYPO.sizes.bodySmall + 1,
      bold: true,
      color: roleColor(theme, 'textMain'),
      align: 'left',
      valign: 'middle',
    });
  });

  // Params block (italic, small font, below metrics)
  if (hasParams) {
    const paramsY = panelY + panelH - paramsReservedH - 0.08;
    addTextFr(slide, data.params!.join('\n'), {
      x: panelX + PANEL.metricPaddingX,
      y: paramsY,
      w: panelW - 2 * PANEL.metricPaddingX,
      h: paramsReservedH,
      fontSize: TYPO.sizes.footer,
      italic: true,
      color: roleColor(theme, 'textBody'),
      align: 'left',
      valign: 'top',
      lineSpacingMultiple: 1.1,
    });
  }
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export function buildPlacementDetail(
  pptx: PptxGenJS,
  spec: PlacementDetailSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  const color5 = theme.colors.color5.replace('#', '');
  const color3 = theme.colors.color3.replace('#', '');

  // Header
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  // Two panels
  const leftX = PANEL.marginX;
  const rightX = PANEL.marginX + PANEL.panelW + PANEL.gap;

  drawDetailPanel(slide, spec.produit1, leftX, PANEL.panelW, PANEL.topY, PANEL.height, color5, theme);
  drawDetailPanel(slide, spec.produit2, rightX, PANEL.panelW, PANEL.topY, PANEL.height, color3, theme);

  // Optional note below panels
  if (spec.optionalNote) {
    addTextFr(slide, spec.optionalNote, {
      x: PANEL.marginX,
      y: CONTENT_BOTTOM_Y - 0.08,
      w: 13.3333 - 2 * PANEL.marginX,
      h: 0.18,
      fontSize: TYPO.sizes.footer,
      italic: true,
      color: roleColor(theme, 'textBody'),
      align: 'center',
    });
  }

  // Footer
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPlacementDetail;
