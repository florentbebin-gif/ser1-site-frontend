/**
 * Credit Amortization Slide Builder (Slides 6+)
 * 
 * Table with YEARS in COLUMNS (horizontal orientation) for easy column reading.
 * Automatic pagination: max 8 year columns per slide.
 * 
 * MULTI-LOAN SUPPORT:
 * - Groups rows by loanIndex
 * - Adds section headers for each loan ("PRÊT N°1", "PRÊT N°2", etc.)
 * - Typographic hierarchy: section headers bold 11pt, data rows 9pt
 * 
 * Rows (metrics per loan):
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
  SLIDE_SIZE,
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  addTextBox,
  addHeader,
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

// Row labels (metrics shown in rows) - secondary typography
const ROW_LABELS = [
  'Annuité (hors ass.)',
  'Intérêts',
  'Assurance',
  'Capital amorti',
  'CRD fin d\'année',
];

/**
 * Group amortization rows by loan index
 */
function groupRowsByLoan(rows: CreditAmortizationRow[]): Map<number, CreditAmortizationRow[]> {
  const groups = new Map<number, CreditAmortizationRow[]>();
  
  rows.forEach(row => {
    const loanIdx = row.loanIndex ?? 1; // Default to loan 1 for backward compat
    if (!groups.has(loanIdx)) {
      groups.set(loanIdx, []);
    }
    groups.get(loanIdx)!.push(row);
  });
  
  return groups;
}

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
  
  // Header (centralized)
  addHeader(slide, `Tableau d'amortissement${pageIndicator}`, 'Échéancier annuel de remboursement', theme, 'content');
  
  // ========== TABLE (years in columns, multi-loan sections) ==========
  
  // Group rows by loan for multi-loan support
  const loanGroups = groupRowsByLoan(data.rows);
  const isMultiLoan = loanGroups.size > 1;
  
  // For single loan, use all rows; for multi-loan, process each group
  const allRows = data.rows;
  const numYears = allRows.length;
  const numCols = numYears + 1; // +1 for label column
  
  // Calculate column widths
  const labelColWidth = 1.8;
  const yearColWidth = (LAYOUT.contentWidth - labelColWidth) / Math.max(numYears, 1);
  const colWidths = [labelColWidth, ...Array(numYears).fill(yearColWidth)];
  
  // Color definitions
  const altRowColor = lightenColor(theme.colors.color7, 0.5);
  const sectionHeaderColor = lightenColor(theme.colors.color1.replace('#', ''), 0.6);
  
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
    ...allRows.map(row => ({
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
  
  // Build section header row (for multi-loan)
  const buildSectionHeader = (loanIndex: number): PptxGenJS.TableCell[] => {
    const label = loanIndex === 1 ? 'PRÊT PRINCIPAL N°1' : `PRÊT N°${loanIndex}`;
    return [
      {
        text: label,
        options: {
          fill: { color: sectionHeaderColor },
          color: theme.textMain.replace('#', ''),
          bold: true,
          fontSize: 11,
          fontFace: TYPO.fontFace,
          align: 'left' as const,
          valign: 'middle' as const,
          colspan: numCols,
        },
      },
    ];
  };
  
  // Build data row (one per metric)
  const buildDataRow = (
    label: string, 
    values: string[], 
    rowIndex: number,
    isSecondary: boolean = false
  ): PptxGenJS.TableCell[] => {
    const isAlt = rowIndex % 2 === 1;
    const rowFill = isAlt ? altRowColor : 'FFFFFF';
    const fontSize = isSecondary ? 8 : 9;
    
    return [
      {
        text: label,
        options: {
          fill: { color: rowFill },
          color: theme.textMain.replace('#', ''),
          bold: !isSecondary,
          fontSize: fontSize,
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
          fontSize: fontSize,
          fontFace: TYPO.fontFace,
          align: 'right' as const,
          valign: 'middle' as const,
        },
      })),
    ];
  };
  
  // Build table rows
  const tableRows: PptxGenJS.TableRow[] = [headerRow];
  
  if (isMultiLoan) {
    // Multi-loan: add section headers + data for each loan
    const sortedLoanIndices = Array.from(loanGroups.keys()).sort((a, b) => a - b);
    
    sortedLoanIndices.forEach((loanIdx, sectionIdx) => {
      const loanRows = loanGroups.get(loanIdx)!;
      
      // Section header
      tableRows.push(buildSectionHeader(loanIdx));
      
      // Extract values for this loan's years
      const annuiteValues = loanRows.map(r => euro(r.annuite));
      const interetValues = loanRows.map(r => euro(r.interet));
      const assuranceValues = loanRows.map(r => euro(r.assurance));
      const amortValues = loanRows.map(r => euro(r.amort));
      const crdValues = loanRows.map(r => euro(r.crd));
      
      // Pad arrays to match total columns (for multi-loan alignment)
      const padValues = (vals: string[]): string[] => {
        const result: string[] = [];
        let valIdx = 0;
        allRows.forEach(r => {
          if (r.loanIndex === loanIdx || (!r.loanIndex && loanIdx === 1)) {
            result.push(vals[valIdx++] || '');
          } else {
            result.push('—');
          }
        });
        return result;
      };
      
      // Data rows (secondary typography for details)
      tableRows.push(buildDataRow(ROW_LABELS[0], padValues(annuiteValues), sectionIdx * 6 + 0, false));
      tableRows.push(buildDataRow(ROW_LABELS[1], padValues(interetValues), sectionIdx * 6 + 1, true));
      tableRows.push(buildDataRow(ROW_LABELS[2], padValues(assuranceValues), sectionIdx * 6 + 2, true));
      tableRows.push(buildDataRow(ROW_LABELS[3], padValues(amortValues), sectionIdx * 6 + 3, true));
      tableRows.push(buildDataRow(ROW_LABELS[4], padValues(crdValues), sectionIdx * 6 + 4, false));
    });
  } else {
    // Single loan: simple table without section headers
    const annuiteValues = allRows.map(r => euro(r.annuite));
    const interetValues = allRows.map(r => euro(r.interet));
    const assuranceValues = allRows.map(r => euro(r.assurance));
    const amortValues = allRows.map(r => euro(r.amort));
    const crdValues = allRows.map(r => euro(r.crd));
    
    tableRows.push(buildDataRow(ROW_LABELS[0], annuiteValues, 0, false));
    tableRows.push(buildDataRow(ROW_LABELS[1], interetValues, 1, true));
    tableRows.push(buildDataRow(ROW_LABELS[2], assuranceValues, 2, true));
    tableRows.push(buildDataRow(ROW_LABELS[3], amortValues, 3, true));
    tableRows.push(buildDataRow(ROW_LABELS[4], crdValues, 4, false));
  }
  
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
