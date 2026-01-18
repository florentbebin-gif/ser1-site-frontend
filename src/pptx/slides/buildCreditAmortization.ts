/**
 * Credit Amortization Slide Builder (Slides 6+)
 * 
 * Table with YEARS in COLUMNS (horizontal orientation) for easy column reading.
 * Automatic pagination: max 8 year columns per slide.
 * 
 * Rows (metrics):
 * - Annuité (hors assurance)
 * - Intérêts
 * - Assurance
 * - Capital amorti
 * - CRD fin d'année
 * 
 * Design: White background, premium table styling, no hardcoded colors except white.
 * 
 * IMPORTANT: Uses standard SER1 template (title, subtitle, accent line, footer)
 * All visual elements MUST stay within CONTENT_ZONE (below subtitle, above footer)
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles, ExportContext, CreditAmortizationRow } from '../theme/types';
import {
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  addTextBox,
  addAccentLine,
  addFooter,
} from '../designSystem/serenity';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_YEARS_PER_SLIDE = 8;

const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

const LAYOUT = {
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  tableY: CONTENT_TOP_Y + 0.10,
  tableMaxH: CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.20,
} as const;

// Row labels (metrics shown in rows)
const ROW_LABELS = [
  'Annuité (hors ass.)',
  'Intérêts',
  'Assurance',
  'Capital amorti',
  'CRD fin d\'année',
];

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

/**
 * Paginate amortization rows into chunks of MAX_YEARS_PER_SLIDE
 */
export function paginateAmortizationRows(
  rows: CreditAmortizationRow[]
): CreditAmortizationRow[][] {
  const pages: CreditAmortizationRow[][] = [];
  for (let i = 0; i < rows.length; i += MAX_YEARS_PER_SLIDE) {
    pages.push(rows.slice(i, i + MAX_YEARS_PER_SLIDE));
  }
  return pages;
}

/**
 * Get lighter shade of a color (for alternating rows)
 */
function lightenColor(hex: string, factor: number = 0.85): string {
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

// ============================================================================
// MAIN BUILDER
// ============================================================================

export interface CreditAmortizationSlideData {
  rows: CreditAmortizationRow[];
  pageIndex: number;
  totalPages: number;
}

/**
 * Build Credit Amortization slide (paginated table, years in columns)
 */
export function buildCreditAmortization(
  pptx: PptxGenJS,
  data: CreditAmortizationSlideData,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  
  // White background
  slide.background = { color: 'FFFFFF' };
  
  // ========== STANDARD HEADER (from design system) ==========
  
  // Title with page indicator
  const pageIndicator = data.totalPages > 1 
    ? ` (${data.pageIndex + 1}/${data.totalPages})`
    : '';
  
  addTextBox(slide, `Tableau d'amortissement${pageIndicator}`, COORDS_CONTENT.title, {
    fontSize: TYPO.sizes.h1,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Accent line under title
  addAccentLine(slide, theme, 'content');
  
  // Subtitle
  addTextBox(slide, 'Échéancier annuel de remboursement', COORDS_CONTENT.subtitle, {
    fontSize: TYPO.sizes.h2,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
  });
  
  // ========== TABLE (years in columns) ==========
  
  // Build table data: rows = metrics, columns = years
  // First column = metric label, then one column per year
  
  const numYears = data.rows.length;
  const numCols = numYears + 1; // +1 for label column
  
  // Calculate column widths
  const labelColWidth = 1.8;
  const yearColWidth = (LAYOUT.contentWidth - labelColWidth) / numYears;
  const colWidths = [labelColWidth, ...Array(numYears).fill(yearColWidth)];
  
  // Build header row (empty + year labels)
  const headerRow: PptxGenJS.TableCell[] = [
    { 
      text: '', 
      options: { 
        fill: { color: theme.colors.color1.replace('#', '') },
        color: 'FFFFFF',
        bold: true,
        fontSize: 9,
        fontFace: TYPO.fontFace,
        align: 'center' as const,
        valign: 'middle' as const,
      } 
    },
    ...data.rows.map(row => ({
      text: row.periode,
      options: {
        fill: { color: theme.colors.color1.replace('#', '') },
        color: 'FFFFFF',
        bold: true,
        fontSize: 9,
        fontFace: TYPO.fontFace,
        align: 'center' as const,
        valign: 'middle' as const,
      },
    })),
  ];
  
  // Build data rows (one per metric)
  const altRowColor = lightenColor(theme.colors.color7, 0.5);
  
  const buildDataRow = (
    label: string, 
    values: string[], 
    rowIndex: number
  ): PptxGenJS.TableCell[] => {
    const isAlt = rowIndex % 2 === 1;
    const rowFill = isAlt ? altRowColor : 'FFFFFF';
    
    return [
      {
        text: label,
        options: {
          fill: { color: rowFill },
          color: theme.textMain.replace('#', ''),
          bold: true,
          fontSize: 9,
          fontFace: TYPO.fontFace,
          align: 'left' as const,
          valign: 'middle' as const,
        },
      },
      ...values.map(val => ({
        text: val,
        options: {
          fill: { color: rowFill },
          color: theme.textBody.replace('#', ''),
          fontSize: 9,
          fontFace: TYPO.fontFace,
          align: 'right' as const,
          valign: 'middle' as const,
        },
      })),
    ];
  };
  
  // Extract values for each metric
  const annuiteValues = data.rows.map(r => euro(r.annuite));
  const interetValues = data.rows.map(r => euro(r.interet));
  const assuranceValues = data.rows.map(r => euro(r.assurance));
  const amortValues = data.rows.map(r => euro(r.amort));
  const crdValues = data.rows.map(r => euro(r.crd));
  
  const tableRows: PptxGenJS.TableRow[] = [
    headerRow,
    buildDataRow(ROW_LABELS[0], annuiteValues, 0),
    buildDataRow(ROW_LABELS[1], interetValues, 1),
    buildDataRow(ROW_LABELS[2], assuranceValues, 2),
    buildDataRow(ROW_LABELS[3], amortValues, 3),
    buildDataRow(ROW_LABELS[4], crdValues, 4),
  ];
  
  // Add table
  slide.addTable(tableRows, {
    x: LAYOUT.marginX,
    y: LAYOUT.tableY,
    w: LAYOUT.contentWidth,
    colW: colWidths,
    rowH: 0.38,
    border: { 
      type: 'solid', 
      color: theme.colors.color8.replace('#', ''), 
      pt: 0.5 
    },
    margin: [0.05, 0.08, 0.05, 0.08],
  });
  
  // ========== STANDARD FOOTER (from design system) ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

/**
 * Build ALL amortization slides (with automatic pagination)
 * Returns the number of slides created
 */
export function buildAllCreditAmortizationSlides(
  pptx: PptxGenJS,
  allRows: CreditAmortizationRow[],
  theme: PptxThemeRoles,
  ctx: ExportContext,
  startSlideIndex: number
): number {
  const pages = paginateAmortizationRows(allRows);
  
  pages.forEach((pageRows, pageIndex) => {
    buildCreditAmortization(
      pptx,
      {
        rows: pageRows,
        pageIndex,
        totalPages: pages.length,
      },
      theme,
      ctx,
      startSlideIndex + pageIndex
    );
  });
  
  return pages.length;
}

export default buildCreditAmortization;
