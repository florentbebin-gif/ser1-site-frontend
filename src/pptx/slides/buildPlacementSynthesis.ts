/**
 * Placement Synthesis Slide Builder (Slide 3)
 *
 * Premium layout: 2 colored panels (no shadow), ROI pills,
 * 4 KPI rows with icons, central labels, timeline bar.
 *
 * Geometry extracted from reference support XML.
 * Colors: color5 (produit 1), color3 (produit 2).
 */

import type PptxGenJS from 'pptxgenjs';
import type { PlacementSynthesisSlideSpec, PlacementProductKpis, ExportContext } from '../theme/types';
import {
  TYPO,
  addHeader,
  addFooter,
  addTextFr,
  roleColor,
  RADIUS,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import { addBusinessIconDirect } from '../icons/addBusinessIcon';
import {
  PLACEMENT_KPI_ICONS,
  PLACEMENT_KPI_LABELS,
  type PlacementKpiKey,
} from './placementIcons';

// ============================================================================
// GEOMETRY (from reference support XML, in inches)
// ============================================================================

const GEO = {
  // ROI pills
  roiPill: { w: 1.51, h: 0.41 },
  roiPillLeft: { x: 2.60, y: 2.40 },
  roiPillRight: { x: 9.22, y: 2.39 },

  // Product panels
  panelLeft: { x: 1.87, y: 2.91, w: 2.98, h: 3.01 },
  panelRight: { x: 8.48, y: 2.91, w: 2.98, h: 3.01 },

  // Central labels zone (between panels)
  centerX: 6.6667, // slide midpoint
  centerLabelsW: 3.5,

  // Timeline
  timeline: {
    segY: 6.23,
    segH: 0.18,
    seg1X: 1.00,
    seg1W: 5.67,
    seg2X: 6.67,
    seg2W: 5.67,
  },

  // Bandeau height inside panel
  bandeauH: 0.42,

  // KPI row layout inside panel
  kpiIconSize: 0.28,
  kpiRowH: 0.52,
  kpiPaddingX: 0.20,
  kpiValueOffsetX: 0.40,
} as const;

// KPI keys in display order
const KPI_KEYS: PlacementKpiKey[] = ['effortTotal', 'capitalAcquis', 'revenusNets', 'transmissionNette'];

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtRoi = (v: number): string =>
  `ROI ${(v * 100).toFixed(0)} %`;

/**
 * Returns text color (hex without #) that contrasts well on a given background.
 */
function contrastText(bgHex: string): string {
  const clean = bgHex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
}

/**
 * Lighten a hex color by a percentage (0-1).
 */
function lightenHex(hex: string, pct: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * pct));
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * pct));
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * pct));
  return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
}

// ============================================================================
// PANEL RENDERER
// ============================================================================

function drawPanel(
  slide: PptxGenJS.Slide,
  produit: PlacementProductKpis,
  rect: { x: number; y: number; w: number; h: number },
  productColor: string,  // hex without #
  theme: ExportContext['theme'],
): void {
  const cleanColor = productColor.replace('#', '');
  const lightFill = lightenHex(cleanColor, 0.75);
  const bandeauTextColor = contrastText(cleanColor);

  // Panel outline (rounded rect, no shadow, light fill)
  slide.addShape('roundRect', {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    rectRadius: RADIUS.panel,
    fill: { color: lightFill },
    line: { color: cleanColor, width: 1.5 },
  });

  // Bandeau (colored header strip)
  slide.addShape('rect', {
    x: rect.x + 0.01,
    y: rect.y + 0.01,
    w: rect.w - 0.02,
    h: GEO.bandeauH,
    fill: { color: cleanColor },
  });

  // Envelope label in bandeau
  addTextFr(slide, produit.envelopeLabel, {
    x: rect.x,
    y: rect.y + 0.02,
    w: rect.w,
    h: GEO.bandeauH - 0.04,
    fontSize: TYPO.sizes.body,
    bold: true,
    color: bandeauTextColor,
    align: 'center',
    valign: 'middle',
  });

  // 4 KPI rows
  const kpiStartY = rect.y + GEO.bandeauH + 0.15;
  const kpiSpacing = (rect.h - GEO.bandeauH - 0.30) / KPI_KEYS.length;

  KPI_KEYS.forEach((key, idx) => {
    const rowY = kpiStartY + idx * kpiSpacing;
    const value = produit[key];
    const iconColor = cleanColor;

    // Icon
    addBusinessIconDirect(slide, PLACEMENT_KPI_ICONS[key], {
      x: rect.x + GEO.kpiPaddingX,
      y: rowY,
      w: GEO.kpiIconSize,
      h: GEO.kpiIconSize,
      color: `#${iconColor}`,
    });

    // Value
    addTextFr(slide, fmt(value), {
      x: rect.x + GEO.kpiPaddingX + GEO.kpiValueOffsetX,
      y: rowY,
      w: rect.w - GEO.kpiPaddingX - GEO.kpiValueOffsetX - 0.15,
      h: GEO.kpiIconSize,
      fontSize: TYPO.sizes.bodySmall,
      bold: true,
      color: roleColor(theme, 'textMain'),
      align: 'right',
      valign: 'middle',
    });
  });
}

// ============================================================================
// ROI PILL
// ============================================================================

function drawRoiPill(
  slide: PptxGenJS.Slide,
  roi: number,
  pos: { x: number; y: number },
  productColor: string,
): void {
  const cleanColor = productColor.replace('#', '');
  const textColor = contrastText(cleanColor);

  slide.addShape('roundRect', {
    x: pos.x,
    y: pos.y,
    w: GEO.roiPill.w,
    h: GEO.roiPill.h,
    rectRadius: GEO.roiPill.h / 2,
    fill: { color: cleanColor },
  });

  addTextFr(slide, fmtRoi(roi), {
    x: pos.x,
    y: pos.y,
    w: GEO.roiPill.w,
    h: GEO.roiPill.h,
    fontSize: TYPO.sizes.bodySmall,
    bold: true,
    color: textColor,
    align: 'center',
    valign: 'middle',
  });
}

// ============================================================================
// CENTRAL LABELS
// ============================================================================

function drawCentralLabels(
  slide: PptxGenJS.Slide,
  theme: ExportContext['theme'],
  panelTop: number,
  panelHeight: number,
): void {
  const labelX = GEO.centerX - GEO.centerLabelsW / 2;
  const labelW = GEO.centerLabelsW;
  const bandeauBottom = panelTop + GEO.bandeauH;

  const kpiStartY = bandeauBottom + 0.15;
  const kpiSpacing = (panelHeight - GEO.bandeauH - 0.30) / KPI_KEYS.length;

  KPI_KEYS.forEach((key, idx) => {
    const rowY = kpiStartY + idx * kpiSpacing;

    // Thin separator line above label (except first)
    if (idx > 0) {
      slide.addShape('line', {
        x: labelX + 0.5,
        y: rowY - kpiSpacing * 0.25,
        w: labelW - 1.0,
        h: 0,
        line: { color: roleColor(theme, 'panelBorder'), width: 0.5 },
      });
    }

    // Label text
    addTextFr(slide, PLACEMENT_KPI_LABELS[key], {
      x: labelX,
      y: rowY,
      w: labelW,
      h: GEO.kpiIconSize,
      fontSize: TYPO.sizes.bodyXSmall,
      color: roleColor(theme, 'textBody'),
      align: 'center',
      valign: 'middle',
    });
  });
}

// ============================================================================
// TIMELINE
// ============================================================================

function drawTimeline(
  slide: PptxGenJS.Slide,
  timeline: PlacementSynthesisSlideSpec['timeline'],
  theme: ExportContext['theme'],
): void {
  const tl = GEO.timeline;
  const bgMainColor = roleColor(theme, 'bgMain');
  const color4 = theme.colors.color4.replace('#', '');

  // Segment 1 — Épargne (bgMain color)
  slide.addShape('rect', {
    x: tl.seg1X,
    y: tl.segY,
    w: tl.seg1W,
    h: tl.segH,
    fill: { color: bgMainColor },
  });

  // Segment 2 — Liquidation / Transmission (color4)
  slide.addShape('rect', {
    x: tl.seg2X,
    y: tl.segY,
    w: tl.seg2W,
    h: tl.segH,
    fill: { color: color4 },
  });

  // Age labels above timeline
  const ageLabelY = tl.segY - 0.28;
  const ageLabelH = 0.22;
  const ageFontSize = TYPO.sizes.bodyXSmall;
  const ageColor = roleColor(theme, 'textMain');

  // Age actuel (left)
  addTextFr(slide, `${timeline.ageActuel} ans`, {
    x: tl.seg1X,
    y: ageLabelY,
    w: 1.2,
    h: ageLabelH,
    fontSize: ageFontSize,
    bold: true,
    color: ageColor,
    align: 'left',
    valign: 'bottom',
  });

  // Age liquidation (center)
  addTextFr(slide, `${timeline.ageDebutLiquidation} ans`, {
    x: tl.seg2X - 0.6,
    y: ageLabelY,
    w: 1.2,
    h: ageLabelH,
    fontSize: ageFontSize,
    bold: true,
    color: ageColor,
    align: 'center',
    valign: 'bottom',
  });

  // Age décès (right)
  addTextFr(slide, `${timeline.ageAuDeces} ans`, {
    x: tl.seg2X + tl.seg2W - 1.2,
    y: ageLabelY,
    w: 1.2,
    h: ageLabelH,
    fontSize: ageFontSize,
    bold: true,
    color: ageColor,
    align: 'right',
    valign: 'bottom',
  });

  // Phase labels below timeline
  const phaseLabelY = tl.segY + tl.segH + 0.06;
  const phaseTextColor = roleColor(theme, 'textBody');
  const phaseFontSize = TYPO.sizes.bodyXSmall - 1;

  addTextFr(slide, 'Phase Épargne', {
    x: tl.seg1X,
    y: phaseLabelY,
    w: tl.seg1W,
    h: 0.20,
    fontSize: phaseFontSize,
    italic: true,
    color: phaseTextColor,
    align: 'center',
  });

  addTextFr(slide, 'Liquidation / Transmission', {
    x: tl.seg2X,
    y: phaseLabelY,
    w: tl.seg2W,
    h: 0.20,
    fontSize: phaseFontSize,
    italic: true,
    color: phaseTextColor,
    align: 'center',
  });
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export function buildPlacementSynthesis(
  pptx: PptxGenJS,
  spec: PlacementSynthesisSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  // Product colors
  const color5 = theme.colors.color5.replace('#', '');
  const color3 = theme.colors.color3.replace('#', '');

  // Header
  addHeader(slide, 'Synthèse comparative', 'Comparaison des deux produits', theme, 'content');

  // ROI pills
  drawRoiPill(slide, spec.produit1.roi, GEO.roiPillLeft, color5);
  drawRoiPill(slide, spec.produit2.roi, GEO.roiPillRight, color3);

  // Product panels
  drawPanel(slide, spec.produit1, GEO.panelLeft, color5, theme);
  drawPanel(slide, spec.produit2, GEO.panelRight, color3, theme);

  // Central labels between panels
  drawCentralLabels(slide, theme, GEO.panelLeft.y, GEO.panelLeft.h);

  // Timeline
  drawTimeline(slide, spec.timeline, theme);

  // Footer
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPlacementSynthesis;
