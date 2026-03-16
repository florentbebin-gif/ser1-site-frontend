/**
 * Placement Detail Slide Builder (slides 4-5-6) — Premium refonte
 *
 * Nouveau layout :
 * - Panneaux plus larges (marginX 0.9" vs 1.2")
 * - metrics[0] affiché comme chiffre héros (20pt bold)
 * - Flow bar proportionnel (brut→fiscal→net) pour slides 5 et 6 si flowBar présent
 * - Métriques secondaires (metrics[1..]) sous le héros
 * - Shadow premium sur les panneaux
 * - Params italique en bas (inchangé)
 */

import type PptxGenJS from 'pptxgenjs';
import type { PlacementDetailSlideSpec, PlacementDetailFlowBar, ExportContext } from '../theme/types';
import {
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  SHADOW_PARAMS,
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

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;      // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

const PANEL = {
  gap: 0.40,
  marginX: 0.9,                                               // était 1.2
  get totalW() { return 13.3333 - 2 * this.marginX; },
  get panelW() { return (this.totalW - this.gap) / 2; },     // ~5.5667"
  topY: CONTENT_TOP_Y + 0.08,
  get height() { return CONTENT_BOTTOM_Y - this.topY - 0.08; },
  bandeauH: 0.38,
  heroH: 0.80,                 // zone chiffre héros
  flowBarH: 0.70,              // hauteur zone flow bar (si présent)
  flowBarItemH: 0.18,          // hauteur de chaque barre
  flowBarGap: 0.05,            // gap entre barres
  metricIconSize: 0.24,
  metricPaddingX: 0.20,
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

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

// ============================================================================
// FLOW BAR
// ============================================================================

function drawFlowBar(
  slide: PptxGenJS.Slide,
  flowBar: PlacementDetailFlowBar,
  panelX: number,
  panelW: number,
  startY: number,
  productColor: string,
  theme: ExportContext['theme'],
): void {
  const barMaxW = panelW - 2 * PANEL.metricPaddingX;
  const barX = panelX + PANEL.metricPaddingX;
  const grossRatio = flowBar.gross > 0 ? 1 : 0;
  const netRatio = flowBar.gross > 0 ? Math.min(1, flowBar.net / flowBar.gross) : 0;
  const taxRatio = flowBar.gross > 0 ? Math.min(1, flowBar.tax / flowBar.gross) : 0;

  const grayColor = lightenHex('888888', 0.5);
  const warningColor = lightenHex('CC4400', 0.4);

  const bars = [
    { label: 'Brut', value: flowBar.gross, ratio: grossRatio, color: grayColor },
    { label: 'Net', value: flowBar.net, ratio: netRatio, color: productColor },
    { label: flowBar.taxLabel, value: flowBar.tax, ratio: taxRatio, color: warningColor },
  ];

  bars.forEach((bar, idx) => {
    const barY = startY + idx * (PANEL.flowBarItemH + PANEL.flowBarGap);
    const barW = Math.max(0.15, barMaxW * bar.ratio);
    const labelX = barX + barW + 0.06;
    const labelW = panelW - PANEL.metricPaddingX - barW - 0.10;

    slide.addShape('rect', {
      x: barX,
      y: barY,
      w: barW,
      h: PANEL.flowBarItemH,
      fill: { color: bar.color },
      line: { color: bar.color, width: 0 },
    });

    addTextFr(slide, `${bar.label} : ${fmt(bar.value)}`, {
      x: labelX,
      y: barY,
      w: Math.max(0.5, labelW),
      h: PANEL.flowBarItemH,
      fontSize: TYPO.sizes.footer + 1,
      color: roleColor(theme, 'textBody'),
      align: 'left',
      valign: 'middle',
    });
  });
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
  const lightFill = lightenHex(cleanColor, 0.78);
  const bandeauText = contrastText(cleanColor);

  // Panel outline with shadow
  slide.addShape('roundRect', {
    x: panelX,
    y: panelY,
    w: panelW,
    h: panelH,
    rectRadius: RADIUS.panel,
    fill: { color: lightFill },
    line: { color: cleanColor, width: 1.5 },
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: SHADOW_PARAMS.blur,
      offset: SHADOW_PARAMS.offset,
      opacity: SHADOW_PARAMS.opacity,
      color: cleanColor,
    },
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

  // --- Hero metric (metrics[0]) ---
  const hasHero = data.metrics.length > 0;
  const heroTopY = panelY + PANEL.bandeauH + 0.10;

  if (hasHero) {
    const hero = data.metrics[0];

    addTextFr(slide, hero.label, {
      x: panelX + PANEL.metricPaddingX,
      y: heroTopY,
      w: panelW - 2 * PANEL.metricPaddingX,
      h: 0.22,
      fontSize: TYPO.sizes.bodyXSmall + 1,
      color: roleColor(theme, 'textBody'),
      align: 'left',
      valign: 'middle',
    });

    addTextFr(slide, hero.value, {
      x: panelX + PANEL.metricPaddingX,
      y: heroTopY + 0.22,
      w: panelW - 2 * PANEL.metricPaddingX,
      h: 0.48,
      fontSize: 20,
      bold: true,
      color: roleColor(theme, 'textMain'),
      align: 'left',
      valign: 'middle',
    });
  }

  // --- Flow bar (optional, slides 5-6) ---
  const hasFlowBar = !!data.flowBar;
  const flowBarTopY = heroTopY + PANEL.heroH + 0.05;
  if (hasFlowBar) {
    drawFlowBar(slide, data.flowBar!, panelX, panelW, flowBarTopY, cleanColor, theme);
  }

  // --- Supporting metrics (metrics[1..]) ---
  const params = data.params ?? [];
  const hasParams = params.length > 0;
  const paramsReservedH = hasParams ? 0.10 + params.length * 0.13 : 0;

  const secondaryMetrics = data.metrics.slice(1);
  const secondaryTopY = hasFlowBar
    ? flowBarTopY + PANEL.flowBarH + 0.08
    : heroTopY + PANEL.heroH + 0.08;
  const secondaryAvailH = panelY + panelH - secondaryTopY - paramsReservedH - 0.15;
  const rowSpacing = secondaryMetrics.length > 1
    ? secondaryAvailH / secondaryMetrics.length
    : secondaryAvailH;

  secondaryMetrics.forEach((metric, idx) => {
    const rowY = secondaryTopY + idx * rowSpacing;

    addBusinessIconDirect(slide, metric.icon, {
      x: panelX + PANEL.metricPaddingX,
      y: rowY,
      w: PANEL.metricIconSize,
      h: PANEL.metricIconSize,
      color: `#${cleanColor}`,
    });

    addTextFr(slide, metric.label, {
      x: panelX + PANEL.metricPaddingX + PANEL.metricIconSize + 0.10,
      y: rowY - 0.02,
      w: panelW - PANEL.metricPaddingX - PANEL.metricIconSize - 0.28,
      h: 0.16,
      fontSize: TYPO.sizes.bodyXSmall,
      color: roleColor(theme, 'textBody'),
      align: 'left',
      valign: 'middle',
    });

    addTextFr(slide, metric.value, {
      x: panelX + PANEL.metricPaddingX + PANEL.metricIconSize + 0.10,
      y: rowY + 0.14,
      w: panelW - PANEL.metricPaddingX - PANEL.metricIconSize - 0.28,
      h: 0.20,
      fontSize: TYPO.sizes.bodySmall,
      bold: true,
      color: roleColor(theme, 'textMain'),
      align: 'left',
      valign: 'middle',
    });
  });

  // --- Params block ---
  if (hasParams) {
    const paramsY = panelY + panelH - paramsReservedH - 0.08;
    addTextFr(slide, params.join('\n'), {
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

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const leftX = PANEL.marginX;
  const rightX = PANEL.marginX + PANEL.panelW + PANEL.gap;

  drawDetailPanel(slide, spec.produit1, leftX, PANEL.panelW, PANEL.topY, PANEL.height, color5, theme);
  drawDetailPanel(slide, spec.produit2, rightX, PANEL.panelW, PANEL.topY, PANEL.height, color3, theme);

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

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPlacementDetail;
