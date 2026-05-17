/**
 * buildTresorerieSynthesis.ts — Synthèse visuelle Trésorerie société.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieSynthesisSlideSpec } from '../theme/types';
import {
  COORDS_CONTENT,
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
const WHITE = 'FFFFFF';

function contrastText(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
}

function toneColor(
  theme: ExportContext['theme'],
  tone: TresorerieSynthesisSlideSpec['pocketTimeline'][number]['tone'],
): string {
  if (tone === 'main') return roleColor(theme, 'bgMain');
  if (tone === 'accent') return roleColor(theme, 'accent');
  if (tone === 'muted') return theme.colors.color2.replace('#', '');
  return theme.colors.color8.replace('#', '');
}

function yearToX(year: number, spec: TresorerieSynthesisSlideSpec, x: number, w: number): number {
  const totalYears = Math.max(1, spec.rangeEndYear - spec.rangeStartYear);
  const offset = Math.max(0, Math.min(totalYears, year - spec.rangeStartYear));
  return x + (offset / totalYears) * w;
}

function clampX(x: number, min: number, max: number): number {
  return Math.min(Math.max(x, min), max);
}

export function buildTresorerieSynthesis(
  pptx: PptxGenJS,
  spec: TresorerieSynthesisSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const textMain = roleColor(theme, 'textMain');
  const textBody = roleColor(theme, 'textBody');
  const panelBorder = roleColor(theme, 'panelBorder');
  const main = roleColor(theme, 'bgMain');
  const investmentColor = theme.colors.color2.replace('#', '');
  const ccaColor = roleColor(theme, 'accent');
  const dividendColor = main;

  const plotX = MARGIN_X + 2.58;
  const plotW = 7.35;
  const axisY = TOP_Y + 1.8;
  const topMaxH = 1.34;
  const bottomMaxH = 0.86;
  const bottomY = axisY + bottomMaxH + 0.22;
  const series =
    spec.series.length > 0
      ? spec.series
      : [
          {
            year: spec.rangeStartYear,
            investmentValue: 0,
            ccaBalance: 0,
            dividendRevenue: 0,
          },
        ];
  const maxInvestment = Math.max(1, ...series.map((item) => item.investmentValue));
  const maxIncomeRelay = Math.max(
    1,
    ...series.map((item) => Math.max(item.ccaBalance, item.dividendRevenue)),
  );
  const barGap = 0.025;
  const barW = Math.max(0.045, (plotW - barGap * (series.length - 1)) / series.length);

  addTextFr(slide, spec.chartLabels.investment, {
    x: MARGIN_X + 0.08,
    y: axisY - 0.55,
    w: 2.28,
    h: 0.42,
    fontSize: 11,
    italic: true,
    color: textMain,
    fit: 'shrink',
  });
  addTextFr(slide, spec.chartLabels.incomeRelay, {
    x: MARGIN_X + 0.08,
    y: axisY + 0.1,
    w: 2.28,
    h: 0.48,
    fontSize: 10.5,
    italic: true,
    color: textMain,
    fit: 'shrink',
  });

  slide.addShape('line', {
    x: MARGIN_X + 0.16,
    y: axisY,
    w: CONTENT_W - 1.8,
    h: 0,
    line: { color: textMain, width: 1.8, endArrowType: 'triangle' } as PptxGenJS.ShapeLineProps,
  });

  series.forEach((item, index) => {
    const x = plotX + index * (barW + barGap);
    const investmentH = Math.max(0.05, (item.investmentValue / maxInvestment) * topMaxH);
    const hasCca = item.ccaBalance > 0;
    const hasDividends = item.dividendRevenue > 0;
    const hasBoth = hasCca && hasDividends;
    const relayW = hasBoth ? barW * 0.46 : barW;
    const dividendX = hasBoth ? x + barW * 0.54 : x;

    slide.addShape('rect', {
      x,
      y: axisY - investmentH,
      w: barW,
      h: investmentH,
      fill: { color: investmentColor, transparency: 8 },
      line: { color: investmentColor, width: 0 },
    });
    if (hasCca) {
      const ccaH = Math.max(0.02, (item.ccaBalance / maxIncomeRelay) * bottomMaxH);
      slide.addShape('rect', {
        x,
        y: axisY + 0.02,
        w: relayW,
        h: ccaH,
        fill: { color: ccaColor, transparency: 10 },
        line: { color: ccaColor, width: 0 },
      });
    }
    if (hasDividends) {
      const dividendH = Math.max(0.02, (item.dividendRevenue / maxIncomeRelay) * bottomMaxH);
      slide.addShape('rect', {
        x: dividendX,
        y: axisY + 0.02,
        w: relayW,
        h: dividendH,
        fill: { color: dividendColor, transparency: 4 },
        line: { color: dividendColor, width: 0 },
      });
    }
  });

  addTextFr(slide, `${spec.rangeStartYear}`, {
    x: plotX - 0.62,
    y: axisY + 0.12,
    w: 0.54,
    h: 0.2,
    fontSize: 8.5,
    bold: true,
    color: textBody,
    align: 'right',
  });

  if (spec.triggerMarker) {
    const markerX = yearToX(spec.triggerMarker.year, spec, plotX, plotW);
    const markerTextX = clampX(markerX - 0.78, plotX, plotX + plotW - 1.56);
    const ageTextX = clampX(markerX + 0.12, plotX, plotX + plotW - 1.12);
    slide.addShape('line', {
      x: markerX,
      y: TOP_Y + 0.64,
      w: 0,
      h: bottomY - TOP_Y - 0.42,
      line: { color: main, width: 2, dashType: 'dash' },
    });
    slide.addShape('ellipse', {
      x: markerX - 0.17,
      y: TOP_Y + 0.4,
      w: 0.34,
      h: 0.34,
      fill: { color: main },
      line: { color: main, width: 0 },
    });
    addTextFr(slide, '●', {
      x: markerX - 0.17,
      y: TOP_Y + 0.41,
      w: 0.34,
      h: 0.24,
      fontSize: 10,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });
    addTextFr(slide, spec.triggerMarker.label, {
      x: markerTextX,
      y: TOP_Y + 0.1,
      w: 1.56,
      h: 0.2,
      fontSize: 8.8,
      bold: true,
      color: textMain,
      align: 'center',
      fit: 'shrink',
    });
    addTextFr(slide, spec.triggerMarker.ageLabel, {
      x: ageTextX,
      y: TOP_Y + 0.75,
      w: 1.12,
      h: 0.22,
      fontSize: 9.8,
      bold: true,
      color: textMain,
      align: 'left',
      fit: 'shrink',
    });
  }

  addBusinessIconToSlide(
    slide,
    'money',
    {
      x: MARGIN_X + CONTENT_W - 1.18,
      y: axisY - 0.58,
      w: 0.62,
      h: 0.62,
    },
    theme,
    'accent',
  );
  addTextFr(slide, `Horizon ${spec.milestones.horizon.year}`, {
    x: MARGIN_X + CONTENT_W - 1.72,
    y: axisY + 0.06,
    w: 1.7,
    h: 0.22,
    fontSize: 8.6,
    italic: true,
    bold: true,
    color: textMain,
    align: 'center',
    fit: 'shrink',
  });
  addTextFr(slide, spec.milestones.horizon.ageLabel ?? `${spec.milestones.horizon.year}`, {
    x: MARGIN_X + CONTENT_W - 1.52,
    y: axisY + 0.32,
    w: 1.28,
    h: 0.22,
    fontSize: 8.8,
    italic: true,
    color: textBody,
    align: 'center',
    fit: 'shrink',
  });

  const flowY = TOP_Y + 3.58;
  const flowH = 0.7;
  const flowGap = 0.12;
  const visiblePockets = spec.pocketTimeline.slice(0, 4);
  const laneW =
    (CONTENT_W - flowGap * (visiblePockets.length - 1)) / Math.max(1, visiblePockets.length);

  visiblePockets.forEach((pocket, index) => {
    const x = MARGIN_X + index * (laneW + flowGap);
    const fill = toneColor(theme, pocket.tone);
    const textColor = contrastText(fill);
    slide.addShape('roundRect', {
      x,
      y: flowY,
      w: laneW,
      h: flowH,
      fill: { color: fill },
      line: { color: fill, width: 0 },
      rectRadius: 0.08,
    });
    addBusinessIconToSlide(
      slide,
      pocket.iconKey,
      {
        x: x + 0.16,
        y: flowY + 0.15,
        w: 0.36,
        h: 0.36,
      },
      theme,
      textColor === WHITE ? 'white' : 'textMain',
    );
    addTextFr(slide, pocket.label, {
      x: x + 0.62,
      y: flowY + 0.08,
      w: laneW - 0.78,
      h: 0.22,
      fontSize: 8.8,
      bold: true,
      color: textColor,
      fit: 'shrink',
    });
    addTextFr(slide, `${pocket.horizonLabel} · ${pocket.startYear}-${pocket.endYear}`, {
      x: x + 0.62,
      y: flowY + 0.31,
      w: laneW - 0.78,
      h: 0.17,
      fontSize: 7.4,
      color: textColor,
      fit: 'shrink',
    });
    addTextFr(slide, pocket.amountLabel, {
      x: x + 0.62,
      y: flowY + 0.48,
      w: laneW - 0.78,
      h: 0.18,
      fontSize: 8.5,
      bold: true,
      color: textColor,
      fit: 'shrink',
    });
  });

  slide.addShape('line', {
    x: MARGIN_X,
    y: flowY - 0.18,
    w: CONTENT_W,
    h: 0,
    line: { color: panelBorder, width: 0.7 },
  });
  addTextFr(slide, 'Timeline des poches de trésorerie', {
    x: MARGIN_X,
    y: flowY - 0.46,
    w: CONTENT_W,
    h: 0.24,
    fontSize: 9.2,
    bold: true,
    color: textMain,
    fit: 'shrink',
  });
  if (spec.cashFlows.annualContributionLabel) {
    addTextFr(slide, spec.cashFlows.annualContributionLabel, {
      x: MARGIN_X + 0.06,
      y: bottomY + 0.04,
      w: 3.1,
      h: 0.2,
      fontSize: 8.6,
      italic: true,
      color: textBody,
      fit: 'shrink',
    });
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieSynthesis;
