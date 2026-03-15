/**
 * Placement Synthesis Slide Builder (Slide 3) — Premium refonte
 *
 * Nouveau layout :
 * - 2 panneaux larges (5.55" chacun, +86% vs précédent)
 * - ROI intégré comme chiffre héros dans chaque panneau
 * - Grille 2×2 pour les 4 KPIs (aéré, moderne)
 * - Séparateur "ou" dans le gap central
 * - Dots aux jalons de la timeline
 * - Shadow premium sur les panneaux
 *
 * Colors: color5 (produit 1), color3 (produit 2).
 */

import type PptxGenJS from 'pptxgenjs';
import type { PlacementSynthesisSlideSpec, PlacementProductKpis, ExportContext } from '../theme/types';
import {
  TYPO,
  SHADOW_PARAMS,
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
// GEOMETRY
// ============================================================================

const GEO = {
  marginX: 0.85,
  panelW: 5.55,
  gap: 0.5333,   // 13.3333 - 2*0.85 - 2*5.55
  panelY: 2.42,
  panelH: 4.08,

  bandeauH: 0.44,
  roiHeroH: 0.90,
  separatorOffsetY: 0.44 + 0.90, // bandeau + roiHero

  kpiGridPaddingX: 0.18,
  kpiIconSize: 0.22,
  kpiGridGapX: 0.10,  // gap between left and right KPI columns

  // Timeline
  timeline: {
    y: 6.58,
    h: 0.28,
    dotR: 0.05,
    seg1X: 1.00,
    seg1W: 5.17,
    seg2X: 6.17,
    seg2W: 6.16,
  },
} as const;

// KPI keys in 2×2 grid order: [top-left, top-right, bottom-left, bottom-right]
const KPI_GRID: [PlacementKpiKey, PlacementKpiKey][] = [
  ['effortTotal', 'capitalAcquis'],
  ['revenusNets', 'transmissionNette'],
];

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

function contrastText(bgHex: string): string {
  const clean = bgHex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
}

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
  panelX: number,
  productColor: string, // hex without #
  theme: ExportContext['theme'],
): void {
  const cleanColor = productColor.replace('#', '');
  const lightFill = lightenHex(cleanColor, 0.78);
  const bandeauTextColor = contrastText(cleanColor);
  const shadowColor = cleanColor;

  // Panel outline with shadow
  slide.addShape('roundRect', {
    x: panelX,
    y: GEO.panelY,
    w: GEO.panelW,
    h: GEO.panelH,
    rectRadius: RADIUS.panel,
    fill: { color: lightFill },
    line: { color: cleanColor, width: 1.5 },
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: SHADOW_PARAMS.blur,
      offset: SHADOW_PARAMS.offset,
      opacity: SHADOW_PARAMS.opacity,
      color: shadowColor,
    },
  });

  // Bandeau
  slide.addShape('rect', {
    x: panelX + 0.01,
    y: GEO.panelY + 0.01,
    w: GEO.panelW - 0.02,
    h: GEO.bandeauH,
    fill: { color: cleanColor },
  });

  addTextFr(slide, produit.envelopeLabel, {
    x: panelX,
    y: GEO.panelY + 0.02,
    w: GEO.panelW,
    h: GEO.bandeauH - 0.04,
    fontSize: TYPO.sizes.body,
    bold: true,
    color: bandeauTextColor,
    align: 'center',
    valign: 'middle',
  });

  // ROI hero zone
  const roiTopY = GEO.panelY + GEO.bandeauH;
  const roiLabel = 'Retour sur investissement';
  const roiValue = `× ${produit.roi.toFixed(2).replace('.', ',')}`;

  addTextFr(slide, roiLabel, {
    x: panelX,
    y: roiTopY + 0.08,
    w: GEO.panelW,
    h: 0.22,
    fontSize: TYPO.sizes.footer + 1,
    italic: true,
    color: roleColor(theme, 'textBody'),
    align: 'center',
    valign: 'middle',
  });

  addTextFr(slide, roiValue, {
    x: panelX,
    y: roiTopY + 0.30,
    w: GEO.panelW,
    h: 0.50,
    fontSize: 26,
    bold: true,
    color: cleanColor,
    align: 'center',
    valign: 'middle',
  });

  // Thin separator below ROI hero
  const sepY = GEO.panelY + GEO.separatorOffsetY + 0.04;
  slide.addShape('line', {
    x: panelX + 0.25,
    y: sepY,
    w: GEO.panelW - 0.5,
    h: 0,
    line: { color: roleColor(theme, 'panelBorder'), width: 0.5 },
  });

  // 2×2 KPI grid
  const gridTopY = sepY + 0.12;
  const gridAvailH = (GEO.panelY + GEO.panelH) - gridTopY - 0.20;
  const rowH = gridAvailH / 2;
  const colW = (GEO.panelW - GEO.kpiGridPaddingX * 2 - GEO.kpiGridGapX) / 2;

  KPI_GRID.forEach((row, rowIdx) => {
    const cellY = gridTopY + rowIdx * rowH;

    row.forEach((key, colIdx) => {
      const cellX = panelX + GEO.kpiGridPaddingX + colIdx * (colW + GEO.kpiGridGapX);
      const value = produit[key];

      // Icon
      addBusinessIconDirect(slide, PLACEMENT_KPI_ICONS[key], {
        x: cellX,
        y: cellY + 0.04,
        w: GEO.kpiIconSize,
        h: GEO.kpiIconSize,
        color: `#${cleanColor}`,
      });

      // Label (below icon, small)
      addTextFr(slide, PLACEMENT_KPI_LABELS[key], {
        x: cellX,
        y: cellY + 0.04 + GEO.kpiIconSize + 0.02,
        w: colW,
        h: 0.16,
        fontSize: TYPO.sizes.footer,
        color: roleColor(theme, 'textBody'),
        align: 'left',
        valign: 'top',
      });

      // Value (below label)
      addTextFr(slide, fmt(value), {
        x: cellX,
        y: cellY + 0.04 + GEO.kpiIconSize + 0.18,
        w: colW,
        h: 0.22,
        fontSize: TYPO.sizes.bodySmall - 1,
        bold: true,
        color: roleColor(theme, 'textMain'),
        align: 'left',
        valign: 'middle',
      });
    });
  });
}

// ============================================================================
// VS SEPARATOR
// ============================================================================

function drawVsSeparator(
  slide: PptxGenJS.Slide,
  theme: ExportContext['theme'],
): void {
  const centerX = GEO.marginX + GEO.panelW + GEO.gap / 2;

  // Vertical line
  slide.addShape('line', {
    x: centerX,
    y: GEO.panelY + 0.30,
    w: 0,
    h: GEO.panelH - 0.60,
    line: { color: roleColor(theme, 'panelBorder'), width: 0.5 },
  });

  // "ou" label
  addTextFr(slide, 'ou', {
    x: centerX - 0.20,
    y: GEO.panelY + GEO.panelH / 2 - 0.15,
    w: 0.40,
    h: 0.30,
    fontSize: TYPO.sizes.footer + 1,
    italic: true,
    color: roleColor(theme, 'textBody'),
    align: 'center',
    valign: 'middle',
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

  // Segment 1 — Épargne
  slide.addShape('rect', {
    x: tl.seg1X,
    y: tl.y,
    w: tl.seg1W,
    h: tl.h,
    fill: { color: bgMainColor },
  });

  // Segment 2 — Liquidation / Transmission (color4)
  slide.addShape('rect', {
    x: tl.seg2X,
    y: tl.y,
    w: tl.seg2W,
    h: tl.h,
    fill: { color: color4 },
  });

  // Dots at age markers
  const dotColor = roleColor(theme, 'textMain');
  const dotPositions = [
    { x: tl.seg1X, age: timeline.ageActuel, align: 'left' as const },
    { x: tl.seg2X, age: timeline.ageDebutLiquidation, align: 'center' as const },
    { x: tl.seg2X + tl.seg2W, age: timeline.ageAuDeces, align: 'right' as const },
  ];

  dotPositions.forEach(({ x, age, align }) => {
    // Dot
    slide.addShape('ellipse', {
      x: x - tl.dotR,
      y: tl.y + tl.h / 2 - tl.dotR,
      w: tl.dotR * 2,
      h: tl.dotR * 2,
      fill: { color: dotColor },
    });

    // Age label above
    addTextFr(slide, `${age} ans`, {
      x: x - 0.60,
      y: tl.y - 0.28,
      w: 1.20,
      h: 0.22,
      fontSize: TYPO.sizes.bodyXSmall,
      bold: true,
      color: dotColor,
      align,
      valign: 'bottom',
    });
  });

  // Phase labels below timeline
  const phaseLabelY = tl.y + tl.h + 0.07;
  const phaseColor = roleColor(theme, 'textBody');
  const phaseFontSize = TYPO.sizes.footer + 1;

  addTextFr(slide, 'Phase Épargne', {
    x: tl.seg1X,
    y: phaseLabelY,
    w: tl.seg1W,
    h: 0.20,
    fontSize: phaseFontSize,
    italic: true,
    color: phaseColor,
    align: 'center',
  });

  addTextFr(slide, 'Liquidation / Transmission', {
    x: tl.seg2X,
    y: phaseLabelY,
    w: tl.seg2W,
    h: 0.20,
    fontSize: phaseFontSize,
    italic: true,
    color: phaseColor,
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

  const color5 = theme.colors.color5.replace('#', '');
  const color3 = theme.colors.color3.replace('#', '');

  addHeader(slide, 'Synthèse comparative', 'Comparaison des deux produits', theme, 'content');

  const leftX = GEO.marginX;
  const rightX = GEO.marginX + GEO.panelW + GEO.gap;

  drawPanel(slide, spec.produit1, leftX, color5, theme);
  drawVsSeparator(slide, theme);
  drawPanel(slide, spec.produit2, rightX, color3, theme);
  drawTimeline(slide, spec.timeline, theme);

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPlacementSynthesis;
