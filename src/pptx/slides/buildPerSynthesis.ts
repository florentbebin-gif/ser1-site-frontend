/**
 * PER Synthesis Slide Builder (P1-03)
 *
 * Layout: Content slide with KPI summary for PER simulation.
 * Uses Serenity design system coordinates.
 */

import PptxGenJS from 'pptxgenjs';
import type { PerSynthesisSlideSpec, ExportContext } from '../theme/types';
import {
  TYPO,
  addHeader,
  addFooter,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' %';

export function buildPerSynthesis(
  pptx: PptxGenJS,
  spec: PerSynthesisSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, 'Synthèse PER', 'Plan d\'Épargne Retraite — Projection', theme, 'content');

  // KPI row 1: Versement | Durée | TMI
  const kpiY1 = 1.8;
  const kpis1 = [
    { label: 'Versement annuel', value: fmt(spec.versementAnnuel) },
    { label: 'Durée d\'épargne', value: `${spec.dureeAnnees} ans` },
    { label: 'TMI', value: fmtPct(spec.tmi) },
  ];

  kpis1.forEach((kpi, i) => {
    const x = 0.5 + i * 3.1;
    slide.addText(kpi.label, {
      x, y: kpiY1, w: 2.8, h: 0.25,
      fontSize: TYPO.sizes.bodySmall,
      color: theme.textBody,
      align: 'center',
      bold: true,
    });
    slide.addText(kpi.value, {
      x, y: kpiY1 + 0.25, w: 2.8, h: 0.4,
      fontSize: TYPO.sizes.h2,
      color: theme.textMain,
      align: 'center',
      bold: true,
    });
  });

  // KPI row 2: Capital à terme | Économie IR totale | TRI
  const kpiY2 = 2.7;
  const kpis2 = [
    { label: 'Capital à terme', value: fmt(spec.capitalTerme) },
    { label: 'Économie IR totale', value: fmt(spec.economieImpotTotale) },
    { label: 'TRI (avec avantage fiscal)', value: fmtPct(spec.tauxRendementInterne) },
  ];

  kpis2.forEach((kpi, i) => {
    const x = 0.5 + i * 3.1;
    slide.addText(kpi.label, {
      x, y: kpiY2, w: 2.8, h: 0.25,
      fontSize: TYPO.sizes.bodySmall,
      color: theme.textBody,
      align: 'center',
      bold: true,
    });
    slide.addText(kpi.value, {
      x, y: kpiY2 + 0.25, w: 2.8, h: 0.4,
      fontSize: TYPO.sizes.h2,
      color: theme.accent,
      align: 'center',
      bold: true,
    });
  });

  // Sortie comparée : Capital vs Rente
  const tableY = 3.8;
  const headerRow: PptxGenJS.TableRow = [
    { text: 'Mode de sortie', options: { fontSize: 9, bold: true, color: theme.panelBg, fill: { color: theme.accent }, align: 'center' as const, valign: 'middle' as const } },
    { text: 'Montant brut', options: { fontSize: 9, bold: true, color: theme.panelBg, fill: { color: theme.accent }, align: 'center' as const, valign: 'middle' as const } },
    { text: 'Montant net estimé', options: { fontSize: 9, bold: true, color: theme.panelBg, fill: { color: theme.accent }, align: 'center' as const, valign: 'middle' as const } },
  ];

  const dataRows: PptxGenJS.TableRow[] = [
    [
      { text: 'Sortie en capital (100%)', options: { fontSize: 9, color: theme.textBody, align: 'left' as const } },
      { text: fmt(spec.capitalTerme), options: { fontSize: 9, color: theme.textBody, align: 'right' as const } },
      { text: fmt(spec.capitalNetSortie), options: { fontSize: 9, color: theme.textMain, align: 'right' as const, bold: true } },
    ],
    [
      { text: 'Sortie en rente viagère', options: { fontSize: 9, color: theme.textBody, align: 'left' as const } },
      { text: `${fmt(spec.renteAnnuelleEstimee)} /an`, options: { fontSize: 9, color: theme.textBody, align: 'right' as const } },
      { text: `${fmt(spec.renteMensuelleEstimee)} /mois`, options: { fontSize: 9, color: theme.textMain, align: 'right' as const, bold: true } },
    ],
  ];

  slide.addTable([headerRow, ...dataRows], {
    x: 0.8,
    y: tableY,
    w: 8.4,
    colW: [3.0, 2.7, 2.7],
    border: { type: 'solid', pt: 0.5, color: theme.panelBorder },
    rowH: 0.4,
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPerSynthesis;
