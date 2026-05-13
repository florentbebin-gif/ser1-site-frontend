/**
 * buildTresorerieAllocationMatrix.ts — Slide pédagogique matrice de placement.
 *
 * Style aligné Placement Synthesis : bandeau coloré full-width par horizon,
 * couleurs sectorielles (CT pâle / MT moyen / LT accent), hero rendement 22pt.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieAllocationMatrixSlideSpec } from '../theme/types';
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

const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;
const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;
const WHITE = 'FFFFFF';

type HorizonKey = 'court' | 'moyen' | 'long';

function contrastText(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
}

export function buildTresorerieAllocationMatrix(
  pptx: PptxGenJS,
  spec: TresorerieAllocationMatrixSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const textMain = roleColor(theme, 'textMain');
  const textBody = roleColor(theme, 'textBody');
  const panelBorder = roleColor(theme, 'panelBorder');
  const accent = roleColor(theme, 'accent');

  // Couleurs sectorielles : court (pâle) → moyen → long (accent)
  const horizonColors: Record<HorizonKey, string> = {
    court: theme.colors.color8.replace('#', ''),
    moyen: theme.colors.color5.replace('#', ''),
    long: accent,
  };

  const gap = 0.32;
  const colW = (CONTENT_W - gap * 2) / 3;
  const colH = CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.04;
  const headerH = 0.72;

  spec.horizons.slice(0, 3).forEach((horizon, index) => {
    const x = MARGIN_X + index * (colW + gap);
    const horizonColor = horizonColors[horizon.key] ?? accent;
    const headerTextColor = contrastText(horizonColor);

    // ── Carte ombrée colorée full-fill (gomme les coins arrondis) ──────
    slide.addShape('roundRect', {
      x,
      y: CONTENT_TOP_Y,
      w: colW,
      h: colH,
      fill: { color: horizonColor },
      line: { color: horizonColor, width: 1 },
      rectRadius: 0.10,
      shadow: {
        type: SHADOW_PARAMS.type,
        angle: SHADOW_PARAMS.angle,
        blur: SHADOW_PARAMS.blur,
        offset: SHADOW_PARAMS.offset,
        opacity: SHADOW_PARAMS.opacity,
        color: roleColor(theme, 'shadowBase'),
      },
    });
    // Zone blanche sous le bandeau
    slide.addShape('rect', {
      x: x + 0.02,
      y: CONTENT_TOP_Y + headerH,
      w: colW - 0.04,
      h: colH - headerH - 0.02,
      fill: { color: WHITE },
      line: { color: WHITE, width: 0 },
    });

    // ── Titre dans le bandeau ──────────────────────────────────────────
    addTextFr(slide, horizon.label, {
      x: x + 0.20,
      y: CONTENT_TOP_Y + 0.16,
      w: colW - 0.40,
      h: 0.40,
      fontSize: 14,
      bold: true,
      color: headerTextColor,
      align: 'center',
      valign: 'middle',
    });

    // ── Icône ronde sous le bandeau (cercle blanc avec icône colorée) ──
    const iconY = CONTENT_TOP_Y + headerH + 0.18;
    slide.addShape('ellipse', {
      x: x + colW / 2 - 0.50,
      y: iconY,
      w: 1.00,
      h: 1.00,
      fill: { color: WHITE },
      line: { color: horizonColor, width: 2 },
    });
    addBusinessIconToSlide(slide, horizon.iconKey, {
      x: x + colW / 2 - 0.35,
      y: iconY + 0.15,
      w: 0.70,
      h: 0.70,
    }, theme, 'accent');

    // ── Hero rendement attendu ────────────────────────────────────────
    const heroY = iconY + 1.10;
    addTextFr(slide, 'Rendement attendu', {
      x: x + 0.18,
      y: heroY,
      w: colW - 0.36,
      h: 0.20,
      fontSize: 9.5,
      italic: true,
      color: textBody,
      align: 'center',
      valign: 'middle',
    });
    addTextFr(slide, horizon.typicalReturn, {
      x: x + 0.18,
      y: heroY + 0.22,
      w: colW - 0.36,
      h: 0.42,
      fontSize: 22,
      bold: true,
      color: horizonColor,
      align: 'center',
      valign: 'middle',
    });

    // ── Durée ──────────────────────────────────────────────────────────
    const dureeY = heroY + 0.72;
    addTextFr(slide, 'Durée', {
      x: x + 0.18,
      y: dureeY,
      w: colW - 0.36,
      h: 0.18,
      fontSize: 9.5,
      italic: true,
      color: textBody,
      align: 'center',
    });
    addTextFr(slide, horizon.durationLabel, {
      x: x + 0.18,
      y: dureeY + 0.20,
      w: colW - 0.36,
      h: 0.26,
      fontSize: 12,
      bold: true,
      color: textMain,
      align: 'center',
      valign: 'middle',
    });

    // ── Séparateur ─────────────────────────────────────────────────────
    slide.addShape('line', {
      x: x + 0.30,
      y: dureeY + 0.56,
      w: colW - 0.60,
      h: 0,
      line: { color: panelBorder, width: 0.6 },
    });

    // ── Supports typiques ─────────────────────────────────────────────
    const supportsY = dureeY + 0.68;
    addTextFr(slide, 'Supports typiques', {
      x: x + 0.18,
      y: supportsY,
      w: colW - 0.36,
      h: 0.22,
      fontSize: 10.5,
      bold: true,
      italic: true,
      color: horizonColor,
      align: 'center',
    });
    addTextFr(slide, horizon.typicalSupports.map(support => `· ${support}`).join('\n'), {
      x: x + 0.18,
      y: supportsY + 0.26,
      w: colW - 0.36,
      h: 0.90,
      fontSize: 10,
      color: textBody,
      align: 'center',
      breakLine: false,
    });
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieAllocationMatrix;
