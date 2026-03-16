/**
 * Placement Projection Slide Builder
 *
 * Paginated table showing year-by-year projections for épargne or liquidation.
 * Styled identically to credit amortization tables (buildCreditAmortization.ts):
 * - Years in columns, rows = KPI labels
 * - Max 10 years per page
 * - Alternating row colors, header in color1
 */

import type PptxGenJS from 'pptxgenjs';
import type { PlacementProjectionSlideSpec, ExportContext } from '../theme/types';
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
  tableMaxH: CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.10,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function contrastText(bgHex: string): string {
  const clean = bgHex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '000000' : 'FFFFFF';
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
 * Paginate years into chunks of maxPerPage
 */
export function paginateYears(totalYears: number, maxPerPage: number = MAX_YEARS_PER_PAGE): number[][] {
  const pages: number[][] = [];
  for (let i = 0; i < totalYears; i += maxPerPage) {
    const page: number[] = [];
    for (let j = i; j < Math.min(i + maxPerPage, totalYears); j++) {
      page.push(j + 1); // 1-based year numbers
    }
    pages.push(page);
  }
  return pages;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export function buildPlacementProjection(
  pptx: PptxGenJS,
  spec: PlacementProjectionSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  // Header
  const pageIndicator = spec.totalPages > 1 ? ` (${spec.pageIndex + 1}/${spec.totalPages})` : '';
  addHeader(slide, `${spec.title}${pageIndicator}`, spec.subtitle, theme, 'content');

  const numYears = spec.yearsForPage.length;
  const totalDataRows = spec.rows.length;

  // Column widths
  const labelColWidth = 2.2;
  const yearColWidth = (LAYOUT.contentWidth - labelColWidth) / Math.max(numYears, 1);
  const colWidths = [labelColWidth, ...Array(numYears).fill(yearColWidth)];

  // Row height & font sizes (adaptive)
  const calculatedRowH = Math.min(0.25, Math.max(0.18, LAYOUT.tableMaxH / (totalDataRows + 1)));
  const baseFontSize = totalDataRows > 8 ? 7 : (totalDataRows > 5 ? 8 : 9);
  const smallFontSize = Math.max(6, baseFontSize - 1);

  // Colors
  const altRowColor = lightenColor(theme.colors.color7, 0.5);
  const headerFill = theme.colors.color1.replace('#', '');
  const deathFill = theme.colors.color9.replace('#', '');
  const deathLightFill = lightenColor(theme.colors.color9, 0.75);
  const deathTextColor = contrastText(deathFill);

  // Build table rows
  const tableRows: PptxGenJS.TableRow[] = [];

  // Header row (years)
  tableRows.push([
    {
      text: spec.productLabel,
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
    ...spec.yearsForPage.map(year => {
      const isDeath = spec.deathYearIndex !== undefined && year === spec.deathYearIndex;
      return {
        text: isDeath ? `An ${year} †` : `An ${year}`,
        options: {
          fill: { color: isDeath ? deathFill : headerFill },
          color: isDeath ? deathTextColor : 'FFFFFF',
          bold: true,
          fontSize: baseFontSize,
          fontFace: TYPO.fontFace,
          align: 'center' as const,
          valign: 'middle' as const,
        },
      };
    }),
  ]);

  // Data rows
  spec.rows.forEach((row, idx) => {
    const isAlt = idx % 2 === 1;
    const fill = isAlt ? altRowColor : 'FFFFFF';

    // Find values for the years on this page
    const values = spec.yearsForPage.map(year => {
      const valueIdx = year - 1; // yearsForPage is 1-based
      return valueIdx < row.values.length ? euro(row.values[valueIdx]) : '—';
    });

    tableRows.push([
      {
        text: row.label,
        options: {
          fill: { color: fill },
          color: theme.textMain.replace('#', ''),
          bold: false,
          fontSize: smallFontSize,
          fontFace: TYPO.fontFace,
          align: 'left' as const,
          valign: 'middle' as const,
        },
      },
      ...values.map((val, colIdx) => {
        const year = spec.yearsForPage[colIdx];
        const isDeath = spec.deathYearIndex !== undefined && year === spec.deathYearIndex;
        return {
          text: val,
          options: {
            fill: { color: isDeath ? deathLightFill : fill },
            color: theme.textBody.replace('#', ''),
            fontSize: smallFontSize,
            fontFace: TYPO.fontFace,
            align: 'right' as const,
            valign: 'middle' as const,
          },
        };
      }),
    ]);
  });

  // Add table
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

  // Footer
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPlacementProjection;
