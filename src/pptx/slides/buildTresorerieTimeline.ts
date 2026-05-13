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
  const bandH = 0.70;
  const lineY = bandY + bandH + 0.30;
  const sourceTopY = lineY + 0.42;
  const sourceCardH = 0.66;
  const sourceGap = 0.12;
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

  // ── Axe horizontal ─────────────────────────────────────────────────────
  slide.addShape('line', {
    x: MARGIN_X,
    y: lineY,
    w: CONTENT_W,
    h: 0,
    line: { color: textMain, width: 1.6 },
  });

  addTextFr(slide, `${spec.rangeStartYear}`, {
    x: MARGIN_X - 0.10,
    y: lineY + 0.10,
    w: 0.90,
    h: 0.24,
    fontSize: 10,
    bold: true,
    color: textBody,
  });
  addTextFr(slide, `${spec.rangeEndYear}`, {
    x: MARGIN_X + CONTENT_W - 0.80,
    y: lineY + 0.10,
    w: 0.90,
    h: 0.24,
    fontSize: 10,
    bold: true,
    color: textBody,
    align: 'right',
  });

  // ── Marqueur retraite (vertical + pastille) ────────────────────────────
  if (spec.retirementYear && spec.retirementYear > spec.rangeStartYear && spec.retirementYear < spec.rangeEndYear) {
    const retraiteX = yearToX(spec.retirementYear, spec.rangeStartYear, totalYears);
    slide.addShape('line', {
      x: retraiteX,
      y: bandY + bandH + 0.04,
      w: 0,
      h: lineY - bandY - bandH + 0.16,
      line: { color: color3, width: 1.5, dashType: 'dash' },
    });
    slide.addShape('ellipse', {
      x: retraiteX - 0.10,
      y: lineY - 0.10,
      w: 0.20,
      h: 0.20,
      fill: { color: color3 },
      line: { color: color3, width: 0 },
    });
    addTextFr(slide, `Retraite ${spec.retirementYear}`, {
      x: retraiteX - 0.85,
      y: bandY + bandH - 0.04,
      w: 1.70,
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
  spec.segments.forEach((segment, index) => {
    const x = yearToX(segment.startYear, spec.rangeStartYear, totalYears);
    const xEnd = yearToX(segment.endYear + 1, spec.rangeStartYear, totalYears);
    const w = Math.max(1.20, xEnd - x);
    const cappedW = Math.min(w, MARGIN_X + CONTENT_W - x);
    const bandFill = segmentPalette[index % segmentPalette.length];

    // Bandeau du palier
    slide.addShape('roundRect', {
      x,
      y: bandY,
      w: cappedW,
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
    addTextFr(slide, segment.label, {
      x: x + 0.12,
      y: bandY + 0.08,
      w: Math.max(0.20, cappedW - 0.24),
      h: 0.30,
      fontSize: 13,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });
    addTextFr(slide, `${segment.startYear} → ${segment.endYear}`, {
      x: x + 0.12,
      y: bandY + 0.36,
      w: Math.max(0.20, cappedW - 0.24),
      h: 0.26,
      fontSize: 10,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });

    // Tick sur l'axe
    slide.addShape('line', {
      x,
      y: lineY - 0.12,
      w: 0,
      h: 0.24,
      line: { color: textMain, width: 1.4 },
    });

    // Cartes sources sous l'axe
    segment.sources.slice(0, 3).forEach((source, sourceIndex) => {
      const cardY = sourceTopY + sourceIndex * (sourceCardH + sourceGap);
      const cardW = Math.max(1.40, cappedW);
      if (cardY + sourceCardH > footerCardY - 0.10) return;

      slide.addShape('roundRect', {
        x,
        y: cardY,
        w: cardW,
        h: sourceCardH,
        fill: { color: WHITE },
        line: { color: panelBorder, width: 0.6 },
        rectRadius: 0.08,
      });
      // Barre verticale colorée = identité palier
      slide.addShape('rect', {
        x,
        y: cardY,
        w: 0.10,
        h: sourceCardH,
        fill: { color: bandFill },
        line: { color: bandFill, width: 0 },
      });
      addBusinessIconToSlide(slide, source.iconKey, {
        x: x + 0.22,
        y: cardY + 0.18,
        w: 0.34,
        h: 0.34,
      }, theme, 'accent');
      addTextFr(slide, source.label, {
        x: x + 0.64,
        y: cardY + 0.08,
        w: Math.max(0.20, cardW - 0.78),
        h: 0.22,
        fontSize: 10,
        color: textBody,
        valign: 'middle',
      });
      addTextFr(slide, `${euro(source.annualNetAmount)} / an`, {
        x: x + 0.64,
        y: cardY + 0.30,
        w: Math.max(0.20, cardW - 0.78),
        h: 0.30,
        fontSize: 15,
        bold: true,
        color: bandFill,
        valign: 'middle',
      });
    });
  });

  // ── Segment final (capital placé) si gap ──────────────────────────────
  if (spec.tailSegment) {
    const x = yearToX(spec.tailSegment.startYear, spec.rangeStartYear, totalYears);
    const xEnd = yearToX(spec.tailSegment.endYear + 1, spec.rangeStartYear, totalYears);
    const w = Math.max(0.60, xEnd - x);
    const cappedW = Math.min(w, MARGIN_X + CONTENT_W - x);

    slide.addShape('roundRect', {
      x,
      y: bandY,
      w: cappedW,
      h: bandH,
      fill: { color: color7 },
      line: { color: color3, width: 1.2, dashType: 'dash' },
      rectRadius: 0.12,
    });
    addTextFr(slide, spec.tailSegment.label, {
      x: x + 0.12,
      y: bandY + 0.08,
      w: Math.max(0.20, cappedW - 0.24),
      h: 0.30,
      fontSize: 12,
      bold: true,
      italic: true,
      color: color3,
      align: 'center',
      valign: 'middle',
    });
    addTextFr(slide, `${spec.tailSegment.startYear} → ${spec.tailSegment.endYear}`, {
      x: x + 0.12,
      y: bandY + 0.36,
      w: Math.max(0.20, cappedW - 0.24),
      h: 0.26,
      fontSize: 10,
      italic: true,
      color: textBody,
      align: 'center',
      valign: 'middle',
    });
  }

  // ── Bandeau cumul net ─────────────────────────────────────────────────
  slide.addShape('roundRect', {
    x: MARGIN_X,
    y: footerCardY,
    w: CONTENT_W,
    h: 0.56,
    fill: { color: accent },
    line: { color: accent, width: 0 },
    rectRadius: 0.10,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: SHADOW_PARAMS.blur,
      offset: SHADOW_PARAMS.offset,
      opacity: SHADOW_PARAMS.opacity * 0.7,
      color: roleColor(theme, 'shadowBase'),
    },
  });
  addTextFr(slide, 'Cumul revenus nets sur la période', {
    x: MARGIN_X + 0.30,
    y: footerCardY + 0.10,
    w: 6.0,
    h: 0.36,
    fontSize: 11,
    color: WHITE,
    valign: 'middle',
  });
  addTextFr(slide, euro(spec.totalNetSum), {
    x: MARGIN_X + CONTENT_W - 4.5,
    y: footerCardY + 0.08,
    w: 4.3,
    h: 0.40,
    fontSize: 18,
    bold: true,
    color: WHITE,
    align: 'right',
    valign: 'middle',
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieTimeline;
