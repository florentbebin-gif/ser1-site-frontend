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
 */
function buildCreditAnnexeProse(data: CreditAnnexeData): Array<{ text: string; bold?: boolean }[]> {
  const paragraphs: Array<{ text: string; bold?: boolean }[]> = [];
  const loans = data.loans || [];
  const isMultiLoan = loans.length > 1;
  
  // ===== GLOBAL INTRODUCTION =====
  if (isMultiLoan) {
    paragraphs.push([
      { text: 'Votre projet de financement repose sur un montage multi-prêts portant sur un capital total de ' },
      { text: euro(data.totalCapital), bold: true },
      { text: ' sur une durée maximale de ' },
      { text: formatDuree(data.maxDureeMois), bold: true },
      { text: '. Ce montage comprend ' },
      { text: `${loans.length} prêts distincts`, bold: true },
      { text: ' dont les caractéristiques sont détaillées ci-après.' },
    ]);
  } else {
    const loan = loans[0];
    if (loan) {
      const creditTypeLabel = loan.creditType === 'amortissable' ? 'amortissable classique' : 'in fine';
      paragraphs.push([
        { text: 'Votre projet de financement porte sur un emprunt de ' },
        { text: euro(loan.capital), bold: true },
        { text: ' sur une durée de ' },
        { text: formatDuree(loan.dureeMois), bold: true },
        { text: `. Il s'agit d'un crédit ` },
        { text: creditTypeLabel, bold: true },
        { text: ' au taux nominal annuel de ' },
        { text: pct(loan.tauxNominal), bold: true },
        { text: '.' },
      ]);
    }
  }
  
  // ===== PER-LOAN DETAILS =====
  loans.forEach((loan, idx) => {
    const loanLabel = loans.length > 1 ? `Prêt N°${loan.index}` : 'Votre prêt';
    const creditTypeLabel = loan.creditType === 'amortissable' ? 'amortissable' : 'in fine';
    const assurModeLabel = loan.assuranceMode === 'CI' ? 'sur le capital initial' : 'sur le capital restant dû';
    
    if (isMultiLoan) {
      paragraphs.push([
        { text: `${loanLabel} : `, bold: true },
        { text: 'Capital de ' },
        { text: euro(loan.capital), bold: true },
        { text: ' sur ' },
        { text: formatDuree(loan.dureeMois), bold: true },
        { text: ` (crédit ${creditTypeLabel} au taux de ` },
        { text: pct(loan.tauxNominal), bold: true },
        { text: '). ' },
        { text: 'Mensualité totale : ' },
        { text: euro(loan.mensualiteTotale), bold: true },
        { text: '. Coût total : ' },
        { text: euro(loan.coutInterets + loan.coutAssurance), bold: true },
        { text: '.' },
      ]);
    } else {
      // Single loan: detailed mensualité explanation
      paragraphs.push([
        { text: 'Votre mensualité s\'établit à ' },
        { text: euro(loan.mensualiteHorsAssurance), bold: true },
        { text: ' hors assurance. ' },
        ...(loan.tauxAssurance > 0 ? [
          { text: `Avec l'assurance emprunteur (taux de ` },
          { text: pct(loan.tauxAssurance), bold: true },
          { text: ` calculée ${assurModeLabel}), votre mensualité totale atteint ` },
          { text: euro(loan.mensualiteTotale), bold: true },
          { text: '.' },
        ] : [
          { text: 'Aucune assurance emprunteur n\'est incluse dans cette simulation.' },
        ]),
      ]);
    }
  });
  
  // ===== SMOOTHING EXPLANATION =====
  if (data.smoothingEnabled && isMultiLoan) {
    const smoothingLabel = data.smoothingMode === 'duree' 
      ? 'durée constante' 
      : 'mensualité constante';
    
    paragraphs.push([
      { text: 'Mécanisme de lissage : ', bold: true },
      { text: `Afin d'optimiser votre budget mensuel, un lissage à ` },
      { text: smoothingLabel, bold: true },
      { text: ' a été appliqué à votre montage. ' },
      { text: 'Ce mécanisme ajuste automatiquement les remboursements du prêt principal ' },
      { text: 'pour compenser la fin des prêts complémentaires, ' },
      { text: 'vous permettant de maintenir une charge financière régulière tout au long du financement.' },
    ]);
  }
  
  // ===== GLOBAL COSTS =====
  paragraphs.push([
    { text: 'Sur la durée totale du financement, le coût des intérêts s\'élève à ' },
    { text: euro(data.coutTotalInterets), bold: true },
    { text: '. ' },
    ...(data.coutTotalAssurance > 0 ? [
      { text: 'Le coût de l\'assurance représente ' },
      { text: euro(data.coutTotalAssurance), bold: true },
      { text: '. ' },
    ] : []),
    { text: 'Le coût total du crédit s\'établit ainsi à ' },
    { text: euro(data.coutTotalCredit), bold: true },
    { text: '.' },
  ]);
  
  // ===== TOTAL REMBOURSÉ =====
  paragraphs.push([
    { text: 'Au terme du remboursement, vous aurez versé un total de ' },
    { text: euro(data.totalRembourse), bold: true },
    { text: ', soit le capital emprunté (' },
    { text: euro(data.totalCapital), bold: true },
    { text: ') augmenté du coût du crédit (' },
    { text: euro(data.coutTotalCredit), bold: true },
    { text: ').' },
  ]);
  
  // ===== AVERTISSEMENT =====
  paragraphs.push([
    { text: 'Cette simulation est fournie à titre indicatif et ne constitue pas une offre de prêt. ' },
    { text: 'Les conditions réelles dépendront de l\'établissement prêteur et de votre profil emprunteur. ' },
    { text: 'Les frais annexes (dossier, garantie, notaire) ne sont pas inclus dans ce calcul.' },
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
