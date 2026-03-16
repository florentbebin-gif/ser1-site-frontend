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
  panelH: 3.60,

  bandeauH: 0.44,
  roiHeroH: 0.90,
  separatorOffsetY: 0.44 + 0.90, // bandeau + roiHero

  kpiGridPaddingX: 0.18,
  kpiIconSize: 0.22,
  kpiGridGapX: 0.10,  // gap between left and right KPI columns

  // Timeline (segments calculés dynamiquement depuis les âges)
  timeline: {
    y: 6.42,
    h: 0.33,
    startX: 1.00,
    endX: 12.33,
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
  const bandeauTextColor = contrastText(cleanColor);
  const shadowColor = cleanColor;

  // Panel — fill = productColor (élimine le gap aux coins arrondis)
  slide.addShape('roundRect', {
    x: panelX,
    y: GEO.panelY,
    w: GEO.panelW,
    h: GEO.panelH,
    rectRadius: RADIUS.panel,
    fill: { color: cleanColor },
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

  // Zone blanche sous bandeau (couvre le contenu, laisse le bandeau coloré apparent)
  slide.addShape('rect', {
    x: panelX + 0.015,
    y: GEO.panelY + GEO.bandeauH,
    w: GEO.panelW - 0.03,
    h: GEO.panelH - GEO.bandeauH - 0.015,
    fill: { color: 'FFFFFF' },
    line: { color: 'FFFFFF', width: 0 },
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
  const dotColor = roleColor(theme, 'textMain');

  // Calcul dynamique des segments selon les âges simulés
  const totalW = tl.endX - tl.startX;
  const durationTotal = timeline.ageAuDeces - timeline.ageActuel;
  const durationEpargne = timeline.ageDebutLiquidation - timeline.ageActuel;
  const hasLiquidation = timeline.ageAuDeces > timeline.ageDebutLiquidation;

  const ratio = (durationTotal > 0 && hasLiquidation)
    ? Math.min(1, Math.max(0, durationEpargne / durationTotal))
    : 1;

  const seg1X = tl.startX;
  const seg1W = totalW * ratio;
  const seg2X = seg1X + seg1W;
  const seg2W = totalW - seg1W;

  // Segment 1 — Épargne (toujours présent)
  slide.addShape('rect', {
    x: seg1X, y: tl.y, w: seg1W, h: tl.h,
    fill: { color: bgMainColor },
  });
  addTextFr(slide, seg1W >= 1.5 ? 'Phase Épargne' : 'Épargne', {
    x: seg1X, y: tl.y, w: seg1W, h: tl.h,
    fontSize: TYPO.sizes.footer,
    italic: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  });

  // Segment 2 — Liquidation / Transmission (seulement si hasLiquidation)
  if (hasLiquidation) {
    slide.addShape('rect', {
      x: seg2X, y: tl.y, w: seg2W, h: tl.h,
      fill: { color: color4 },
    });
    addTextFr(slide, seg2W >= 2.0 ? 'Liquidation / Transmission' : 'Liquidation', {
      x: seg2X, y: tl.y, w: seg2W, h: tl.h,
      fontSize: TYPO.sizes.footer,
      italic: true,
      color: contrastText(color4),
      align: 'center',
      valign: 'middle',
    });
  }

  // Âges au-dessus de la barre
  const ageMarkers: Array<{ x: number; age: number; align: 'left' | 'center' | 'right' }> = [
    { x: seg1X, age: timeline.ageActuel, align: 'left' },
    { x: tl.endX, age: timeline.ageAuDeces, align: 'right' },
  ];
  if (hasLiquidation) {
    ageMarkers.push({ x: seg2X, age: timeline.ageDebutLiquidation, align: 'center' });
  }

  ageMarkers.forEach(({ x, age, align }) => {
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
