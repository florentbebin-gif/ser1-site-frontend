/**
 * Placement Synthesis Slide Builder
 *
 * Layout: 2-product comparison table (7 KPI rows)
 * Uses Serenity design system coordinates.
 */

import type PptxGenJS from 'pptxgenjs';
import type { PlacementSynthesisSlideSpec, PlacementProductKpis, ExportContext } from '../theme/types';
import {
  TYPO,
  addHeader,
  addFooter,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const ROWS: Array<{ label: string; key: keyof PlacementProductKpis; isHighlight?: boolean }> = [
  { label: 'Enveloppe', key: 'envelopeLabel' },
  { label: 'Capital acquis (épargne)', key: 'capitalAcquis' },
  { label: 'Effort réel total', key: 'effortReel' },
  { label: 'Revenus nets (liquidation)', key: 'revenusNetsLiquidation' },
  { label: 'Fiscalité totale', key: 'fiscaliteTotale' },
  { label: 'Capital transmis net', key: 'capitalTransmisNet' },
  { label: 'Net global', key: 'revenusNetsTotal', isHighlight: true },
];

function formatValue(key: keyof PlacementProductKpis, value: string | number): string {
  if (key === 'envelopeLabel') return String(value);
  return fmt(Number(value));
}

export function buildPlacementSynthesis(
  pptx: PptxGenJS,
  spec: PlacementSynthesisSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, 'Synthèse Placement', 'Comparaison des deux produits', theme, 'content');

  const tableY = 1.8;

  const headerRow: PptxGenJS.TableRow = [
    { text: 'Indicateur', options: { fontSize: 8, bold: true, color: theme.panelBg, fill: { color: theme.accent }, align: 'left' as const, valign: 'middle' as const } },
    { text: spec.produit1.envelopeLabel, options: { fontSize: 8, bold: true, color: theme.panelBg, fill: { color: theme.accent }, align: 'center' as const, valign: 'middle' as const } },
    { text: spec.produit2.envelopeLabel, options: { fontSize: 8, bold: true, color: theme.panelBg, fill: { color: theme.accent }, align: 'center' as const, valign: 'middle' as const } },
  ];

  const dataRows: PptxGenJS.TableRow[] = ROWS.map((row) => {
    const v1 = formatValue(row.key, spec.produit1[row.key]);
    const v2 = formatValue(row.key, spec.produit2[row.key]);
    const textColor = row.isHighlight ? theme.textMain : theme.textBody;
    const bold = row.isHighlight;
    const fontSize = row.isHighlight ? TYPO.sizes.bodySmall + 1 : 8;

    return [
      { text: row.label, options: { fontSize, bold, color: textColor, align: 'left' as const } },
      { text: v1, options: { fontSize, bold, color: textColor, align: 'right' as const } },
      { text: v2, options: { fontSize, bold, color: textColor, align: 'right' as const } },
    ];
  });

  slide.addTable([headerRow, ...dataRows], {
    x: 1.5,
    y: tableY,
    w: 9.0,
    colW: [3.5, 2.75, 2.75],
    border: { type: 'solid', pt: 0.5, color: theme.panelBorder },
    rowH: 0.42,
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPlacementSynthesis;
