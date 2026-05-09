/**
 * buildTresorerieSchema.ts — Slide « Schéma Trésorerie Société IS »
 *
 * Règle wording GOUVERNANCE_EXPORTS.md : aucun vocabulaire source interdit dans les slides client.
 * Wording premium : "Trésorerie société", "Holding patrimoniale", "Société de capitalisation".
 */

import type PptxGenJS from 'pptxgenjs';
import {
  TRESO_ORG_NODE_HEIGHT,
  TRESO_ORG_NODE_WIDTH,
  computeTresoOrgchartLayout,
} from '@/features/tresorerie-societe/tresoOrgchartLayout';
import type { TresorerieSchemaSlideSpec, ExportContext } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  addHeader,
  addFooter,
} from '../designSystem/serenity';

// ============================================================================
// CONSTANTS
// ============================================================================

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;
const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  if (!n) return '0 €';
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function fmtAns(n: number | null): string {
  if (n == null) return '—';
  return n === 1 ? '1 an' : `${n} ans`;
}

function hex(color: string): string {
  return color.replace('#', '');
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

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
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

  const totalH = CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.1;
  const chartW = CONTENT_W * 0.58;
  const kpiX = MARGIN_X + chartW + 0.15;
  const kpiW = CONTENT_W - chartW - 0.15;

  const layout = computeTresoOrgchartLayout(spec.orgchartCompany);
  const chartPadding = 0.12;
  const chartScale = Math.min(
    (chartW - chartPadding * 2) / Math.max(1, layout.svgWidth),
    (totalH - chartPadding * 2) / Math.max(1, layout.svgHeight),
  );
  const chartOriginX = MARGIN_X + (chartW - layout.svgWidth * chartScale) / 2;
  const chartOriginY = CONTENT_TOP_Y + (totalH - layout.svgHeight * chartScale) / 2;
  const scaleX = (x: number) => chartOriginX + x * chartScale;
  const scaleY = (y: number) => chartOriginY + y * chartScale;

  slide.addShape('roundRect', {
    x: MARGIN_X,
    y: CONTENT_TOP_Y,
    w: chartW,
    h: totalH,
    fill: { color: hex(theme.panelBg) },
    line: { color: hex(theme.panelBorder), pt: 0.5 },
    rectRadius: 0.08,
  });

  layout.edges.forEach(edge => {
    drawSafeLine(
      slide,
      { x: scaleX(edge.x1), y: scaleY(edge.y1) },
      { x: scaleX(edge.x2), y: scaleY(edge.y2) },
      { color: hex(theme.panelBorder), width: 0.75 },
    );
  });

  layout.labels.forEach(label => {
    const x = scaleX(label.x);
    const y = scaleY(label.y);
    slide.addShape('roundRect', {
      x: x - 0.17,
      y: y - 0.08,
      w: 0.34,
      h: 0.16,
      fill: { color: 'FFFFFF' },
      line: { color: hex(theme.panelBorder), pt: 0.35 },
      rectRadius: 0.03,
    });
    slide.addText(label.text, {
      x: x - 0.17,
      y: y - 0.055,
      w: 0.34,
      h: 0.12,
      fontSize: 5.7,
      fontFace: TYPO.fontFace,
      bold: true,
      align: 'center',
      color: hex(theme.colors.color2),
      fit: 'shrink',
    });
  });

  layout.nodes.forEach(node => {
    const x = scaleX(node.x);
    const y = scaleY(node.y);
    const w = TRESO_ORG_NODE_WIDTH * chartScale;
    const h = TRESO_ORG_NODE_HEIGHT * chartScale;
    const title = node.kind === 'company' ? spec.companyKindLabel ?? node.label : node.label;
    const subtitle = node.kind === 'company'
      ? `${spec.companyKindCode ?? ''} · ${spec.orgchartCompany.legalForm.toUpperCase()}`
      : node.meta ?? '';

    slide.addShape('roundRect', {
      x,
      y,
      w,
      h,
      fill: { color: 'FFFFFF' },
      line: {
        color: node.kind === 'company' ? hex(theme.colors.color3) : hex(theme.panelBorder),
        width: node.kind === 'company' ? 0.9 : 0.65,
      },
      rectRadius: 0.06,
    });
    slide.addText(truncate(title, 24), {
      x: x + 0.04,
      y: y + h * 0.22,
      w: Math.max(0.1, w - 0.08),
      h: h * 0.30,
      fontSize: node.kind === 'company' ? 7.8 : 7.2,
      fontFace: TYPO.fontFace,
      bold: true,
      align: 'center',
      color: hex(theme.textMain),
      fit: 'shrink',
    });
    if (subtitle) {
      slide.addText(truncate(subtitle, 24), {
        x: x + 0.04,
        y: y + h * 0.58,
        w: Math.max(0.1, w - 0.08),
        h: h * 0.24,
        fontSize: 6,
        fontFace: TYPO.fontFace,
        align: 'center',
        color: hex(theme.textBody),
        fit: 'shrink',
      });
    }
  });

  if (!spec.hasAllocationMatrix) {
    slide.addText('Trésorerie conservée sur compte bancaire', {
      x: MARGIN_X + 0.16,
      y: CONTENT_TOP_Y + totalH - 0.30,
      w: chartW - 0.32,
      h: 0.16,
      fontSize: 7,
      fontFace: TYPO.fontFace,
      color: hex(theme.textBody),
      italic: true,
      align: 'center',
      fit: 'shrink',
    });
  }

  // ── KPIs colonne droite ──────────────────────────────────────────────────

  const kpis = [
    { label: 'CCA total constitué', value: euro(spec.ccaTotalConstitue) },
    { label: 'IS total décaissé', value: euro(spec.isTotalDecaisse) },
    ...(spec.isLatentCapi > 0 ? [{ label: 'IS latent (non décaissé)', value: euro(spec.isLatentCapi) }] : []),
    { label: 'Revenus nets à la retraite', value: euro(spec.revenusNetsRetraite) },
    { label: 'Valeur nette société', value: euro(spec.valeurNetteSocieteRetraite) },
    { label: 'Durée remboursement CCA', value: fmtAns(spec.dureeRemboursementCCA) },
  ];

  const kpiH = Math.min(0.38, totalH / kpis.length);
  const altColor = hex(theme.colors.color7);
  const panelColor = hex(theme.panelBg);
  const borderColor = hex(theme.panelBorder);

  kpis.forEach((kpi, idx) => {
    const ky = CONTENT_TOP_Y + idx * (kpiH + 0.04);
    const isAlt = idx % 2 === 1;

    slide.addShape('rect', {
      x: kpiX,
      y: ky,
      w: kpiW,
      h: kpiH,
      fill: { color: isAlt ? altColor : panelColor },
      line: { color: borderColor, pt: 0.5 },
    });

    slide.addText(kpi.label, {
      x: kpiX + 0.08,
      y: ky + 0.04,
      w: kpiW - 0.12,
      h: kpiH * 0.45,
      fontSize: 6.5,
      fontFace: TYPO.fontFace,
      color: hex(theme.textBody),
    });

    slide.addText(kpi.value, {
      x: kpiX + 0.08,
      y: ky + kpiH * 0.46,
      w: kpiW - 0.12,
      h: kpiH * 0.50,
      fontSize: TYPO.sizes.bodySmall,
      fontFace: TYPO.fontFace,
      bold: true,
      color: hex(theme.textMain),
    });
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieSchema;
