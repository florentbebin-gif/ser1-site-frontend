/**
 * Credit Amortization Slide Builder (Slides 6+)
 * 
 * SINGLE COMBINED TABLE with YEARS in COLUMNS:
 * - All years spread across columns (paginate by columns if >10 years)
 * - Row structure: Global section (5 rows) + Per-loan sections (4 rows each)
 * - Same row structure on EVERY page, only year columns change
 * 
 * Structure:
 * - Header row: [Label | Year1 | Year2 | ... | YearN]
 * - Global section: 5 rows (Annuité, Intérêts, Assurance, Capital amorti, CRD)
 * - Per-loan sections: 4 rows each (Annuité, Assurance, Capital amorti, CRD)
 * 
 * Design: White background, compact typography (font 7-8pt, row height 0.22")
 * to fit ~17+ rows on one slide.
 * 
 * IMPORTANT: Uses standard SER1 template (title, subtitle, accent line, footer)
 * All visual elements MUST stay within CONTENT_ZONE (below subtitle, above footer)
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles, ExportContext, CreditAmortizationRow } from '../theme/types';
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

const MAX_YEARS_PER_SLIDE = 10; // More years per slide with compact design

const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

const LAYOUT = {
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  tableY: CONTENT_TOP_Y + 0.05,
  tableMaxH: CONTENT_BOTTOM_Y - CONTENT_TOP_Y - 0.10,
} as const;

// Row labels for GLOBAL section (aggregated across all loans)
const GLOBAL_ROW_LABELS = [
  'Annuité globale (hors ass.)',
  'Intérêts',
  'Assurance',
  'Capital amorti',
  'CRD fin d\'année',
];

// Row labels for PER-LOAN sections (4 rows per loan)
const LOAN_ROW_LABELS = [
  'Annuité (hors ass.)',
  'Assurance',
  'Capital amorti',
  'CRD fin de période',
];

/**
 * Returns true if all assurance values across all rows are 0 (simplifié mode)
 */
function hasNoAssurance(rows: CreditAmortizationRow[]): boolean {
  return rows.every(r => !r.assurance || r.assurance === 0);
}

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

/**
 * Group amortization rows by loan index
 */
function groupRowsByLoan(rows: CreditAmortizationRow[]): Map<number, CreditAmortizationRow[]> {
  const groups = new Map<number, CreditAmortizationRow[]>();
  
  rows.forEach(row => {
    const loanIdx = row.loanIndex ?? 1;
    if (!groups.has(loanIdx)) {
      groups.set(loanIdx, []);
    }
    groups.get(loanIdx)!.push(row);
  });
  
  return groups;
}

/**
 * Get unique sorted years from all rows
 */
function getUniqueYears(rows: CreditAmortizationRow[]): string[] {
  const years = new Set(rows.map(r => r.periode));
  return Array.from(years).sort();
}

/**
 * Paginate years into chunks for column-based pagination
 * Returns array of year arrays, each representing one slide's columns
 */
export function paginateYearColumns(allYears: string[]): string[][] {
  const pages: string[][] = [];
  for (let i = 0; i < allYears.length; i += MAX_YEARS_PER_SLIDE) {
    pages.push(allYears.slice(i, i + MAX_YEARS_PER_SLIDE));
  }
  return pages;
}

/**
 * Legacy pagination function for backward compatibility
 * Now paginates by COLUMNS (years), not rows
 */
export function paginateAmortizationRows(
  rows: CreditAmortizationRow[]
): CreditAmortizationRow[][] {
  // Get unique years and paginate them
  const allYears = getUniqueYears(rows);
  const yearPages = paginateYearColumns(allYears);
  
  // Return the same rows for each page - the page will filter by years
  // This maintains compatibility but the builder will handle year filtering
  return yearPages.map(() => rows);
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
  allRows: CreditAmortizationRow[];  // ALL rows from all loans
  yearsForPage: string[];             // Years to display on THIS page
  pageIndex: number;
  totalPages: number;
}

// Legacy interface for backward compatibility
export interface LegacyCreditAmortizationSlideData {
  rows: CreditAmortizationRow[];
  pageIndex: number;
  totalPages: number;
}

/**
 * Build Credit Amortization slide
 * 
 * STRUCTURE (same on every page):
 * - Header row: years for this page
 * - Global section: 5 rows (aggregated totals)
 * - Per-loan sections: 4 rows each
 * 
 * Pagination is by COLUMNS (years), not rows.
 */
export function buildCreditAmortization(
  pptx: PptxGenJS,
  data: CreditAmortizationSlideData | LegacyCreditAmortizationSlideData,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  
  // Handle both new and legacy data formats
  let allRows: CreditAmortizationRow[];
  let yearsForPage: string[];
  let pageIndex: number;
  let totalPages: number;
  
  if ('allRows' in data && 'yearsForPage' in data) {
    // New format
    allRows = data.allRows;
    yearsForPage = data.yearsForPage;
    pageIndex = data.pageIndex;
    totalPages = data.totalPages;
  } else {
    // Legacy format - derive years from rows
    allRows = data.rows;
    yearsForPage = getUniqueYears(data.rows);
    pageIndex = data.pageIndex;
    totalPages = data.totalPages;
  }
  
  // ========== HEADER ==========
  const pageIndicator = totalPages > 1 ? ` (${pageIndex + 1}/${totalPages})` : '';
  addHeader(slide, `Tableau d'amortissement${pageIndicator}`, 'Échéancier annuel de remboursement', theme, 'content');
  
  // ========== TABLE SETUP ==========
  const loanGroups = groupRowsByLoan(allRows);
  const isMultiLoan = loanGroups.size > 1;
  const numLoans = loanGroups.size;
  
  const noAssurance = hasNoAssurance(allRows);

  // Calculate total rows: header + global(4 or 5) + per-loan(3 or 4 each)
  const globalRows = noAssurance ? 4 : 5;
  const loanRowsCount = noAssurance ? 3 : 4;
  const totalDataRows = isMultiLoan ? (globalRows + numLoans * loanRowsCount) : globalRows;
  
  // Compact styling to fit all rows
  // Available height: ~4.3" for content
  // Target row height: 4.3 / (totalDataRows + 1) but min 0.18, max 0.25
  const availableHeight = LAYOUT.tableMaxH;
  const calculatedRowH = Math.min(0.25, Math.max(0.18, availableHeight / (totalDataRows + 1)));
  
  // Font sizes: smaller for more rows
  const baseFontSize = totalDataRows > 15 ? 7 : (totalDataRows > 10 ? 8 : 9);
  const smallFontSize = Math.max(6, baseFontSize - 1);
  
  const numYears = yearsForPage.length;
  
  // Column widths
  const labelColWidth = 1.9;
  const yearColWidth = (LAYOUT.contentWidth - labelColWidth) / Math.max(numYears, 1);
  const colWidths = [labelColWidth, ...Array(numYears).fill(yearColWidth)];
  
  // Colors
  const altRowColor = lightenColor(theme.colors.color7, 0.5);
  const loanSectionFill = lightenColor(theme.colors.color7, 0.6);
  const crdFill = lightenColor(theme.colors.color1.replace('#', ''), 0.75);
  
  // ========== BUILD TABLE ROWS ==========
  const tableRows: PptxGenJS.TableRow[] = [];
  
  // Header row
  tableRows.push([
    { 
      text: '', 
      options: { 
        fill: { color: theme.colors.color1.replace('#', '') },
        color: 'FFFFFF',
        bold: true,
        fontSize: baseFontSize,
        fontFace: TYPO.fontFace,
        align: 'center' as const,
        valign: 'middle' as const,
      } 
    },
    ...yearsForPage.map(year => ({
      text: year,
      options: {
        fill: { color: theme.colors.color1.replace('#', '') },
        color: 'FFFFFF',
        bold: true,
        fontSize: baseFontSize,
        fontFace: TYPO.fontFace,
        align: 'center' as const,
        valign: 'middle' as const,
      },
    })),
  ]);
  
  // Helper: build data row
  const buildRow = (
    label: string,
    values: string[],
    fill: string,
    bold: boolean,
    fontSize: number
  ): PptxGenJS.TableCell[] => [
    {
      text: label,
      options: {
        fill: { color: fill },
        color: theme.textMain.replace('#', ''),
        bold,
        fontSize,
        fontFace: TYPO.fontFace,
        align: 'left' as const,
        valign: 'middle' as const,
      },
    },
    ...values.map(val => ({
      text: val,
      options: {
        fill: { color: fill },
        color: theme.textBody.replace('#', ''),
        fontSize,
        fontFace: TYPO.fontFace,
        align: 'right' as const,
        valign: 'middle' as const,
      },
    })),
  ];
  
  // ===== GLOBAL SECTION =====
  // Compute global aggregates per year
  const globalAggregates = new Map<string, { annuite: number; interet: number; assurance: number; amort: number; crd: number }>();
  allRows.forEach(r => {
    const existing = globalAggregates.get(r.periode) || { annuite: 0, interet: 0, assurance: 0, amort: 0, crd: 0 };
    globalAggregates.set(r.periode, {
      annuite: existing.annuite + r.annuite,
      interet: existing.interet + r.interet,
      assurance: existing.assurance + r.assurance,
      amort: existing.amort + r.amort,
      crd: existing.crd + r.crd,
    });
  });
  
  // Global rows (filter to years for this page)
  const globalAnnuite = yearsForPage.map(y => euro(globalAggregates.get(y)?.annuite || 0));
  const globalInteret = yearsForPage.map(y => euro(globalAggregates.get(y)?.interet || 0));
  const globalAssurance = yearsForPage.map(y => euro(globalAggregates.get(y)?.assurance || 0));
  const globalAmort = yearsForPage.map(y => euro(globalAggregates.get(y)?.amort || 0));
  const globalCrd = yearsForPage.map(y => euro(globalAggregates.get(y)?.crd || 0));
  
  tableRows.push(buildRow(GLOBAL_ROW_LABELS[0], globalAnnuite, 'FFFFFF', true, baseFontSize));
  tableRows.push(buildRow(GLOBAL_ROW_LABELS[1], globalInteret, altRowColor, false, smallFontSize));
  if (!noAssurance) {
    tableRows.push(buildRow(GLOBAL_ROW_LABELS[2], globalAssurance, 'FFFFFF', false, smallFontSize));
  }
  tableRows.push(buildRow(GLOBAL_ROW_LABELS[3], globalAmort, noAssurance ? 'FFFFFF' : altRowColor, false, smallFontSize));
  tableRows.push(buildRow(GLOBAL_ROW_LABELS[4], globalCrd, crdFill, true, baseFontSize));
  
  // ===== PER-LOAN SECTIONS (only for multi-loan) =====
  if (isMultiLoan) {
    const sortedLoanIndices = Array.from(loanGroups.keys()).sort((a, b) => a - b);
    
    sortedLoanIndices.forEach((loanIdx) => {
      const loanRows = loanGroups.get(loanIdx)!;
      const loanYearMap = new Map(loanRows.map(r => [r.periode, r]));
      
      // Values for this loan (filtered to years for this page)
      const annuiteValues = yearsForPage.map(y => loanYearMap.has(y) ? euro(loanYearMap.get(y)!.annuite) : '—');
      const assuranceValues = yearsForPage.map(y => loanYearMap.has(y) ? euro(loanYearMap.get(y)!.assurance) : '—');
      const amortValues = yearsForPage.map(y => loanYearMap.has(y) ? euro(loanYearMap.get(y)!.amort) : '—');
      const crdValues = yearsForPage.map(y => loanYearMap.has(y) ? euro(loanYearMap.get(y)!.crd) : '—');
      
      // 3 or 4 rows per loan with gray background (skip assurance if noAssurance)
      const loanLabel = `Prêt N°${loanIdx} ${LOAN_ROW_LABELS[0]}`;
      tableRows.push(buildRow(loanLabel, annuiteValues, loanSectionFill, true, smallFontSize));
      if (!noAssurance) {
        tableRows.push(buildRow(LOAN_ROW_LABELS[1], assuranceValues, loanSectionFill, false, smallFontSize));
      }
      tableRows.push(buildRow(LOAN_ROW_LABELS[2], amortValues, loanSectionFill, false, smallFontSize));
      tableRows.push(buildRow(LOAN_ROW_LABELS[3], crdValues, loanSectionFill, false, smallFontSize));
    });
  }
  
  // ========== ADD TABLE ==========
  slide.addTable(tableRows, {
    x: LAYOUT.marginX,
    y: LAYOUT.tableY,
    w: LAYOUT.contentWidth,
    colW: colWidths,
    rowH: calculatedRowH,
    border: { 
      type: 'solid', 
      color: theme.colors.color8.replace('#', ''), 
      pt: 0.5 
    },
    margin: [0.03, 0.05, 0.03, 0.05],
  });
  
  // ========== FOOTER ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

/**
 * Build ALL amortization slides with column-based pagination
 * Returns the number of slides created
 */
export function buildAllCreditAmortizationSlides(
  pptx: PptxGenJS,
  allRows: CreditAmortizationRow[],
  theme: PptxThemeRoles,
  ctx: ExportContext,
  startSlideIndex: number
): number {
  // Get all unique years
  const allYears = getUniqueYears(allRows);
  
  // Paginate by years (columns)
  const yearPages = paginateYearColumns(allYears);
  const totalPages = yearPages.length;
  
  yearPages.forEach((yearsForPage, pageIndex) => {
    buildCreditAmortization(
      pptx,
      {
        allRows,
        yearsForPage,
        pageIndex,
        totalPages,
      },
      theme,
      ctx,
      startSlideIndex + pageIndex
    );
  });
  
  return totalPages;
}

export default buildCreditAmortization;
