/**
 * Succession Hypotheses Slide Builder
 *
 * Grille compacte d'hypothèses actives, avec le groupe le plus dense à droite.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, SuccessionHypothesesSlideSpec } from '../theme/types';
import {
  addCardPanelWithShadow,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const GEO = {
  gridX: 0.92,
  gridY: 2.14,
  gridW: 11.50,
  gridH: 4.66,
  gap: 0.20,
  leftW: 4.34,
} as const;

type HypothesesGroup = NonNullable<SuccessionHypothesesSlideSpec['groups']>[number];
type PositionedHypothesesGroup = HypothesesGroup & {
  rect: { x: number; y: number; w: number; h: number };
  emphasis: 'compact' | 'large';
};

function getGroups(spec: SuccessionHypothesesSlideSpec): HypothesesGroup[] {
  const groups = spec.groups?.filter((group) => group.items.length > 0) ?? [];
  if (groups.length > 0) return groups;
  return [{
    title: 'Cadre de calcul',
    items: spec.items,
  }];
}

function estimateGroupDensity(group: HypothesesGroup): number {
  return group.items.reduce((sum, item) => sum + 1 + Math.ceil(item.length / 82), 0);
}

function getLargeGroupIndex(groups: HypothesesGroup[]): number {
  const fiscalIndex = groups.findIndex((group) => group.title === 'Hypothèses fiscales');
  return groups.reduce((largestIndex, group, index) => {
    const groupDensity = estimateGroupDensity(group);
    const largestDensity = estimateGroupDensity(groups[largestIndex]);
    if (groupDensity > largestDensity) return index;
    if (groupDensity === largestDensity && index === fiscalIndex) return index;
    return largestIndex;
  }, 0);
}

function buildLeftLayout(groups: HypothesesGroup[]): PositionedHypothesesGroup[] {
  if (groups.length === 0) return [];
  const availableH = GEO.gridH - GEO.gap * Math.max(0, groups.length - 1);
  const minH = groups.length >= 3 ? 0.86 : 1.08;
  const densities = groups.map((group) => Math.max(1, estimateGroupDensity(group)));
  const minTotalH = minH * groups.length;
  const flexH = Math.max(0, availableH - minTotalH);
  const densityTotal = densities.reduce((sum, density) => sum + density, 0);
  let y = GEO.gridY;

  return groups.map((group, index) => {
    const isLast = index === groups.length - 1;
    const remainingGroups = groups.length - index - 1;
    const remainingMinH = remainingGroups * minH + Math.max(0, remainingGroups) * GEO.gap;
    const proportionalH = minH + (flexH * densities[index]) / densityTotal;
    const h = isLast
      ? Math.max(minH, GEO.gridY + GEO.gridH - y)
      : Math.min(proportionalH, GEO.gridY + GEO.gridH - y - remainingMinH);
    const positioned: PositionedHypothesesGroup = {
      ...group,
      rect: {
        x: GEO.gridX,
        y,
        w: GEO.leftW,
        h,
      },
      emphasis: 'compact',
    };
    y += h + GEO.gap;
    return positioned;
  });
}

export function buildSuccessionHypothesesLayout(
  groups: HypothesesGroup[],
): PositionedHypothesesGroup[] {
  if (groups.length <= 1) {
    return groups.map((group) => ({
      ...group,
      rect: { x: GEO.gridX, y: GEO.gridY, w: GEO.gridW, h: GEO.gridH },
      emphasis: 'large',
    }));
  }

  const largeIndex = getLargeGroupIndex(groups);
  const largeGroup = groups[largeIndex];
  const leftGroups = groups
    .filter((_, index) => index !== largeIndex)
    .sort((a, b) => estimateGroupDensity(a) - estimateGroupDensity(b));
  const rightX = GEO.gridX + GEO.leftW + GEO.gap;

  return [
    ...buildLeftLayout(leftGroups),
    {
      ...largeGroup,
      rect: {
        x: rightX,
        y: GEO.gridY,
        w: GEO.gridW - GEO.leftW - GEO.gap,
        h: GEO.gridH,
      },
      emphasis: 'large',
    },
  ];
}

function bodyFontSize(group: HypothesesGroup, emphasis: PositionedHypothesesGroup['emphasis']): number {
  const density = estimateGroupDensity(group);
  if (emphasis === 'compact') {
    if (density > 8) return 6.2;
    if (density > 5) return 6.6;
    if (density > 3) return 7.0;
    return 7.5;
  }
  if (density > 18) return 6.6;
  if (density > 12) return 7.0;
  return 7.4;
}

function drawGroup(
  slide: PptxGenJS.Slide,
  group: PositionedHypothesesGroup,
  rect: { x: number; y: number; w: number; h: number },
  ctx: ExportContext,
): void {
  addCardPanelWithShadow(slide, rect, ctx.theme);
  addTextFr(slide, group.title, {
    x: rect.x + 0.22,
    y: rect.y + 0.15,
    w: rect.w - 0.44,
    h: 0.22,
    fontSize: 9.2,
    color: roleColor(ctx.theme, 'textMain'),
    bold: true,
    valign: 'middle',
  });
  addTextFr(slide, group.items.map((item) => `- ${item}`).join('\n'), {
    x: rect.x + 0.24,
    y: rect.y + 0.48,
    w: rect.w - 0.48,
    h: Math.max(0.2, rect.h - 0.62),
    fontSize: bodyFontSize(group, group.emphasis),
    color: roleColor(ctx.theme, 'textBody'),
    breakLine: false,
    fit: 'shrink',
    valign: 'top',
  });
}

export function buildSuccessionHypotheses(
  pptx: PptxGenJS,
  spec: SuccessionHypothesesSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  buildSuccessionHypothesesLayout(getGroups(spec)).forEach((group) => {
    drawGroup(slide, group, group.rect, ctx);
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildSuccessionHypotheses;
