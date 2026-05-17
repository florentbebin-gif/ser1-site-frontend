/**
 * buildTresorerieAllocationCards.ts — Slide allocation par poche.
 *
 * Style inspiré de la slide 7 « Allocation globale d'actifs » :
 * - doughnut chart natif PPTX (holeSize 70 %) à gauche,
 *   couleurs sectorielles selon l'horizon de la poche,
 * - cards bandeau coloré à droite avec montant héros (24pt bold).
 *
 * pptxgenjs supporte le type 'doughnut' avec `holeSize` ; aucun chart externe.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieAllocationCardsSlideSpec } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  COORDS_CONTENT,
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
const WHITE = 'FFFFFF';

type Horizon = 'court' | 'moyen' | 'long' | 'banque';

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function pct(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `${rounded.toLocaleString('fr-FR')} %`;
}

function horizonFromLabel(label: string): Horizon {
  const lower = label.toLowerCase();
  if (lower.includes('court')) return 'court';
  if (lower.includes('moyen')) return 'moyen';
  if (lower.includes('long')) return 'long';
  return 'banque';
}

function contrastText(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
}

export function buildTresorerieAllocationCards(
  pptx: PptxGenJS,
  spec: TresorerieAllocationCardsSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const textMain = roleColor(theme, 'textMain');
  const panelBorder = roleColor(theme, 'panelBorder');
  const bgMain = roleColor(theme, 'bgMain');

  // Palette sectorielle contrastée pour rester lisible dans le donut et les bandeaux.
  const horizonColors: Record<Horizon, string> = {
    court: bgMain,
    moyen: theme.colors.color5.replace('#', ''),
    long: theme.colors.color2.replace('#', ''),
    banque: theme.colors.color2.replace('#', ''),
  };

  const cards = spec.cards.slice(0, 5);
  const saturated = spec.allocatableBase <= 0;

  // ── Repères compacts ─────────────────────────────────────────────────
  const summaryParts = [
    { label: 'Trésorerie initiale', value: euro(spec.treasuryInitial) },
    { label: 'Banque protégée', value: euro(spec.protectedCash) },
    { label: 'Disponible', value: euro(spec.allocatableBase) },
  ];
  const summaryY = CONTENT_TOP_Y + 0.02;
  const summaryGap = 0.16;
  const summaryH = 0.5;
  const summaryW = (CONTENT_W - summaryGap * 2) / 3;
  summaryParts.forEach((item, index) => {
    const x = MARGIN_X + index * (summaryW + summaryGap);
    slide.addShape('roundRect', {
      x,
      y: summaryY,
      w: summaryW,
      h: summaryH,
      fill: { color: index === 2 ? bgMain : WHITE },
      line: { color: index === 2 ? bgMain : panelBorder, width: 0.55 },
      rectRadius: 0.06,
    });
    const summaryTextColor = index === 2 ? contrastText(bgMain) : textMain;
    addTextFr(slide, item.label, {
      x: x + 0.16,
      y: summaryY + 0.06,
      w: summaryW - 0.32,
      h: 0.16,
      fontSize: 8,
      color: summaryTextColor,
      fit: 'shrink',
    });
    addTextFr(slide, item.value, {
      x: x + 0.16,
      y: summaryY + 0.23,
      w: summaryW - 0.32,
      h: 0.22,
      fontSize: 12,
      bold: true,
      color: summaryTextColor,
      fit: 'shrink',
    });
  });

  // ── Donut chart à gauche ──────────────────────────────────────────────
  const donutX = MARGIN_X + 0.1;
  const donutY = CONTENT_TOP_Y + 0.72;
  const donutSize = 3.66;

  if (cards.length > 0 && !saturated) {
    const labels = cards.map((card) => card.label);
    const values = cards.map((card) => card.initialAllocationPct);
    const chartColors = cards.map((card) => horizonColors[horizonFromLabel(card.horizonLabel)]);

    slide.addChart(
      pptx.ChartType.doughnut,
      [
        {
          name: 'Allocation',
          labels,
          values,
        },
      ],
      {
        x: donutX,
        y: donutY,
        w: donutSize,
        h: donutSize,
        holeSize: 65,
        chartColors,
        chartColorsOpacity: 100,
        showLegend: false,
        showTitle: false,
        dataBorder: { color: 'FFFFFF', pt: 2 },
        showPercent: true,
        showValue: false,
        dataLabelColor: 'FFFFFF',
        dataLabelFontFace: 'Arial',
        dataLabelFontSize: 11,
        dataLabelFontBold: true,
        dataLabelPosition: 'ctr',
      } as PptxGenJS.IChartOpts,
    );

    // Centre du donut : montant disponible
    const centerX = donutX + donutSize / 2;
    const centerY = donutY + donutSize / 2;
    addTextFr(slide, 'Disponible', {
      x: centerX - 1.1,
      y: centerY - 0.5,
      w: 2.2,
      h: 0.24,
      fontSize: 10.5,
      italic: true,
      color: textMain,
      align: 'center',
      valign: 'middle',
    });
    addTextFr(slide, euro(spec.allocatableBase), {
      x: centerX - 1.3,
      y: centerY - 0.2,
      w: 2.6,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: textMain,
      align: 'center',
      valign: 'middle',
    });
    addTextFr(slide, 'pour l’allocation', {
      x: centerX - 1.1,
      y: centerY + 0.32,
      w: 2.2,
      h: 0.2,
      fontSize: 9,
      italic: true,
      color: textMain,
      align: 'center',
      valign: 'middle',
    });
  } else {
    // Cas saturé OU aucune poche : afficher placeholder neutre
    slide.addShape('ellipse', {
      x: donutX,
      y: donutY,
      w: donutSize,
      h: donutSize,
      fill: { color: theme.colors.color9.replace('#', '') },
      line: { color: panelBorder, width: 0.8 },
    });
    const centerX = donutX + donutSize / 2;
    const centerY = donutY + donutSize / 2;
    addTextFr(slide, saturated ? 'Banque protégée saturée' : 'Aucune poche configurée', {
      x: centerX - 1.6,
      y: centerY - 0.2,
      w: 3.2,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: textMain,
      align: 'center',
      valign: 'middle',
    });
    addTextFr(slide, 'L’excédent de trésorerie reste sur le compte bancaire', {
      x: centerX - 1.8,
      y: centerY + 0.24,
      w: 3.6,
      h: 0.3,
      fontSize: 9.5,
      italic: true,
      color: textMain,
      align: 'center',
      valign: 'middle',
    });
  }

  // ── Cards à droite ───────────────────────────────────────────────────
  const cardsX = MARGIN_X + donutSize + 0.4;
  const cardsW = CONTENT_W - donutSize - 0.4;
  const cardsTopY = CONTENT_TOP_Y + 0.7;
  const cardsAreaH = donutSize + 0.1;

  const cardCount = Math.max(1, cards.length);
  const cols = cardCount <= 3 ? 1 : 2;
  const rows = Math.ceil(cardCount / cols);
  const gapX = 0.2;
  const gapY = 0.2;
  const cardW = (cardsW - gapX * (cols - 1)) / cols;
  const cardH = (cardsAreaH - gapY * (rows - 1)) / rows;

  cards.forEach((card, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = cardsX + col * (cardW + gapX);
    const y = cardsTopY + row * (cardH + gapY);
    const horizon = horizonFromLabel(card.horizonLabel);
    const horizonColor = horizonColors[horizon];
    const headerTextColor = contrastText(horizonColor);
    const headerH = 0.4;

    // Card colorée pleine
    slide.addShape('roundRect', {
      x,
      y,
      w: cardW,
      h: cardH,
      fill: { color: horizonColor },
      line: { color: horizonColor, width: 1 },
      rectRadius: 0.09,
      shadow: {
        type: SHADOW_PARAMS.type,
        angle: SHADOW_PARAMS.angle,
        blur: SHADOW_PARAMS.blur,
        offset: SHADOW_PARAMS.offset,
        opacity: SHADOW_PARAMS.opacity,
        color: roleColor(theme, 'shadowBase'),
      },
    });
    // Zone blanche sous bandeau
    slide.addShape('rect', {
      x: x + 0.02,
      y: y + headerH,
      w: cardW - 0.04,
      h: cardH - headerH - 0.02,
      fill: { color: WHITE },
      line: { color: WHITE, width: 0 },
    });
    // Bandeau : libellé poche
    addTextFr(slide, card.label, {
      x: x + 0.16,
      y: y + 0.06,
      w: cardW - 0.32,
      h: headerH - 0.08,
      fontSize: 11.5,
      bold: true,
      color: headerTextColor,
      valign: 'middle',
    });

    // Corps : icône + montant + métriques
    const bodyY = y + headerH + 0.08;
    addBusinessIconToSlide(
      slide,
      card.iconKey,
      {
        x: x + 0.18,
        y: bodyY + 0.06,
        w: 0.46,
        h: 0.46,
      },
      theme,
      'textMain',
    );
    addTextFr(slide, card.horizonLabel, {
      x: x + 0.74,
      y: bodyY + 0.02,
      w: cardW - 0.9,
      h: 0.2,
      fontSize: 9,
      italic: true,
      color: textMain,
      valign: 'middle',
    });
    addTextFr(slide, euro(card.initialAmount), {
      x: x + 0.74,
      y: bodyY + 0.22,
      w: cardW - 0.9,
      h: 0.34,
      fontSize: 17,
      bold: true,
      color: textMain,
      valign: 'middle',
      fit: 'shrink',
    });

    // Séparateur fin
    slide.addShape('line', {
      x: x + 0.18,
      y: bodyY + 0.66,
      w: cardW - 0.36,
      h: 0,
      line: { color: panelBorder, width: 0.5 },
    });

    // Métriques compactes
    const metricLines = [
      `Durée ${card.durationYears} ans · Rendement ${pct(card.annualReturnRate * 100)}`,
      `Allocation ${pct(card.initialAllocationPct)} · Balayage ${pct(card.annualAllocationPct)}`,
    ];
    addTextFr(slide, metricLines.join('\n'), {
      x: x + 0.18,
      y: bodyY + 0.74,
      w: cardW - 0.36,
      h: cardH - headerH - 0.92,
      fontSize: 9,
      color: textMain,
      breakLine: false,
      fit: 'shrink',
    });
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieAllocationCards;
