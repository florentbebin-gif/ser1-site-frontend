/**
 * Succession Chronology Slide Builder
 *
 * Deux cartes côte à côte (ou une seule) représentant les étapes de décès simulées.
 */

import type PptxGenJS from 'pptxgenjs';
import type {
  ExportContext,
  SuccessionChronologySlideSpec,
  SuccessionChronologyStepSummary,
} from '../theme/types';
import {
  TYPO,
  addCardPanelWithShadow,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const GEO = {
  panelY: 2.42,
  panelH: 3.50,
  leftX: 0.92,
  rightX: 6.86,
  panelW: 5.55,
  singleX: 2.10,
  singleW: 9.10,
  totalY: 6.18,
  notesY: 6.56,
} as const;

function drawStepCard(
  slide: PptxGenJS.Slide,
  step: SuccessionChronologyStepSummary,
  rect: { x: number; y: number; w: number; h: number },
  ctx: ExportContext,
): void {
  const { theme } = ctx;
  addCardPanelWithShadow(slide, rect, theme);
  addTextFr(slide, step.title, {
    x: rect.x + 0.28,
    y: rect.y + 0.24,
    w: rect.w - 0.56,
    h: 0.28,
    fontSize: 13,
    color: roleColor(theme, 'textMain'),
    bold: true,
  });
  addTextFr(slide, step.subtitle, {
    x: rect.x + 0.28,
    y: rect.y + 0.56,
    w: rect.w - 0.56,
    h: 0.22,
    fontSize: 9,
    color: roleColor(theme, 'textBody'),
  });

  const rows: [string, string][] = [
    ['Masse transmise', step.masseTransmise],
    ['Part conjoint / partenaire', step.partConjoint],
    ['Autres bénéficiaires', step.autresBeneficiaires],
    ['Droits de succession', step.droitsSuccession],
    ...(step.droitsHorsSuccession ? [['Droits hors succession', step.droitsHorsSuccession] as [string, string]] : []),
  ];

  rows.forEach(([label, value], index) => {
    const y = rect.y + 1.02 + index * 0.34;
    addTextFr(slide, label, {
      x: rect.x + 0.30,
      y,
      w: 2.65,
      h: 0.20,
      fontSize: 8.5,
      color: roleColor(theme, 'textBody'),
    });
    addTextFr(slide, value, {
      x: rect.x + rect.w - 2.45,
      y,
      w: 2.12,
      h: 0.20,
      fontSize: 9,
      color: roleColor(theme, 'textMain'),
      bold: true,
      align: 'right',
    });
  });

  const startY = rect.y + 2.86;
  step.beneficiaries.slice(0, 3).forEach((beneficiary, index) => {
    const y = startY + index * 0.22;
    addTextFr(slide, `${beneficiary.label} · droits ${beneficiary.tax}`, {
      x: rect.x + 0.30,
      y,
      w: rect.w - 0.60,
      h: 0.18,
      fontSize: 7.5,
      color: roleColor(theme, 'textBody'),
    });
  });
}

export function buildSuccessionChronology(
  pptx: PptxGenJS,
  spec: SuccessionChronologySlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  addHeader(slide, spec.title, spec.subtitle, ctx.theme, 'content', 22, TYPO.sizes.h2);

  if (spec.applicable && spec.steps.length >= 2) {
    drawStepCard(slide, spec.steps[0], { x: GEO.leftX, y: GEO.panelY, w: GEO.panelW, h: GEO.panelH }, ctx);
    drawStepCard(slide, spec.steps[1], { x: GEO.rightX, y: GEO.panelY, w: GEO.panelW, h: GEO.panelH }, ctx);
  } else {
    const fallbackStep: SuccessionChronologyStepSummary = spec.steps[0] ?? {
      title: 'Succession directe',
      subtitle: spec.orderLabel,
      masseTransmise: '—',
      partConjoint: '—',
      autresBeneficiaires: '—',
      droitsSuccession: spec.totalDroits,
      beneficiaries: [],
    };
    drawStepCard(slide, fallbackStep, { x: GEO.singleX, y: GEO.panelY, w: GEO.singleW, h: GEO.panelH }, ctx);
  }

  addTextFr(slide, `Total cumulé des droits : ${spec.totalDroits}`, {
    x: 0.92,
    y: GEO.totalY,
    w: 11.5,
    h: 0.28,
    fontSize: 13,
    color: roleColor(ctx.theme, 'textMain'),
    bold: true,
    align: 'center',
  });

  if (spec.notes.length > 0) {
    addTextFr(slide, spec.notes.slice(0, 2).join(' · '), {
      x: 0.92,
      y: GEO.notesY,
      w: 11.5,
      h: 0.26,
      fontSize: 8.5,
      color: roleColor(ctx.theme, 'textBody'),
      italic: true,
      align: 'center',
    });
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildSuccessionChronology;
