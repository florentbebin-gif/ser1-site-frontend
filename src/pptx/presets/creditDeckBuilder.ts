/**
 * Credit Deck Builder
 * 
 * Generates a StudyDeckSpec for Credit simulation results using the Serenity template.
 * Supports multi-loan scenarios with global synthesis + per-loan synthesis slides.
 * 
 * Structure:
 * 1. Cover - "NOM Prénom" as subtitle
 * 2. Chapter "Votre projet de financement"
 * 3. Global Synthesis - Multi-loan overview (if multiple loans)
 * 4. Per-Loan Synthesis - One slide per loan (1-3 slides)
 * 5. Chapter "Annexes"
 * 6. Credit Annexe - Detailed prose explanation (global + per-loan + smoothing)
 * 7+ Credit Amortization - Paginated yearly tables (multi-loan)
 * N. End - Legal mentions
 */

import type { 
  StudyDeckSpec, 
  ChapterSlideSpec, 
  CreditSynthesisSlideSpec,
  CreditGlobalSynthesisSlideSpec,
  CreditLoanSynthesisSlideSpec,
  CreditAnnexeSlideSpec,
  CreditAmortizationSlideSpec,
  CreditAmortizationRow,
  LoanSummary,
  PaymentPeriod,
} from '../theme/types';
import { isDebugEnabled } from '../../utils/debugFlags';

const DEBUG_PPTX = isDebugEnabled('pptx');

// ============================================================================
// TYPES
// ============================================================================

/**
 * Credit Simulation Data (matches Credit.jsx state - multi-loan support)
 */
export interface CreditData {
  // Global totals
  totalCapital?: number;
  maxDureeMois?: number;
  startYM?: string;  // point 6 — date de début réelle pour labels timeline PPTX
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  assuranceDecesByYear?: number[];
  
  // Smoothing info
  smoothingEnabled?: boolean;
  smoothingMode?: 'mensu' | 'duree';
  
  // Per-loan data (array of loan summaries)
  loans?: LoanSummary[];
  
  // Payment periods timeline (for multi-loan)
  paymentPeriods?: PaymentPeriod[];
  
  // Total amortization (aggregated all loans)
  amortizationRows: CreditAmortizationRow[];
  
  // Legacy single-loan fields (for backward compatibility)
  capitalEmprunte: number;
  dureeMois: number;
  tauxNominal: number;
  tauxAssurance: number;
  quotite?: number;  // 0..1, défaut 1 (100%). Quotité assurée prêt principal
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
  
  // Client info
  clientName?: string;
}

/**
 * UI Settings (ThemeProvider format)
 */
export interface UiSettingsForPptx {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

/**
 * Advisor info (optional)
 */
export interface AdvisorInfo {
  name?: string;
  title?: string;
  office?: string;
}

// ============================================================================
// PAGINATION HELPER (column-based: paginate by YEARS, not rows)
// ============================================================================

const MAX_YEARS_PER_SLIDE = 10;

/**
 * Get unique sorted years from all amortization rows
 */
function getUniqueYears(rows: CreditAmortizationRow[]): string[] {
  const years = new Set(rows.map(r => r.periode));
  return Array.from(years).sort();
}

/**
 * Paginate years into chunks for column-based pagination
 * Returns { allRows, yearPages } where yearPages is array of year arrays
 */
function paginateByYearColumns(
  rows: CreditAmortizationRow[]
): { allRows: CreditAmortizationRow[]; yearPages: string[][] } {
  const allYears = getUniqueYears(rows);
  const yearPages: string[][] = [];
  
  for (let i = 0; i < allYears.length; i += MAX_YEARS_PER_SLIDE) {
    yearPages.push(allYears.slice(i, i + MAX_YEARS_PER_SLIDE));
  }
  
  return { allRows: rows, yearPages };
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build Credit Study Deck Specification
 * 
 * Supports multi-loan scenarios:
 * - If 1 loan: Global synthesis only
 * - If 2+ loans: Global synthesis + per-loan synthesis slides
 * 
 * @param creditData - Credit simulation results (multi-loan support)
 * @param uiSettings - Theme colors from ThemeProvider
 * @param logoUrl - Optional logo URL from user_metadata
 * @param logoPlacement - Optional logo placement for cover slide
 * @param advisor - Optional advisor information
 */
export function buildCreditStudyDeck(
  creditData: CreditData,
  uiSettings: UiSettingsForPptx,
  logoUrl?: string,
  logoPlacement?: import('../theme/types').LogoPlacement,
  advisor?: AdvisorInfo
): StudyDeckSpec {
  // Determine if multi-loan scenario
  const loans = creditData.loans || [];
  const isMultiLoan = loans.length > 1;
  const paymentPeriods = creditData.paymentPeriods || [];
  
  // Use provided totals or calculate from legacy fields
  const totalCapital = creditData.totalCapital || creditData.capitalEmprunte;
  const maxDureeMois = creditData.maxDureeMois || creditData.dureeMois;
  const smoothingEnabled = creditData.smoothingEnabled || false;
  const smoothingMode = creditData.smoothingMode;
  
  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('[PPTX Credit] Building deck with:');
    // eslint-disable-next-line no-console
    console.debug('  Multi-loan:', isMultiLoan, '- Loans count:', loans.length);
    // eslint-disable-next-line no-console
    console.debug('  Total Capital:', totalCapital);
    // eslint-disable-next-line no-console
    console.debug('  Smoothing:', smoothingEnabled, smoothingMode);
    // eslint-disable-next-line no-console
    console.debug('  Logo URL:', logoUrl ? logoUrl.substring(0, 50) + '...' : '(none)');
  }
  
  // Format date
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Client name for subtitle
  const clientSubtitle = creditData.clientName || 'NOM Prénom';
  
  // Advisor meta
  const advisorMeta = advisor?.name || 'NOM Prénom';
  
  // Total remboursé
  const totalRembourse = totalCapital + creditData.coutTotalCredit;
  
  // Build amortization rows with proper loanIndex for multi-loan support
  // If loans have their own amortizationRows, merge them with loanIndex set
  let allAmortizationRows: CreditAmortizationRow[] = [];
  
  if (isMultiLoan && loans.some(loan => loan.amortizationRows && loan.amortizationRows.length > 0)) {
    // Multi-loan with per-loan amortization data: merge with loanIndex
    loans.forEach(loan => {
      if (loan.amortizationRows) {
        loan.amortizationRows.forEach(row => {
          allAmortizationRows.push({
            ...row,
            loanIndex: loan.index,
          });
        });
      }
    });
  } else {
    // Fallback to legacy single amortization array
    allAmortizationRows = creditData.amortizationRows.map(row => ({
      ...row,
      loanIndex: row.loanIndex ?? 1, // Default to loan 1
    }));
  }
  
  // Paginate amortization by YEAR COLUMNS (not rows)
  const { allRows: amortAllRows, yearPages } = paginateByYearColumns(allAmortizationRows);
  const totalAmortizationPages = yearPages.length;
  
  // Build slides array dynamically based on loan count
  const slides: Array<
    | ChapterSlideSpec 
    | CreditSynthesisSlideSpec
    | CreditGlobalSynthesisSlideSpec
    | CreditLoanSynthesisSlideSpec
    | CreditAnnexeSlideSpec 
    | CreditAmortizationSlideSpec
  > = [];
  
  // Chapter 1: Votre projet de financement
  slides.push({
    type: 'chapter',
    title: 'Votre projet de financement',
    subtitle: isMultiLoan 
      ? 'Vue d\'ensemble de votre montage multi-prêts'
      : 'Vue d\'ensemble de votre crédit immobilier',
    body: 'Vous souhaitez mesurer l\'efficacité de votre financement et comprendre l\'impact des paramètres clés sur votre mensualité et le coût total.',
    chapterImageIndex: 1,
  });
  
  // Synthesis slides depend on loan count
  if (isMultiLoan) {
    // Multi-loan: Global synthesis first
    slides.push({
      type: 'credit-global-synthesis',
      totalCapital,
      maxDureeMois,
      coutTotalInterets: creditData.coutTotalInterets,
      coutTotalAssurance: creditData.coutTotalAssurance,
      coutTotalCredit: creditData.coutTotalCredit,
      assuranceDecesByYear: creditData.assuranceDecesByYear,
      loans,
      paymentPeriods,
      smoothingEnabled,
      smoothingMode,
      startYM: creditData.startYM, // point 6 — pour labels de dates timeline
    });
    
    // Per-loan synthesis slides
    loans.forEach((loan) => {
      slides.push({
        type: 'credit-loan-synthesis',
        loanIndex: loan.index,
        capitalEmprunte: loan.capital,
        dureeMois: loan.dureeMois,
        tauxNominal: loan.tauxNominal,
        tauxAssurance: loan.tauxAssurance,
        mensualiteHorsAssurance: loan.mensualiteHorsAssurance,
        mensualiteTotale: loan.mensualiteTotale,
        coutTotalInterets: loan.coutInterets,
        coutTotalAssurance: loan.coutAssurance,
        coutTotalCredit: loan.coutInterets + loan.coutAssurance,
        creditType: loan.creditType,
        assuranceMode: loan.assuranceMode,
        dateEffet: loan.dateEffet, // point 8 — date d'effet du prêt
      });
    });
  } else {
    // Single loan: Use legacy synthesis (or first loan from array)
    const loan = loans[0] || {
      capital: creditData.capitalEmprunte,
      dureeMois: creditData.dureeMois,
      tauxNominal: creditData.tauxNominal,
      tauxAssurance: creditData.tauxAssurance,
      mensualiteHorsAssurance: creditData.mensualiteHorsAssurance,
      mensualiteTotale: creditData.mensualiteTotale,
      coutInterets: creditData.coutTotalInterets,
      coutAssurance: creditData.coutTotalAssurance,
      creditType: creditData.creditType,
      assuranceMode: creditData.assuranceMode,
    };
    
    slides.push({
      type: 'credit-synthesis',
      capitalEmprunte: loan.capital,
      dureeMois: loan.dureeMois,
      tauxNominal: loan.tauxNominal,
      tauxAssurance: loan.tauxAssurance,
      mensualiteHorsAssurance: loan.mensualiteHorsAssurance,
      mensualiteTotale: loan.mensualiteTotale,
      coutTotalInterets: loan.coutInterets,
      coutTotalAssurance: loan.coutAssurance,
      coutTotalCredit: loan.coutInterets + loan.coutAssurance,
      creditType: loan.creditType,
      assuranceMode: loan.assuranceMode,
      startYM: creditData.startYM,
      assuranceDecesByYear: creditData.assuranceDecesByYear,
    });
  }
  
  // Chapter 2: Annexes
  slides.push({
    type: 'chapter',
    title: 'Annexes',
    subtitle: 'Informations complémentaires',
    body: 'Retrouvez ci-après le détail des calculs et le tableau d\'amortissement de votre financement.',
    chapterImageIndex: 3,
  });
  
  // Credit Annexe (prose explanation - multi-loan aware)
  slides.push({
    type: 'credit-annexe',
    totalCapital,
    maxDureeMois,
    coutTotalInterets: creditData.coutTotalInterets,
    coutTotalAssurance: creditData.coutTotalAssurance,
    coutTotalCredit: creditData.coutTotalCredit,
    totalRembourse,
    loans: loans.length > 0 ? loans : [{
      index: 1,
      capital: creditData.capitalEmprunte,
      dureeMois: creditData.dureeMois,
      tauxNominal: creditData.tauxNominal,
      tauxAssurance: creditData.tauxAssurance,
      creditType: creditData.creditType,
      assuranceMode: creditData.assuranceMode,
      mensualiteHorsAssurance: creditData.mensualiteHorsAssurance,
      mensualiteTotale: creditData.mensualiteTotale,
      coutInterets: creditData.coutTotalInterets,
      coutAssurance: creditData.coutTotalAssurance,
    }],
    smoothingEnabled,
    smoothingMode,
    // Legacy fields for backward compatibility
    capitalEmprunte: creditData.capitalEmprunte,
    dureeMois: creditData.dureeMois,
    tauxNominal: creditData.tauxNominal,
    tauxAssurance: creditData.tauxAssurance,
    mensualiteHorsAssurance: creditData.mensualiteHorsAssurance,
    mensualiteTotale: creditData.mensualiteTotale,
    creditType: creditData.creditType,
    assuranceMode: creditData.assuranceMode,
  });
  
  // Amortization tables (paginated by YEAR COLUMNS)
  yearPages.forEach((yearsForPage, pageIndex) => {
    slides.push({
      type: 'credit-amortization',
      allRows: amortAllRows,
      yearsForPage,
      pageIndex,
      totalPages: totalAmortizationPages,
    });
  });
  
  // Build complete deck spec
  const spec: StudyDeckSpec = {
    cover: {
      type: 'cover',
      title: 'Simulation Crédit Immobilier',
      subtitle: clientSubtitle,
      logoUrl,
      logoPlacement,
      leftMeta: dateStr,
      rightMeta: advisorMeta,
    },
    slides,
    end: {
      type: 'end',
      legalText: `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.

Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.

Cette simulation ne constitue pas une offre de prêt. Les conditions réelles dépendront de l'établissement prêteur et de votre profil emprunteur. Les frais annexes (dossier, garantie, notaire) ne sont pas inclus.

Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée.`,
    },
  };
  
  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('[PPTX Credit] Deck spec built:', {
      coverTitle: spec.cover.title,
      coverSubtitle: spec.cover.subtitle,
      slidesCount: spec.slides.length,
      slideTypes: spec.slides.map(s => s.type),
      amortizationPages: totalAmortizationPages,
    });
  }
  
  return spec;
}

export default buildCreditStudyDeck;
