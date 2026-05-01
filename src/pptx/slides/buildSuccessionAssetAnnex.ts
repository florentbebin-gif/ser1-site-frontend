import type PptxGenJS from 'pptxgenjs';
import type {
  ExportContext,
  SuccessionAssetAnnexRow,
  SuccessionAssetAnnexSlideSpec,
} from '../theme/types';
import {
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  addFooter,
  addHeader,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;
const LABEL_COL_W = 4.25;

const fmt = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

function lightenColor(hex: string, factor: number): string {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

function cell(
  text: string,
  options: PptxGenJS.TableCellProps,
): PptxGenJS.TableCell {
  return { text, options: { fontFace: TYPO.fontFace, valign: 'middle', ...options } };
}

function buildRow(
  row: SuccessionAssetAnnexRow,
  textBody: string,
): PptxGenJS.TableRow {
  const base = { fontSize: 8.5 as const, color: textBody };
  return [
    cell(row.label, { ...base, align: 'left' }),
    ...row.values.map((value) => cell(value > 0 ? fmt(value) : '—', { ...base, align: 'right' })),
  ];
}

export function buildSuccessionAssetAnnex(
  pptx: PptxGenJS,
  spec: SuccessionAssetAnnexSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const accentFill = roleColor(theme, 'accent');
  const textBody = roleColor(theme, 'textBody');
  const white = 'FFFFFF';
  const borderColor = roleColor(theme, 'panelBorder');
  const sectionFill = lightenColor(accentFill, 0.84);

  const valueColCount = Math.max(spec.columns.length, 1);
  const remainingWidth = Math.max(COORDS_CONTENT.margin.w - LABEL_COL_W, valueColCount * 1.2);
  const valueColWidth = remainingWidth / valueColCount;
  const colW = [LABEL_COL_W, ...spec.columns.map(() => valueColWidth)];

  const headerRow: PptxGenJS.TableRow = [
    cell('Actif saisi', {
      bold: true,
      fontSize: 9,
      color: white,
      fill: { color: accentFill },
      align: 'left',
    }),
    ...spec.columns.map((column) => cell(column.label, {
      bold: true,
      fontSize: 9,
      color: white,
      fill: { color: accentFill },
      align: 'right',
    })),
  ];

  const introRow: PptxGenJS.TableRow = [
    cell('Ventilation des actifs détaillés', {
      bold: true,
      fontSize: 8.5,
      color: roleColor(theme, 'textMain'),
      fill: { color: sectionFill },
      align: 'left',
    }),
    ...spec.columns.map(() => cell('', {
      fontSize: 8.5,
      fill: { color: sectionFill },
    })),
  ];

  const tableRows: PptxGenJS.TableRow[] = [
    headerRow,
    introRow,
    ...spec.rows.map((row) => buildRow(row, textBody)),
  ];

  const availableH = CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.1;
  const rowH = Math.min(0.34, Math.max(0.24, availableH / Math.max(tableRows.length, 1)));

  slide.addTable(tableRows, {
    x: COORDS_CONTENT.margin.x,
    y: CONTENT_TOP_Y + 0.05,
    w: COORDS_CONTENT.margin.w,
    colW,
    rowH,
    border: { type: 'solid', pt: 0.5, color: borderColor },
    margin: [0.03, 0.1, 0.03, 0.08],
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildSuccessionAssetAnnex;
