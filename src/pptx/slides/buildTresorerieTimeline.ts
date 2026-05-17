/**
 * buildTresorerieTimeline.ts — Slide timeline revenus Trésorerie société.
 *
 * Style aligné Placement Synthesis :
 * - frise horizontale en bandeau coloré full-width,
 * - segments paliers en couleurs alternées avec coins arrondis,
 * - segment final pointillé pour la trésorerie capitalisée,
 * - marqueur retraite (ligne verticale + pastille),
 * - sources empilées sous chaque palier (icône + montant 14pt).
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieTimelineSlideSpec } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  COORDS_CONTENT,
  COORDS_FOOTER,
  SHADOW_PARAMS,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconToSlide } from '../icons/addBusinessIcon';

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;
const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;
const WHITE = 'FFFFFF';

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function contrastText(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
}

function yearToX(year: number, startYear: number, totalYears: number): number {
  const offset = Math.max(0, Math.min(totalYears, year - startYear));
  return MARGIN_X + CONTENT_W * (offset / Math.max(1, totalYears));
}

export function buildTresorerieTimeline(
  pptx: PptxGenJS,
  spec: TresorerieTimelineSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const totalYears = Math.max(1, spec.rangeEndYear - spec.rangeStartYear + 1);

  // ── Coordonnées principales ────────────────────────────────────────────
  const bandY = CONTENT_TOP_Y + 0.08;
  const bandH = 0.7;
  const lineY = bandY + bandH + 0.3;
  const sourceTopY = lineY + 0.56;
  const sourceCardH = 1.08;
  const footerCardY = CONTENT_BOTTOM_Y - 0.66;

  // ── Couleurs (palette enrichie) ────────────────────────────────────────
  const accent = roleColor(theme, 'accent');
  const color3 = theme.colors.color3.replace('#', '');
  const color5 = theme.colors.color5.replace('#', '');
  const color7 = theme.colors.color7.replace('#', '');
  const color8 = theme.colors.color8.replace('#', '');
  const textMain = roleColor(theme, 'textMain');
  const textBody = roleColor(theme, 'textBody');
  const panelBorder = roleColor(theme, 'panelBorder');

  // Palette alternante des segments (3 niveaux)
  const segmentPalette = [accent, color5, color8];
  const visibleSegments = spec.segments.slice(0, 3);
  const laneW = CONTENT_W / Math.max(1, visibleSegments.length);

  // ── Axe horizontal ─────────────────────────────────────────────────────
  slide.addShape('line', {
    x: MARGIN_X,
    y: lineY,
    w: CONTENT_W,
    h: 0,
    line: { color: textMain, width: 1.6 },
  });

  addTextFr(slide, `${spec.rangeStartYear}`, {
    x: MARGIN_X - 0.1,
    y: lineY + 0.1,
    w: 0.9,
    h: 0.24,
    fontSize: 10,
    bold: true,
    color: textBody,
  });
  addTextFr(slide, `${spec.rangeEndYear}`, {
    x: MARGIN_X + CONTENT_W - 0.8,
    y: lineY + 0.1,
    w: 0.9,
    h: 0.24,
    fontSize: 10,
    bold: true,
    color: textBody,
    align: 'right',
  });

  // ── Marqueur retraite (vertical + pastille) ────────────────────────────
  if (
    spec.retirementYear &&
    spec.retirementYear > spec.rangeStartYear &&
    spec.retirementYear < spec.rangeEndYear
  ) {
    const retraiteX = yearToX(spec.retirementYear, spec.rangeStartYear, totalYears);
    slide.addShape('line', {
      x: retraiteX,
      y: bandY + bandH + 0.04,
      w: 0,
      h: lineY - bandY - bandH + 0.16,
      line: { color: color3, width: 1.5, dashType: 'dash' },
    });
    slide.addShape('ellipse', {
      x: retraiteX - 0.1,
      y: lineY - 0.1,
      w: 0.2,
      h: 0.2,
      fill: { color: color3 },
      line: { color: color3, width: 0 },
    });
    addTextFr(slide, `Retraite ${spec.retirementYear}`, {
      x: retraiteX - 0.85,
      y: bandY + bandH - 0.04,
      w: 1.7,
      h: 0.22,
      fontSize: 9.5,
      bold: true,
      italic: true,
      color: color3,
      align: 'center',
      valign: 'middle',
    });
  }

  // ── Segments paliers ───────────────────────────────────────────────────
  visibleSegments.forEach((segment, index) => {
    const x = yearToX(segment.startYear, spec.rangeStartYear, totalYears);
    const xEnd = yearToX(segment.endYear + 1, spec.rangeStartYear, totalYears);
    const rawW = Math.min(xEnd - x, MARGIN_X + CONTENT_W - x);
    const isNarrow = rawW < 1.15;
    const bandW = Math.max(0.12, rawW);
    const bandFill = segmentPalette[index % segmentPalette.length];
    const bandTextColor = contrastText(bandFill);
    const readableAmountColor = bandTextColor === '000000' ? textMain : bandFill;

    // Bandeau du palier
    slide.addShape('roundRect', {
      x,
      y: bandY,
      w: bandW,
      h: bandH,
      fill: { color: bandFill },
      line: { color: bandFill, width: 0 },
      rectRadius: 0.12,
      shadow: {
        type: SHADOW_PARAMS.type,
        angle: SHADOW_PARAMS.angle,
        blur: SHADOW_PARAMS.blur,
        offset: SHADOW_PARAMS.offset,
        opacity: SHADOW_PARAMS.opacity * 0.6,
        color: roleColor(theme, 'shadowBase'),
      },
    });
    if (isNarrow) {
      addTextFr(slide, `${index + 1}`, {
        x,
        y: bandY + 0.2,
        w: bandW,
        h: 0.26,
        fontSize: 10,
        bold: true,
        color: bandTextColor,
        align: 'center',
        valign: 'middle',
      });
    } else {
      addTextFr(slide, segment.label, {
        x: x + 0.12,
        y: bandY + 0.08,
        w: Math.max(0.2, bandW - 0.24),
        h: 0.3,
        fontSize: 12.2,
        bold: true,
        color: bandTextColor,
        align: 'center',
        valign: 'middle',
        fit: 'shrink',
      });
      addTextFr(slide, `${segment.startYear} → ${segment.endYear}`, {
        x: x + 0.12,
        y: bandY + 0.36,
        w: Math.max(0.2, bandW - 0.24),
        h: 0.26,
        fontSize: 9.4,
        color: bandTextColor,
        align: 'center',
        valign: 'middle',
        fit: 'shrink',
      });
    }

    // Tick sur l'axe
    slide.addShape('line', {
      x,
      y: lineY - 0.12,
      w: 0,
      h: 0.24,
      line: { color: textMain, width: 1.4 },
    });

    // Carte de lecture de phase sous l'axe : un seul bloc par segment.
    const cardX = MARGIN_X + index * laneW + 0.04;
    const cardY = sourceTopY;
    const cardW = Math.max(1.4, laneW - 0.08);
    if (cardY + sourceCardH <= footerCardY - 0.1) {
      slide.addShape('roundRect', {
        x: cardX,
        y: cardY,
        w: cardW,
        h: sourceCardH,
        fill: { color: WHITE },
        line: { color: panelBorder, width: 0.6 },
        rectRadius: 0.08,
      });
      slide.addShape('rect', {
        x: cardX,
        y: cardY,
        w: 0.1,
        h: sourceCardH,
        fill: { color: bandFill },
        line: { color: bandFill, width: 0 },
      });
      addTextFr(slide, `${isNarrow ? `${index + 1}. ` : ''}${segment.label}`, {
        x: cardX + 0.22,
        y: cardY + 0.08,
        w: cardW - 0.44,
        h: 0.18,
        fontSize: 8.8,
        bold: true,
        color: textMain,
        valign: 'middle',
        fit: 'shrink',
      });
      addTextFr(slide, `${segment.startYear} → ${segment.endYear}`, {
        x: cardX + 0.22,
        y: cardY + 0.27,
        w: cardW - 0.44,
        h: 0.16,
        fontSize: 7.8,
        color: textBody,
        valign: 'middle',
        fit: 'shrink',
      });

      segment.sources.slice(0, 2).forEach((source, sourceIndex) => {
        const rowY = cardY + 0.5 + sourceIndex * 0.29;
        addBusinessIconToSlide(
          slide,
          source.iconKey,
          {
            x: cardX + 0.22,
            y: rowY + 0.02,
            w: 0.22,
            h: 0.22,
          },
          theme,
          'accent',
        );
        addTextFr(slide, source.label, {
          x: cardX + 0.52,
          y: rowY,
          w: Math.max(0.2, cardW - 1.78),
          h: 0.19,
          fontSize: 8.2,
          color: textMain,
          valign: 'middle',
          fit: 'shrink',
        });
        addTextFr(slide, `${euro(source.annualNetAmount)} / an`, {
          x: cardX + cardW - 1.14,
          y: rowY - 0.02,
          w: 0.96,
          h: 0.22,
          fontSize: 10,
          bold: true,
          color: readableAmountColor,
          align: 'right',
          valign: 'middle',
          fit: 'shrink',
        });
      });
    }
  });

  // ── Segment final (capital placé) si gap ──────────────────────────────
  if (spec.tailSegment) {
    const x = yearToX(spec.tailSegment.startYear, spec.rangeStartYear, totalYears);
    const xEnd = yearToX(spec.tailSegment.endYear + 1, spec.rangeStartYear, totalYears);
    const rawW = Math.max(0, xEnd - x);
    const cappedW = Math.max(0.12, Math.min(rawW, MARGIN_X + CONTENT_W - x));
    const isTailNarrow = cappedW < 1.25;
    const tailLabel = spec.tailSegment.label.toLocaleLowerCase('fr-FR').includes('trésorerie')
      ? 'Trésorerie capitalisée'
      : spec.tailSegment.label;

    slide.addShape('roundRect', {
      x,
      y: bandY,
      w: cappedW,
      h: bandH,
      fill: { color: color7 },
      line: { color: color3, width: 1.2, dashType: 'dash' },
      rectRadius: 0.12,
    });
    if (isTailNarrow) {
      const calloutW = 1.78;
      const calloutX = Math.max(
        MARGIN_X,
        Math.min(x - calloutW - 0.12, MARGIN_X + CONTENT_W - calloutW),
      );
      slide.addShape('line', {
        x: calloutX + calloutW + 0.02,
        y: bandY + 0.88,
        w: Math.max(0, x + cappedW / 2 - calloutX - calloutW - 0.02),
        h: 0,
        line: { color: color3, width: 0.7 },
      });
      addTextFr(slide, tailLabel, {
        x: calloutX,
        y: bandY + 0.74,
        w: calloutW,
        h: 0.26,
        fontSize: 8.4,
        bold: true,
        italic: true,
        color: color3,
        align: 'right',
        valign: 'middle',
        fit: 'shrink',
      });
    } else {
      addTextFr(slide, tailLabel, {
        x: x + 0.12,
        y: bandY + 0.08,
        w: Math.max(0.2, cappedW - 0.24),
        h: 0.3,
        fontSize: 12,
        bold: true,
        italic: true,
        color: color3,
        align: 'center',
        valign: 'middle',
        fit: 'shrink',
      });
      addTextFr(slide, `${spec.tailSegment.startYear} → ${spec.tailSegment.endYear}`, {
        x: x + 0.12,
        y: bandY + 0.36,
        w: Math.max(0.2, cappedW - 0.24),
        h: 0.26,
        fontSize: 10,
        italic: true,
        color: textBody,
        align: 'center',
        valign: 'middle',
        fit: 'shrink',
      });
    }
  }

  // ── Bandeau cumul net ─────────────────────────────────────────────────
  slide.addShape('roundRect', {
    x: MARGIN_X,
    y: footerCardY,
    w: CONTENT_W,
    h: 0.56,
    fill: { color: accent },
    line: { color: accent, width: 0 },
    rectRadius: 0.1,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: SHADOW_PARAMS.blur,
      offset: SHADOW_PARAMS.offset,
      opacity: SHADOW_PARAMS.opacity * 0.7,
      color: roleColor(theme, 'shadowBase'),
    },
  });
  const accentTextColor = contrastText(accent);
  addTextFr(slide, 'Cumul revenus nets sur la période', {
    x: MARGIN_X + 0.3,
    y: footerCardY + 0.1,
    w: 6.0,
    h: 0.36,
    fontSize: 11,
    color: accentTextColor,
    valign: 'middle',
  });
  addTextFr(slide, euro(spec.totalNetSum), {
    x: MARGIN_X + CONTENT_W - 4.5,
    y: footerCardY + 0.08,
    w: 4.3,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: accentTextColor,
    align: 'right',
    valign: 'middle',
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieTimeline;
