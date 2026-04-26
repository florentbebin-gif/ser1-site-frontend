import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, PerProjectionRow, PerProjectionTableSlideSpec, PerSimulationRow } from '../theme/types';
import {
  RADIUS,
  TYPO,
  addCardPanelWithShadow,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const GEO = {
  panelX: 2.16,
  panelY: 2.42,
  panelW: 9.0,
  panelH: 4.45,
  rowH: 0.26,
  sectionH: 0.30,
} as const;

function euro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function displayValue(value: number | string | boolean | undefined): string {
  if (typeof value === 'number') return euro(value);
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return value ?? '—';
}

function drawSectionHeader(
  slide: PptxGenJS.Slide,
  label: string,
  y: number,
  ctx: ExportContext,
): void {
  const { theme } = ctx;
  slide.addShape('roundRect', {
    x: GEO.panelX + 0.24,
    y,
    w: GEO.panelW - 0.48,
    h: GEO.sectionH,
    rectRadius: RADIUS.panel,
    fill: { color: roleColor(theme, 'accent'), transparency: 82 },
    line: { color: roleColor(theme, 'accent'), transparency: 100 },
  });
  addTextFr(slide, label, {
    x: GEO.panelX + 0.40,
    y: y + 0.04,
    w: GEO.panelW - 0.80,
    h: 0.20,
    fontSize: 9,
    color: roleColor(theme, 'textMain'),
    bold: true,
    align: 'left',
    valign: 'middle',
  });
}

function drawRows(
  slide: PptxGenJS.Slide,
  rows: PerProjectionRow[],
  yStart: number,
  isCouple: boolean,
  ctx: ExportContext,
): number {
  const { theme } = ctx;
  const labelW = isCouple ? 4.20 : 5.95;
  const valueW = isCouple ? 1.80 : 2.20;
  const d1X = GEO.panelX + 0.52 + labelW;
  const d2X = d1X + valueW + 0.35;

  if (isCouple) {
    addTextFr(slide, 'D1', {
      x: d1X,
      y: yStart - 0.20,
      w: valueW,
      h: 0.16,
      fontSize: 8,
      color: roleColor(theme, 'textBody'),
      bold: true,
      align: 'right',
    });
    addTextFr(slide, 'D2', {
      x: d2X,
      y: yStart - 0.20,
      w: valueW,
      h: 0.16,
      fontSize: 8,
      color: roleColor(theme, 'textBody'),
      bold: true,
      align: 'right',
    });
  }

  rows.forEach((row, index) => {
    const y = yStart + index * GEO.rowH;
    if (index % 2 === 1) {
      slide.addShape('rect', {
        x: GEO.panelX + 0.30,
        y: y + 0.02,
        w: GEO.panelW - 0.60,
        h: GEO.rowH - 0.04,
        fill: { color: roleColor(theme, 'panelBorder'), transparency: 76 },
        line: { color: roleColor(theme, 'panelBorder'), transparency: 100 },
      });
    }
    addTextFr(slide, row.label, {
      x: GEO.panelX + 0.52,
      y: y + 0.05,
      w: labelW,
      h: 0.18,
      fontSize: 8.5,
      color: roleColor(theme, 'textBody'),
      valign: 'middle',
    });
    addTextFr(slide, displayValue(row.declarant1), {
      x: d1X,
      y: y + 0.05,
      w: valueW,
      h: 0.18,
      fontSize: 9,
      color: roleColor(theme, 'textMain'),
      bold: true,
      align: 'right',
      valign: 'middle',
    });
    if (isCouple) {
      addTextFr(slide, displayValue(row.declarant2), {
        x: d2X,
        y: y + 0.05,
        w: valueW,
        h: 0.18,
        fontSize: 9,
        color: roleColor(theme, 'textMain'),
        bold: true,
        align: 'right',
        valign: 'middle',
      });
    }
  });

  return yStart + rows.length * GEO.rowH;
}

function drawSimulationRows(
  slide: PptxGenJS.Slide,
  rows: PerSimulationRow[],
  yStart: number,
  ctx: ExportContext,
): number {
  const convertedRows: PerProjectionRow[] = rows.map((row) => ({
    label: row.label,
    declarant1: row.value,
  }));
  return drawRows(slide, convertedRows, yStart, false, ctx);
}

export function buildPerProjectionTable(
  pptx: PptxGenJS,
  spec: PerProjectionTableSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content', 21, TYPO.sizes.h2);
  addCardPanelWithShadow(slide, { x: GEO.panelX, y: GEO.panelY, w: GEO.panelW, h: GEO.panelH }, theme);

  let y = GEO.panelY + 0.35;
  drawSectionHeader(slide, 'Cases 2042 à reporter', y, ctx);
  y = drawRows(slide, spec.declarationRows, y + GEO.sectionH + 0.22, spec.isCouple, ctx) + 0.22;

  drawSectionHeader(slide, "Projection du prochain avis d'impôt", y, ctx);
  y = drawRows(slide, spec.avisRows, y + GEO.sectionH + 0.22, spec.isCouple, ctx) + 0.22;

  if (spec.simulationRows && spec.simulationRows.length > 0 && y < GEO.panelY + GEO.panelH - 0.72) {
    drawSectionHeader(slide, 'Impact du versement envisagé', y, ctx);
    drawSimulationRows(slide, spec.simulationRows, y + GEO.sectionH + 0.20, ctx);
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPerProjectionTable;
