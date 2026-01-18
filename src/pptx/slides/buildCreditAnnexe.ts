/**
 * Credit Annexe Slide Builder (Slide 5)
 * 
 * Detailed explanation prose - written as an expert wealth engineer (ingénieur patrimonial)
 * would explain to a client. Client-specific values are in BOLD.
 * 
 * Design: White background, hierarchical typography, readable paragraphs
 * 
 * IMPORTANT: Uses standard SER1 template (title, subtitle, accent line, footer)
 * All visual elements MUST stay within CONTENT_ZONE (below subtitle, above footer)
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles, ExportContext } from '../theme/types';
import {
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  addTextBox,
  addAccentLine,
  addFooter,
} from '../designSystem/serenity';

// ============================================================================
// TYPES
// ============================================================================

export interface CreditAnnexeData {
  capitalEmprunte: number;
  dureeMois: number;
  tauxNominal: number;
  tauxAssurance: number;
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
  totalRembourse: number;
}

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
 * Build professional prose text for the annexe
 * Written as an expert wealth engineer would explain to a client
 * Client-specific values are in BOLD
 */
function buildCreditAnnexeProse(data: CreditAnnexeData): Array<{ text: string; bold?: boolean }[]> {
  const paragraphs: Array<{ text: string; bold?: boolean }[]> = [];
  
  const creditTypeLabel = data.creditType === 'amortissable' 
    ? 'amortissable classique' 
    : 'in fine';
  
  const assurModeLabel = data.assuranceMode === 'CI'
    ? 'sur le capital initial'
    : 'sur le capital restant dû';
  
  // ===== PARAGRAPH 1: Introduction et paramètres =====
  paragraphs.push([
    { text: 'Votre projet de financement porte sur un emprunt de ' },
    { text: euro(data.capitalEmprunte), bold: true },
    { text: ' sur une durée de ' },
    { text: formatDuree(data.dureeMois), bold: true },
    { text: `. Il s'agit d'un crédit ` },
    { text: creditTypeLabel, bold: true },
    { text: ' au taux nominal annuel de ' },
    { text: pct(data.tauxNominal), bold: true },
    { text: '.' },
  ]);
  
  // ===== PARAGRAPH 2: Mensualités =====
  paragraphs.push([
    { text: 'Votre mensualité s\'établit à ' },
    { text: euro(data.mensualiteHorsAssurance), bold: true },
    { text: ' hors assurance. ' },
    ...(data.tauxAssurance > 0 ? [
      { text: `Avec l'assurance emprunteur (taux de ` },
      { text: pct(data.tauxAssurance), bold: true },
      { text: ` calculée ${assurModeLabel}), votre mensualité totale atteint ` },
      { text: euro(data.mensualiteTotale), bold: true },
      { text: '.' },
    ] : [
      { text: 'Aucune assurance emprunteur n\'est incluse dans cette simulation.' },
    ]),
  ]);
  
  // ===== PARAGRAPH 3: Coûts détaillés =====
  paragraphs.push([
    { text: 'Sur la durée totale du prêt, le coût des intérêts s\'élève à ' },
    { text: euro(data.coutTotalInterets), bold: true },
    { text: '. ' },
    ...(data.coutTotalAssurance > 0 ? [
      { text: 'Le coût de l\'assurance représente ' },
      { text: euro(data.coutTotalAssurance), bold: true },
      { text: '. ' },
    ] : []),
    { text: 'Le coût total du crédit (intérêts' },
    ...(data.coutTotalAssurance > 0 ? [{ text: ' + assurance' }] : []),
    { text: ') s\'établit ainsi à ' },
    { text: euro(data.coutTotalCredit), bold: true },
    { text: '.' },
  ]);
  
  // ===== PARAGRAPH 4: Total remboursé =====
  paragraphs.push([
    { text: 'Au terme du remboursement, vous aurez versé un total de ' },
    { text: euro(data.totalRembourse), bold: true },
    { text: ', soit le capital emprunté (' },
    { text: euro(data.capitalEmprunte), bold: true },
    { text: ') augmenté du coût du crédit (' },
    { text: euro(data.coutTotalCredit), bold: true },
    { text: ').' },
  ]);
  
  // ===== PARAGRAPH 5: Type de crédit spécifique =====
  if (data.creditType === 'amortissable') {
    paragraphs.push([
      { text: 'Avec un prêt amortissable, chaque mensualité comprend une part de capital et une part d\'intérêts. ' },
      { text: 'La part de capital augmente progressivement tandis que celle des intérêts diminue, ' },
      { text: 'le capital restant dû décroissant au fil des remboursements.' },
    ]);
  } else {
    paragraphs.push([
      { text: 'Avec un prêt in fine, vous ne remboursez que les intérêts pendant toute la durée du prêt. ' },
      { text: 'Le capital emprunté (' },
      { text: euro(data.capitalEmprunte), bold: true },
      { text: ') est remboursé en une seule fois à l\'échéance du prêt.' },
    ]);
  }
  
  // ===== PARAGRAPH 6: Avertissement =====
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
  
  // ========== STANDARD HEADER (from design system) ==========
  
  // Title (H1, ALL CAPS, LEFT-ALIGNED)
  addTextBox(slide, 'Annexe : Détail de votre crédit', COORDS_CONTENT.title, {
    fontSize: TYPO.sizes.h1,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Accent line under title
  addAccentLine(slide, theme, 'content');
  
  // Subtitle (H2)
  addTextBox(slide, 'Explication des modalités de remboursement', COORDS_CONTENT.subtitle, {
    fontSize: TYPO.sizes.h2,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
  });
  
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
