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
import type { PlacementDetailSlideSpec, ExportContext } from '../theme/types';
import {
  TYPO,
  SHADOW_PARAMS,
  RADIUS,
  addHeader,
  addFooter,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';
import { drawFlowBar, drawGainBar } from './placementDetailBars';
import {
  CONTENT_BOTTOM_Y,
  PLACEMENT_DETAIL_PANEL as PANEL,
  contrastText,
  lightenHex,
} from './placementDetailLayout';

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
  const bandeauText = contrastText(cleanColor);

  // Panel — fill = productColor (élimine le gap aux coins arrondis)
  slide.addShape('roundRect', {
    x: panelX,
    y: panelY,
    w: panelW,
    h: panelH,
    rectRadius: RADIUS.panel,
    fill: { color: cleanColor },
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

  // Zone blanche sous bandeau
  slide.addShape('rect', {
    x: panelX + 0.015,
    y: panelY + PANEL.bandeauH,
    w: panelW - 0.03,
    h: panelH - PANEL.bandeauH - 0.015,
    fill: { color: 'FFFFFF' },
    line: { color: 'FFFFFF', width: 0 },
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
  const heroTopY = panelY + PANEL.bandeauH + 0.1;

  if (hasHero) {
    const hero = data.metrics[0];
    if (!hero) return;

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

  // --- Flow bar (optional, slides 5-6) or Gain bar (slide 4 épargne) ---
  const flowBar = data.flowBar;
  const gainBar = !flowBar ? data.gainBar : undefined;
  const hasFlowBar = !!flowBar;
  const hasGainBar = !!gainBar;
  const flowBarTopY = heroTopY + PANEL.heroH + 0.05;
  if (flowBar) {
    drawFlowBar(slide, flowBar, panelX, panelW, flowBarTopY, cleanColor, theme);
  } else if (gainBar) {
    drawGainBar(slide, gainBar, panelX, panelW, flowBarTopY, cleanColor, theme);
  }

  // --- Supporting metrics (metrics[1..]) ---
  const params = data.params ?? [];
  const hasParams = params.length > 0;
  const paramsReservedH = hasParams ? 0.4 : 0;

  const secondaryMetrics = data.metrics.slice(1);
  const secondaryTopY =
    hasFlowBar || hasGainBar ? flowBarTopY + PANEL.flowBarH + 0.08 : heroTopY + PANEL.heroH + 0.08;
  const secondaryAvailH = panelY + panelH - secondaryTopY - paramsReservedH - 0.15;
  const rowSpacing = Math.min(0.48, secondaryAvailH / Math.max(1, secondaryMetrics.length));

  secondaryMetrics.forEach((metric, idx) => {
    const rowY = secondaryTopY + idx * rowSpacing;

    addBusinessIconToSlide(
      slide,
      metric.icon,
      {
        x: panelX + PANEL.metricPaddingX,
        y: rowY,
        w: PANEL.metricIconSize,
        h: PANEL.metricIconSize,
      },
      `#${cleanColor}`,
    );

    addTextFr(slide, metric.label, {
      x: panelX + PANEL.metricPaddingX + PANEL.metricIconSize + 0.1,
      y: rowY - 0.02,
      w: panelW - PANEL.metricPaddingX - PANEL.metricIconSize - 0.28,
      h: 0.16,
      fontSize: TYPO.sizes.bodyXSmall,
      color: roleColor(theme, 'textBody'),
      align: 'left',
      valign: 'middle',
    });

    addTextFr(slide, metric.value, {
      x: panelX + PANEL.metricPaddingX + PANEL.metricIconSize + 0.1,
      y: rowY + 0.14,
      w: panelW - PANEL.metricPaddingX - PANEL.metricIconSize - 0.28,
      h: 0.2,
      fontSize: TYPO.sizes.bodySmall,
      bold: true,
      color: roleColor(theme, 'textMain'),
      align: 'left',
      valign: 'middle',
    });
  });

  // --- Params block — discret ---
  if (hasParams) {
    const paramsY = panelY + panelH - paramsReservedH - 0.08;

    // Séparateur fin au-dessus
    slide.addShape('line', {
      x: panelX + PANEL.metricPaddingX,
      y: paramsY - 0.06,
      w: panelW - 2 * PANEL.metricPaddingX,
      h: 0,
      line: { color: roleColor(theme, 'panelBorder'), width: 0.5 },
    });

    // Fond très léger (quasi-invisible, juste une légère teinte)
    slide.addShape('rect', {
      x: panelX + 0.01,
      y: paramsY - 0.04,
      w: panelW - 0.02,
      h: paramsReservedH + 0.1,
      fill: { color: lightenHex(cleanColor, 0.93) },
      line: { color: lightenHex(cleanColor, 0.93), width: 0 },
    });

    const paramsFontSize = params.join(' · ').length > 120 ? 6.5 : 7;
    addTextFr(slide, params.join(' · '), {
      x: panelX + PANEL.metricPaddingX,
      y: paramsY,
      w: panelW - 2 * PANEL.metricPaddingX,
      h: paramsReservedH,
      fontSize: paramsFontSize,
      italic: true,
      color: theme.colors.color9.replace('#', ''),
      align: 'left',
      valign: 'top',
      lineSpacingMultiple: 1.0,
      wrap: true,
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

  if (spec.produit2) {
    const leftX = PANEL.marginX;
    const rightX = PANEL.marginX + PANEL.panelW + PANEL.gap;
    drawDetailPanel(
      slide,
      spec.produit1,
      leftX,
      PANEL.panelW,
      PANEL.topY,
      PANEL.height,
      color5,
      theme,
    );
    drawDetailPanel(
      slide,
      spec.produit2,
      rightX,
      PANEL.panelW,
      PANEL.topY,
      PANEL.height,
      color3,
      theme,
    );
  } else {
    // Mode projection : un seul panneau centré horizontalement
    const slideWidth = 13.3333;
    const centerX = (slideWidth - PANEL.panelW) / 2;
    drawDetailPanel(
      slide,
      spec.produit1,
      centerX,
      PANEL.panelW,
      PANEL.topY,
      PANEL.height,
      color5,
      theme,
    );
  }

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
