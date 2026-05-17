/**
 * buildTresorerieProjection.ts — Slide projection annuelle Trésorerie Société IS
 *
 * Tableau paginé : années en colonnes, indicateurs en lignes.
 * Max 10 années par page (même pattern que buildPlacementProjection.ts).
 * Colonne retraite mise en évidence si retraiteYearIndex fourni.
 */

import type PptxGenJS from 'pptxgenjs';
import type { TresorerieProjectionSlideSpec, ExportContext } from '../theme/types';
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

const MAX_YEARS_PER_PAGE = 10;

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15;

const LAYOUT = {
  marginX: COORDS_CONTENT.margin.x,
  contentWidth: COORDS_CONTENT.margin.w,
  tableY: CONTENT_TOP_Y + 0.05,
  tableMaxH: CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.1,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function lightenColor(hex: string, factor: number): string {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `${toHex(Math.round(r + (255 - r) * factor))}${toHex(Math.round(g + (255 - g) * factor))}${toHex(Math.round(b + (255 - b) * factor))}`;
}

/**
 * Pagine les années (1-based) en tranches de maxPerPage.
 */
export function paginateTresoYears(
  totalYears: number,
  maxPerPage: number = MAX_YEARS_PER_PAGE,
): number[][] {
  const pages: number[][] = [];
  for (let i = 0; i < totalYears; i += maxPerPage) {
    const page: number[] = [];
    for (let j = i; j < Math.min(i + maxPerPage, totalYears); j++) {
      page.push(j + 1);
    }
    pages.push(page);
  }
  return pages;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export function buildTresorerieProjection(
  pptx: PptxGenJS,
  spec: TresorerieProjectionSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  const pageIndicator = spec.totalPages > 1 ? ` (${spec.pageIndex + 1}/${spec.totalPages})` : '';
  addHeader(slide, `${spec.title}${pageIndicator}`, spec.subtitle, theme, 'content');

  const numYears = spec.yearsForPage.length;
  const totalDataRows = spec.rows.length;

  const labelColWidth = 2.6;
  const yearColWidth = (LAYOUT.contentWidth - labelColWidth) / Math.max(numYears, 1);
  const colWidths = [labelColWidth, ...Array(numYears).fill(yearColWidth)];

  const calculatedRowH = Math.min(0.28, Math.max(0.2, LAYOUT.tableMaxH / (totalDataRows + 1)));
  const baseFontSize = totalDataRows > 12 ? 8 : totalDataRows > 8 ? 9 : 10;
  const smallFontSize = Math.max(8, baseFontSize - 1);

  const altRowColor = lightenColor(theme.colors.color7, 0.55);
  const headerFill = theme.colors.color3.replace('#', '');
  const totalRowFill = theme.colors.color5.replace('#', '');
  const retraiteColor = lightenColor(theme.colors.color6, 0.45);

  const retraiteYearSet = new Set(spec.retraiteYearIndex != null ? [spec.retraiteYearIndex] : []);

  const totalRowKeywords = ['consolid', 'fin d'];

  // Ligne d'en-tête : années civiles (YYYY)
  const tableRows: PptxGenJS.TableRow[] = [];
  tableRows.push([
    {
      text: 'Indicateur',
      options: {
        fill: { color: headerFill },
        color: 'FFFFFF',
        bold: true,
        fontSize: baseFontSize,
        fontFace: TYPO.fontFace,
        align: 'left' as const,
        valign: 'middle' as const,
      },
    },
    ...spec.yearsForPage.map((year) => {
      const civilYear = spec.projectionStartYear + year - 1;
      return {
        text: `${civilYear}`,
        options: {
          fill: { color: headerFill },
          color: 'FFFFFF',
          bold: true,
          fontSize: baseFontSize,
          fontFace: TYPO.fontFace,
          align: 'center' as const,
          valign: 'middle' as const,
        },
      };
    }),
  ]);

  // Lignes de données
  spec.rows.forEach((row, idx) => {
    const labelLower = row.label.toLowerCase();
    const isTotal = totalRowKeywords.some((keyword) => labelLower.includes(keyword));
    const isAlt = !isTotal && idx % 2 === 1;
    const baseFill = isTotal ? totalRowFill : isAlt ? altRowColor : 'FFFFFF';
    const labelColor = isTotal ? 'FFFFFF' : theme.textMain.replace('#', '');
    const valueColor = isTotal ? 'FFFFFF' : theme.textBody.replace('#', '');

    const values = spec.yearsForPage.map((year) => {
      const valueIdx = year - 1;
      const value = row.values[valueIdx];
      return value !== undefined ? euro(value) : '—';
    });

    tableRows.push([
      {
        text: row.label,
        options: {
          fill: { color: baseFill },
          color: labelColor,
          bold: isTotal,
          fontSize: smallFontSize,
          fontFace: TYPO.fontFace,
          align: 'left' as const,
          valign: 'middle' as const,
        },
      },
      ...values.map((val, colIdx) => {
        const year = spec.yearsForPage[colIdx] ?? 0;
        const isRetraite = retraiteYearSet.has(year);
        const cellFill = isTotal ? totalRowFill : isRetraite ? retraiteColor : baseFill;
        return {
          text: val,
          options: {
            fill: { color: cellFill },
            color: valueColor,
            bold: isTotal,
            fontSize: smallFontSize,
            fontFace: TYPO.fontFace,
            align: 'right' as const,
            valign: 'middle' as const,
          },
        };
      }),
    ]);
  });

  slide.addTable(tableRows, {
    x: LAYOUT.marginX,
    y: LAYOUT.tableY,
    w: LAYOUT.contentWidth,
    colW: colWidths,
    rowH: calculatedRowH,
    border: {
      type: 'solid',
      color: theme.colors.color8.replace('#', ''),
      pt: 0.5,
    },
    margin: [0.03, 0.05, 0.03, 0.05],
  });

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieProjection;
