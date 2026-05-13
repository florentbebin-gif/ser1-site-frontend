/**
 * buildTresorerieSchema.ts — Slide « Contexte société »
 *
 * Style aligné Placement Synthesis : bandeaux colorés + cartes ombrées.
 * - Card société : bandeau accent (color3) + 7 paramètres clés.
 * - Card associé : bandeau color5 (vert moyen) + 4 paramètres clés.
 * - Organigramme à gauche dans une carte blanche ombrée.
 */

import type PptxGenJS from 'pptxgenjs';
import { computeTresoOrgchartLayout } from '@/features/tresorerie-societe/tresoOrgchartLayout';
import type { TresorerieSchemaSlideSpec, ExportContext } from '../theme/types';
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

// ============================================================================
// CONSTANTS
// ============================================================================

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;
const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;
const WHITE = 'FFFFFF';

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  if (!n) return '0 €';
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function labelKind(kind: TresorerieSchemaSlideSpec['associateHighlights'][number]['kind']): string {
  return kind === 'pm' ? 'Personne morale' : 'Personne physique';
}

function drawSafeLine(
  slide: PptxGenJS.Slide,
  start: { x: number; y: number },
  end: { x: number; y: number },
  line: PptxGenJS.ShapeLineProps,
): void {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;

  slide.addShape('line', {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(dx),
    h: Math.abs(dy),
    flipH: (dx < 0) !== (dy < 0),
    line,
  });
}

function drawHeaderedCard(
  slide: PptxGenJS.Slide,
  params: {
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    headerFill: string;
    theme: ExportContext['theme'];
  },
): void {
  const { x, y, w, h, title, headerFill, theme } = params;
  const headerH = 0.45;

  // Carte ombrée pleine
  slide.addShape('roundRect', {
    x,
    y,
    w,
    h,
    fill: { color: headerFill },
    line: { color: headerFill, width: 1 },
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
  // Zone blanche en dessous du bandeau (radius arrondi en bas, droit en haut)
  slide.addShape('rect', {
    x: x + 0.02,
    y: y + headerH,
    w: w - 0.04,
    h: h - headerH - 0.02,
    fill: { color: WHITE },
    line: { color: WHITE, width: 0 },
  });
  // Titre dans le bandeau
  addTextFr(slide, title, {
    x: x + 0.20,
    y: y + 0.06,
    w: w - 0.40,
    h: headerH - 0.08,
    fontSize: 12.5,
    bold: true,
    color: WHITE,
    valign: 'middle',
  });
}

function addParameterRow(
  slide: PptxGenJS.Slide,
  params: {
    x: number;
    y: number;
    w: number;
    rowH: number;
    label: string;
    value: string;
    theme: ExportContext['theme'];
    striped?: boolean;
  },
): void {
  const { x, y, w, rowH, label, value, theme, striped } = params;
  if (striped) {
    slide.addShape('rect', {
      x,
      y,
      w,
      h: rowH,
      fill: { color: theme.colors.color9.replace('#', '') },
      line: { color: theme.colors.color9.replace('#', ''), width: 0 },
    });
  }
  addTextFr(slide, label, {
    x: x + 0.12,
    y,
    w: w * 0.55 - 0.12,
    h: rowH,
    fontSize: 9.5,
    color: roleColor(theme, 'textBody'),
    valign: 'middle',
  });
  addTextFr(slide, value, {
    x: x + w * 0.55,
    y,
    w: w * 0.45 - 0.12,
    h: rowH,
    fontSize: 11,
    bold: true,
    align: 'right',
    color: roleColor(theme, 'textMain'),
    valign: 'middle',
  });
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export function buildTresorerieSchema(
  pptx: PptxGenJS,
  spec: TresorerieSchemaSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const totalH = CONTENT_BOTTOM_Y - CONTENT_TOP_Y;
  const chartW = 6.40;
  const sideGap = 0.28;
  const sideX = MARGIN_X + chartW + sideGap;
  const sideW = CONTENT_W - chartW - sideGap;

  const accent = roleColor(theme, 'accent');
  const color5 = theme.colors.color5.replace('#', '');
  const color8 = theme.colors.color8.replace('#', '');
  const textMain = roleColor(theme, 'textMain');
  const panelBorder = roleColor(theme, 'panelBorder');

  // ── Panneau organigramme ──────────────────────────────────────────────
  slide.addShape('roundRect', {
    x: MARGIN_X,
    y: CONTENT_TOP_Y,
    w: chartW,
    h: totalH,
    fill: { color: WHITE },
    line: { color: panelBorder, width: 0.75 },
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
  // Bandeau titre en haut du panneau organigramme
  slide.addShape('rect', {
    x: MARGIN_X + 0.02,
    y: CONTENT_TOP_Y + 0.02,
    w: chartW - 0.04,
    h: 0.40,
    fill: { color: theme.colors.color9.replace('#', '') },
    line: { color: theme.colors.color9.replace('#', ''), width: 0 },
  });
  addTextFr(slide, 'Organigramme du groupe', {
    x: MARGIN_X + 0.20,
    y: CONTENT_TOP_Y + 0.04,
    w: chartW - 0.40,
    h: 0.36,
    fontSize: 11,
    bold: true,
    italic: true,
    color: textMain,
    valign: 'middle',
  });

  const chartAreaTop = CONTENT_TOP_Y + 0.48;
  const chartAreaH = totalH - 0.50;
  const layout = computeTresoOrgchartLayout(spec.orgchartCompany);
  const chartPadding = 0.30;
  const chartScale = Math.min(
    (chartW - chartPadding * 2) / Math.max(1, layout.svgWidth),
    (chartAreaH - chartPadding * 2) / Math.max(1, layout.svgHeight),
  );
  const chartOriginX = MARGIN_X + (chartW - layout.svgWidth * chartScale) / 2;
  const chartOriginY = chartAreaTop + (chartAreaH - layout.svgHeight * chartScale) / 2;
  const scaleX = (x: number) => chartOriginX + x * chartScale;
  const scaleY = (y: number) => chartOriginY + y * chartScale;

  layout.edges.forEach(edge => {
    drawSafeLine(
      slide,
      { x: scaleX(edge.x1), y: scaleY(edge.y1) },
      { x: scaleX(edge.x2), y: scaleY(edge.y2) },
      { color: panelBorder, width: 1 },
    );
  });

  layout.labels.forEach(label => {
    const x = scaleX(label.x);
    const y = scaleY(label.y);
    slide.addShape('roundRect', {
      x: x - 0.30,
      y: y - 0.13,
      w: 0.60,
      h: 0.26,
      fill: { color: accent },
      line: { color: accent, width: 0 },
      rectRadius: 0.05,
    });
    addTextFr(slide, label.text, {
      x: x - 0.30,
      y: y - 0.13,
      w: 0.60,
      h: 0.26,
      fontSize: 9,
      bold: true,
      align: 'center',
      valign: 'middle',
      color: WHITE,
    });
  });

  layout.nodes.forEach(node => {
    const x = scaleX(node.x);
    const y = scaleY(node.y);
    const w = node.width * chartScale;
    const h = node.height * chartScale;
    const isCompany = node.kind === 'company';
    const details = isCompany
      ? [node.meta, node.detail].filter(Boolean)
      : [node.meta].filter(Boolean);

    slide.addShape('roundRect', {
      x,
      y,
      w,
      h,
      fill: { color: isCompany ? accent : WHITE },
      line: {
        color: isCompany ? accent : panelBorder,
        width: isCompany ? 0 : 0.8,
      },
      rectRadius: 0.08,
    });
    addTextFr(slide, truncate(node.label, 32), {
      x: x + 0.04,
      y: y + (isCompany ? h * 0.10 : h * 0.18),
      w: Math.max(0.1, w - 0.08),
      h: h * 0.40,
      fontSize: isCompany ? 11.5 : 10.5,
      bold: true,
      align: 'center',
      valign: 'middle',
      color: isCompany ? WHITE : textMain,
    });
    details.forEach((detail, index) => {
      addTextFr(slide, truncate(detail ?? '', 30), {
        x: x + 0.04,
        y: y + h * (isCompany ? 0.54 + index * 0.20 : 0.62),
        w: Math.max(0.1, w - 0.08),
        h: h * 0.22,
        fontSize: 8.6,
        align: 'center',
        valign: 'middle',
        color: isCompany ? WHITE : roleColor(theme, 'textBody'),
      });
    });
  });

  // ── Colonne droite : 2 cards bandeau ──────────────────────────────────
  const companyPanelH = 2.78;
  const associatePanelY = CONTENT_TOP_Y + companyPanelH + 0.18;
  const associatePanelH = totalH - companyPanelH - 0.18;

  drawHeaderedCard(slide, {
    x: sideX,
    y: CONTENT_TOP_Y,
    w: sideW,
    h: companyPanelH,
    title: 'Paramètres société',
    headerFill: accent,
    theme,
  });

  const companyRows: Array<{ label: string; value: string }> = [
    {
      label: 'Forme · Type',
      value: `${spec.essentials.legalForm.toUpperCase()} · ${spec.essentials.companyKindLabel}`,
    },
    { label: 'Capital social', value: euro(spec.essentials.capitalSocial) },
    { label: 'Trésorerie initiale', value: euro(spec.essentials.treasuryInitial) },
    { label: 'Solde bancaire protégé', value: euro(spec.essentials.minimumBankBalance) },
    { label: 'Fonds de roulement', value: euro(spec.essentials.workingCapitalRequirement) },
    { label: 'CCA initial total', value: euro(spec.essentials.ccaInitialTotal) },
    {
      label: 'Crédits société',
      value: spec.essentials.loansCount > 0
        ? `${spec.essentials.loansCount} prêt(s) · ${euro(spec.essentials.loansTotalPrincipal)}`
        : 'Aucun',
    },
  ];

  const companyRowsTopY = CONTENT_TOP_Y + 0.58;
  const companyRowH = (companyPanelH - 0.68) / companyRows.length;
  companyRows.forEach((row, index) => {
    addParameterRow(slide, {
      x: sideX + 0.04,
      y: companyRowsTopY + index * companyRowH,
      w: sideW - 0.08,
      rowH: companyRowH,
      label: row.label,
      value: row.value,
      theme,
      striped: index % 2 === 1,
    });
  });

  drawHeaderedCard(slide, {
    x: sideX,
    y: associatePanelY,
    w: sideW,
    h: associatePanelH,
    title: 'Associé principal',
    headerFill: color5,
    theme,
  });

  const highlight = spec.associateHighlights[0];
  if (!highlight) {
    addTextFr(slide, 'Aucun associé renseigné.', {
      x: sideX + 0.18,
      y: associatePanelY + 0.78,
      w: sideW - 0.36,
      h: 0.24,
      fontSize: 10,
      color: roleColor(theme, 'textBody'),
    });
  } else {
    // Bandeau associé : nom + kind
    addTextFr(slide, highlight.label, {
      x: sideX + 0.18,
      y: associatePanelY + 0.55,
      w: sideW - 0.36,
      h: 0.26,
      fontSize: 13,
      bold: true,
      color: textMain,
    });
    addTextFr(slide, labelKind(highlight.kind), {
      x: sideX + 0.18,
      y: associatePanelY + 0.78,
      w: sideW - 0.36,
      h: 0.20,
      fontSize: 9.5,
      italic: true,
      color: roleColor(theme, 'textBody'),
    });

    const associateRows: Array<{ label: string; value: string }> = [
      { label: 'Âge', value: highlight.ageLabel ?? '—' },
      { label: 'Capital · Économique', value: `${highlight.capitalPct} · ${highlight.economicRightsPct}` },
      { label: 'CCA initial', value: euro(highlight.ccaInitial) },
    ];

    const associateRowsTopY = associatePanelY + 1.08;
    const associateRowH = Math.max(0.26, (associatePanelH - 1.18) / associateRows.length);
    associateRows.forEach((row, index) => {
      addParameterRow(slide, {
        x: sideX + 0.04,
        y: associateRowsTopY + index * associateRowH,
        w: sideW - 0.08,
        rowH: associateRowH,
        label: row.label,
        value: row.value,
        theme,
        striped: index % 2 === 1,
      });
    });
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
  // unused color8 kept for potential future striping
  void color8;
}

export default buildTresorerieSchema;
