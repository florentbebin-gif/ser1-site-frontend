/**
 * Credit Annexe Slide Builder
 * 
 * Detailed explanation prose - written as an expert wealth engineer (ingénieur patrimonial)
 * would explain to a client. Client-specific values are in BOLD.
 * 
 * Supports multi-loan scenarios with:
 * - Global financing explanation
 * - Per-loan explanations
 * - Smoothing mechanism explanation (if active)
 * 
 * Design: White background, hierarchical typography, readable paragraphs
 * 
 * IMPORTANT: Uses standard SER1 template (title, subtitle, accent line, footer)
 * All visual elements MUST stay within CONTENT_ZONE (below subtitle, above footer)
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles, ExportContext, CreditAnnexeSlideSpec, LoanSummary } from '../theme/types';
import {
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  addTextBox,
  addHeader,
  addFooter,
} from '../designSystem/serenity';

// ============================================================================
// TYPES
// ============================================================================

export type CreditAnnexeData = CreditAnnexeSlideSpec;

// ============================================================================
// CONTENT ZONE BOUNDARIES (STRICT - NO OVERFLOW)
// ============================================================================

const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

const LAYOUT = {
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  contentY: CONTENT_TOP_Y,
  maxY: CONTENT_BOTTOM_Y,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function pct(n: number, decimals: number = 2): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`;
}

function formatDuree(mois: number): string {
  const ans = Math.floor(mois / 12);
  const moisRestants = mois % 12;
  if (moisRestants === 0) {
    return `${ans} an${ans > 1 ? 's' : ''}`;
  }
  return `${ans} an${ans > 1 ? 's' : ''} et ${moisRestants} mois`;
}

/**
 * Build professional prose text for the annexe (multi-loan aware)
 * Written as an expert wealth engineer would explain to a client
 * Client-specific values are in BOLD
 * 
 * COMPACT VERSION: Optimized to fit within content zone even with 3 loans
 */
function buildCreditAnnexeProse(data: CreditAnnexeData): Array<{ text: string; bold?: boolean }[]> {
  const paragraphs: Array<{ text: string; bold?: boolean }[]> = [];
  const loans = data.loans || [];
  const isMultiLoan = loans.length > 1;
  
  // ===== GLOBAL INTRODUCTION (compact) =====
  if (isMultiLoan) {
    // Multi-loan: compact intro with all loans in one paragraph
    const loansSummary = loans.map(loan => {
      const typeLabel = loan.creditType === 'amortissable' ? 'amort.' : 'in fine';
      return `Prêt ${loan.index} : ${euro(loan.capital)} sur ${formatDuree(loan.dureeMois)} (${typeLabel}, ${pct(loan.tauxNominal)})`;
    }).join(' • ');
    
    paragraphs.push([
      { text: 'Montage multi-prêts : ', bold: true },
      { text: euro(data.totalCapital), bold: true },
      { text: ' sur ' },
      { text: formatDuree(data.maxDureeMois), bold: true },
      { text: ` (${loans.length} prêts). ${loansSummary}.` },
    ]);
  } else {
    const loan = loans[0];
    if (loan) {
      const creditTypeLabel = loan.creditType === 'amortissable' ? 'amortissable' : 'in fine';
      paragraphs.push([
        { text: 'Votre financement : ' },
        { text: euro(loan.capital), bold: true },
        { text: ' sur ' },
        { text: formatDuree(loan.dureeMois), bold: true },
        { text: ` (crédit ${creditTypeLabel} au taux de ` },
        { text: pct(loan.tauxNominal), bold: true },
        { text: '). Mensualité : ' },
        { text: euro(loan.mensualiteTotale), bold: true },
        { text: '/mois.' },
      ]);
    }
  }
  
  // ===== SMOOTHING (compact, only if multi-loan) =====
  if (data.smoothingEnabled && isMultiLoan) {
    const smoothingLabel = data.smoothingMode === 'duree' ? 'durée constante' : 'mensualité constante';
    paragraphs.push([
      { text: 'Lissage actif : ', bold: true },
      { text: `mode ${smoothingLabel} pour une charge financière régulière.` },
    ]);
  }
  
  // ===== COSTS (compact, merged) =====
  paragraphs.push([
    { text: 'Coûts du financement : ', bold: true },
    { text: 'Intérêts ' },
    { text: euro(data.coutTotalInterets), bold: true },
    ...(data.coutTotalAssurance > 0 ? [
      { text: ' + Assurance ' },
      { text: euro(data.coutTotalAssurance), bold: true },
    ] : []),
    { text: ' = Coût total ' },
    { text: euro(data.coutTotalCredit), bold: true },
    { text: '. Total remboursé : ' },
    { text: euro(data.totalRembourse), bold: true },
    { text: '.' },
  ]);
  
  // ===== AVERTISSEMENT (compact) =====
  paragraphs.push([
    { text: 'Simulation indicative, non contractuelle. Conditions réelles selon établissement prêteur. Frais annexes non inclus.' },
  ]);
  
  return paragraphs;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build Credit Annexe slide (detailed calculation prose)
 */
export function buildCreditAnnexe(
  pptx: PptxGenJS,
  data: CreditAnnexeData,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  
  // White background
  slide.background = { color: 'FFFFFF' };
  
  // ========== STANDARD HEADER (centralized) ==========
  addHeader(slide, 'Annexe : Détail de votre crédit', 'Explication des modalités de remboursement', theme, 'content');
  
  // ========== SINGLE TEXT BLOCK (professional prose) ==========
  const paragraphs = buildCreditAnnexeProse(data);
  
  // Convert paragraphs to PptxGenJS TextProps format
  const textProps: PptxGenJS.TextProps[] = [];
  
  paragraphs.forEach((paragraph, pIdx) => {
    // Add paragraph spacing between paragraphs
    if (pIdx > 0) {
      textProps.push({ text: '\n\n', options: { fontSize: 11, fontFace: TYPO.fontFace } });
    }
    
    // Add each text segment of the paragraph
    paragraph.forEach((segment) => {
      textProps.push({
        text: segment.text,
        options: {
          fontSize: 11,
          fontFace: TYPO.fontFace,
          color: theme.textBody.replace('#', ''),
          bold: segment.bold || false,
        },
      });
    });
  });
  
  // Single text block that fills the content zone
  const contentBlockY = LAYOUT.contentY;
  const contentBlockH = LAYOUT.maxY - contentBlockY;
  
  slide.addText(textProps, {
    x: LAYOUT.marginX,
    y: contentBlockY,
    w: LAYOUT.contentWidth,
    h: contentBlockH,
    fontSize: 11,
    fontFace: TYPO.fontFace,
    color: theme.textBody.replace('#', ''),
    align: 'left',
    valign: 'top',
    wrap: true,
    lineSpacingMultiple: 1.3,
  });
  
  // ========== STANDARD FOOTER (from design system) ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildCreditAnnexe;
