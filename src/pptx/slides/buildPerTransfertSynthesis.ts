import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, PerTransfertSynthesisSlideSpec } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  SLIDE_SIZE,
  TYPO,
  addFooter,
  addHeader,
  addTextFr,
} from '../designSystem/serenity';

const TABLE_X = 0.78;
const TABLE_Y = 1.75;
const ROW_H = 0.42;
const COLS = [2.7, 2.75, 2.75, 2.75];

function columnX(index: number): number {
  return TABLE_X + COLS.slice(0, index).reduce((sum, width) => sum + width, 0);
}

export function buildPerTransfertSynthesis(
  pptx: PptxGenJS,
  spec: PerTransfertSynthesisSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const headers = ['Indicateur', 'Conserver', 'Transférer', 'Différence'];
  headers.forEach((header, index) => {
    slide.addShape('rect', {
      x: columnX(index),
      y: TABLE_Y,
      w: COLS[index],
      h: ROW_H,
      fill: { color: theme.colors.color1.replace('#', '') },
      line: { color: theme.panelBorder.replace('#', ''), width: 0.5 },
    });
    addTextFr(slide, header, {
      x: columnX(index) + 0.08,
      y: TABLE_Y + 0.09,
      w: COLS[index] - 0.16,
      h: 0.24,
      fontSize: 8.5,
      fontFace: TYPO.fontFace,
      bold: true,
      color: theme.white.replace('#', ''),
      valign: 'middle',
    });
  });

  spec.rows.slice(0, 10).forEach((row, rowIndex) => {
    const y = TABLE_Y + ROW_H * (rowIndex + 1);
    const fillColor = rowIndex % 2 === 0 ? theme.colors.color7 : theme.panelBg;
    [row.label, row.keepScenario, row.transferScenario, row.difference].forEach((value, colIndex) => {
      slide.addShape('rect', {
        x: columnX(colIndex),
        y,
        w: COLS[colIndex],
        h: ROW_H,
        fill: { color: fillColor.replace('#', '') },
        line: { color: theme.panelBorder.replace('#', ''), width: 0.35 },
      });
      addTextFr(slide, value, {
        x: columnX(colIndex) + 0.08,
        y: y + 0.08,
        w: COLS[colIndex] - 0.16,
        h: 0.26,
        fontSize: colIndex === 0 ? 8 : 8.5,
        fontFace: TYPO.fontFace,
        bold: colIndex !== 0,
        color: (colIndex === 0 ? theme.textBody : theme.textMain).replace('#', ''),
        valign: 'middle',
      });
    });
  });

  if (spec.legalNote) {
    addTextFr(slide, spec.legalNote, {
      x: TABLE_X,
      y: SLIDE_SIZE.height - 0.98,
      w: SLIDE_SIZE.width - TABLE_X * 2,
      h: 0.28,
      fontSize: 7.2,
      fontFace: TYPO.fontFace,
      color: theme.textBody.replace('#', ''),
      fit: 'shrink',
    });
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
}
