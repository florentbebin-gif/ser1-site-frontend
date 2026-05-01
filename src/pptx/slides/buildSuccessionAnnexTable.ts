/**
 * Succession Annexe Table Slide Builder
 *
 * Tableau multi-colonnes : une ligne par bénéficiaire, groupé par étape de décès.
 * Colonnes : Bénéficiaire | Capitaux décès nets | Droits AV 990 I | Droits de succession | Transmission nette à la succession
 * Chaque étape se termine par une ligne de total.
 * Pas de recalcul métier : les données sont construites dans successionDeckBuilder.ts.
 */

import type PptxGenJS from 'pptxgenjs';
import type {
  ExportContext,
  SuccessionAnnexTableSlideSpec,
  SuccessionAnnexBeneficiaryRow,
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

const COL_W: [number, number, number, number, number] = [3.05, 2.10, 1.95, 2.05, 2.35];
const HEADER_LABELS = [
  'Bénéficiaire',
  'Capitaux décès\nnets',
  'Droits AV\n990 I',
  'Droits de\nsuccession',
  'Transmission nette\nà la succession',
];

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

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

function buildBeneficiaryRow(
  b: SuccessionAnnexBeneficiaryRow,
  textMain: string,
  textBody: string,
): PptxGenJS.TableRow {
  const color = b.isTotal ? textMain : textBody;
  const bold = b.isTotal ?? false;
  const base = { fontSize: 9 as const, color, bold };
  return [
    cell(b.label, { ...base, align: 'left' }),
    cell(fmt(b.capitauxDecesNets), { ...base, align: 'right' }),
    cell(fmt(b.droitsAssuranceVie990I), { ...base, align: 'right' }),
    cell(b.exonerated && !b.isTotal ? 'Exonéré' : fmt(b.droitsSuccession), { ...base, align: 'right' }),
    cell(fmt(b.transmissionNetteSuccession), { ...base, align: 'right' }),
  ];
}

export function buildSuccessionAnnexTable(
  pptx: PptxGenJS,
  spec: SuccessionAnnexTableSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const accentFill = roleColor(theme, 'accent');
  const subSectionFill = lightenColor(accentFill, 0.82);
  const textMain = roleColor(theme, 'textMain');
  const textBody = roleColor(theme, 'textBody');
  const white = 'FFFFFF';
  const borderColor = roleColor(theme, 'panelBorder');

  // Ligne d'en-tête colonnes
  const headerRow: PptxGenJS.TableRow = HEADER_LABELS.map((label, i) =>
    cell(label, {
      bold: true,
      fontSize: 9,
      color: white,
      fill: { color: accentFill },
      align: i === 0 ? 'left' : 'right',
    }),
  );

  const tableRows: PptxGenJS.TableRow[] = [headerRow];

  for (const step of spec.steps) {
    // Ligne de section (étape de décès)
    const emptyCell = (fill: string) =>
      cell('', { fill: { color: fill }, fontSize: 9 });
    tableRows.push([
      cell(step.title, {
        bold: true,
        fontSize: 9,
        color: textMain,
        fill: { color: subSectionFill },
        align: 'left',
      }),
      emptyCell(subSectionFill),
      emptyCell(subSectionFill),
      emptyCell(subSectionFill),
      emptyCell(subSectionFill),
    ]);

    // Lignes bénéficiaires + total
    for (const b of step.beneficiaries) {
      tableRows.push(buildBeneficiaryRow(b, textMain, textBody));
    }
  }

  const availableH = CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.1;
  const rowH = Math.min(0.40, Math.max(0.28, availableH / Math.max(tableRows.length, 1)));

  slide.addTable(tableRows, {
    x: COORDS_CONTENT.margin.x,
    y: CONTENT_TOP_Y + 0.05,
    w: COORDS_CONTENT.margin.w,
    colW: COL_W,
    rowH,
    border: { type: 'solid', pt: 0.5, color: borderColor },
    margin: [0.03, 0.1, 0.03, 0.08],
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildSuccessionAnnexTable;
