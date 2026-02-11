/**
 * Succession Synthesis Slide Builder (P1-02)
 *
 * Layout: Content slide with KPI summary + héritiers table
 * Uses Serenity design system coordinates.
 */

import PptxGenJS from 'pptxgenjs';
import type { SuccessionSynthesisSlideSpec, ExportContext } from '../theme/types';
import {
  TYPO,
  addHeader,
  addFooter,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const LIEN_LABELS: Record<string, string> = {
  conjoint: 'Conjoint',
  enfant: 'Enfant',
  petit_enfant: 'Petit-enfant',
  frere_soeur: 'Frère / Sœur',
  neveu_niece: 'Neveu / Nièce',
  autre: 'Autre',
};

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' %';

export function buildSuccessionSynthesis(
  pptx: PptxGenJS,
  spec: SuccessionSynthesisSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, 'Synthèse Succession', 'Estimation des droits de mutation', theme, 'content');

  // KPI row: Actif net | Total droits | Taux moyen
  const kpiY = 1.8;
  const kpiH = 0.7;
  const kpis = [
    { label: 'Actif net successoral', value: fmt(spec.actifNetSuccession) },
    { label: 'Total droits', value: fmt(spec.totalDroits) },
    { label: 'Taux moyen global', value: fmtPct(spec.tauxMoyenGlobal) },
  ];

  kpis.forEach((kpi, i) => {
    const x = 0.5 + i * 3.1;
    slide.addText(kpi.label, {
      x, y: kpiY, w: 2.8, h: 0.3,
      fontSize: TYPO.sizes.bodySmall,
      color: theme.textBody,
      align: 'center',
      bold: true,
    });
    slide.addText(kpi.value, {
      x, y: kpiY + 0.3, w: 2.8, h: kpiH - 0.3,
      fontSize: TYPO.sizes.h2,
      color: theme.textMain,
      align: 'center',
      bold: true,
    });
  });

  // Héritiers table
  const tableY = 2.8;
  const headers = ['Héritier', 'Part brute', 'Abattement', 'Base imposable', 'Droits', 'Taux moyen'];
  const headerRow: PptxGenJS.TableRow = headers.map((h) => ({
    text: h,
    options: {
      fontSize: 8,
      bold: true,
      color: theme.panelBg,
      fill: { color: theme.accent },
      align: 'center' as const,
      valign: 'middle' as const,
    },
  }));

  const dataRows: PptxGenJS.TableRow[] = spec.heritiers.map((h) => [
    { text: LIEN_LABELS[h.lien] ?? h.lien, options: { fontSize: 8, color: theme.textBody, align: 'left' as const } },
    { text: fmt(h.partBrute), options: { fontSize: 8, color: theme.textBody, align: 'right' as const } },
    { text: fmt(h.abattement), options: { fontSize: 8, color: theme.textBody, align: 'right' as const } },
    { text: fmt(h.baseImposable), options: { fontSize: 8, color: theme.textBody, align: 'right' as const } },
    { text: fmt(h.droits), options: { fontSize: 8, color: theme.textMain, align: 'right' as const, bold: true } },
    { text: fmtPct(h.tauxMoyen), options: { fontSize: 8, color: theme.textBody, align: 'right' as const } },
  ]);

  slide.addTable([headerRow, ...dataRows], {
    x: 0.4,
    y: tableY,
    w: 9.2,
    colW: [1.6, 1.5, 1.5, 1.6, 1.5, 1.5],
    border: { type: 'solid', pt: 0.5, color: theme.panelBorder },
    rowH: 0.35,
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildSuccessionSynthesis;
