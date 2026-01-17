/**
 * IR Annexe Slide Builder (Slide 5)
 * 
 * Detailed calculation explanation - structured prose adapted to client's case.
 * Only includes mechanisms that actually apply (decote, credits, etc.)
 * 
 * Design: White background, hierarchical typography, readable paragraphs
 * 
 * IMPORTANT: Uses standard SER1 template (title, subtitle, accent line, footer)
 * All visual elements MUST stay within CONTENT_ZONE (below subtitle, above footer)
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles, ExportContext } from '../theme/types';
import {
  SLIDE_SIZE,
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

export interface IrAnnexeData {
  // Core calculation
  taxableIncome: number;
  partsNb: number;
  taxablePerPart: number;
  tmiRate: number;
  irNet: number;
  totalTax: number;
  
  // Bracket details
  bracketsDetails?: Array<{ label: string; base: number; rate: number; tax: number }>;
  
  // Corrections (only include if non-zero)
  decote?: number;
  qfAdvantage?: number;
  creditsTotal?: number;
  
  // Contributions
  cehr?: number;
  cdhr?: number;
  psFoncier?: number;
  psDividends?: number;
  psTotal?: number;
  
  // Foyer info
  isCouple?: boolean;
  childrenCount?: number;
}

// ============================================================================
// CONTENT ZONE BOUNDARIES (STRICT - NO OVERFLOW)
// ============================================================================

/**
 * Content zone starts AFTER the subtitle (y + h)
 * All visual elements MUST have y >= CONTENT_TOP_Y
 */
const CONTENT_TOP_Y = COORDS_CONTENT.content.y; // 2.3754

/**
 * Content zone ends BEFORE the footer
 * All visual elements MUST have (y + h) <= CONTENT_BOTTOM_Y
 */
const CONTENT_BOTTOM_Y = COORDS_FOOTER.date.y - 0.15; // ~6.80

// ============================================================================
// LAYOUT CONSTANTS - ALL WITHIN CONTENT ZONE
// ============================================================================

const LAYOUT = {
  marginX: COORDS_CONTENT.margin.x, // 0.9167
  contentWidth: COORDS_CONTENT.margin.w, // 11.5
  contentY: CONTENT_TOP_Y,
  lineHeight: 0.26,
  sectionSpacing: 0.12,
  maxY: CONTENT_BOTTOM_Y,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

function euro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function pct(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

function fmt2(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Build professional prose text for the annexe
 * Written as an expert wealth engineer (ingénieur patrimonial) would explain to a client
 * Client-specific values are in BOLD
 */
function buildAnnexeProse(data: IrAnnexeData): Array<{ text: string; bold?: boolean }[]> {
  const paragraphs: Array<{ text: string; bold?: boolean }[]> = [];
  
  // Foyer description
  const foyerDesc = data.isCouple 
    ? (data.childrenCount && data.childrenCount > 0 
        ? `un couple avec ${data.childrenCount} enfant${data.childrenCount > 1 ? 's' : ''}`
        : 'un couple')
    : 'une personne seule';
  
  // ===== PARAGRAPH 1: Introduction et base imposable =====
  paragraphs.push([
    { text: 'Votre foyer fiscal, composé de ' },
    { text: foyerDesc, bold: true },
    { text: ', dispose d\'un revenu net imposable de ' },
    { text: euro(data.taxableIncome), bold: true },
    { text: '. Ce montant correspond à l\'ensemble de vos revenus après déduction des charges et abattements applicables.' },
  ]);
  
  // ===== PARAGRAPH 2: Quotient familial =====
  paragraphs.push([
    { text: 'Le système fiscal français applique le mécanisme du quotient familial afin d\'adapter l\'impôt à la composition du foyer. Votre foyer bénéficie de ' },
    { text: `${fmt2(data.partsNb)} part${data.partsNb > 1 ? 's' : ''} fiscale${data.partsNb > 1 ? 's' : ''}`, bold: true },
    { text: ', ce qui porte votre revenu imposable par part à ' },
    { text: euro(data.taxablePerPart), bold: true },
    { text: '.' },
  ]);
  
  // ===== PARAGRAPH 3: Barème progressif =====
  if (data.tmiRate === 0) {
    paragraphs.push([
      { text: 'Votre revenu par part étant inférieur au seuil d\'entrée dans le barème progressif (11 294 € pour les revenus 2024), ' },
      { text: 'vous n\'êtes pas imposable', bold: true },
      { text: ' au titre de l\'impôt sur le revenu.' },
    ]);
  } else {
    // Build bracket details text
    let bracketText: { text: string; bold?: boolean }[] = [
      { text: 'L\'impôt sur le revenu est calculé selon un barème progressif comportant plusieurs tranches. Pour chaque part fiscale, le revenu est taxé successivement : ' },
    ];
    
    if (data.bracketsDetails && data.bracketsDetails.length > 0) {
      const taxedBrackets = data.bracketsDetails.filter(b => b.tax > 0);
      taxedBrackets.forEach((bracket, idx) => {
        if (idx > 0) bracketText.push({ text: ', ' });
        bracketText.push({ text: `${euro(bracket.base)} à ${pct(bracket.rate)}`, bold: true });
      });
      bracketText.push({ text: '. ' });
    }
    
    bracketText.push({ text: 'Votre tranche marginale d\'imposition (TMI) est de ' });
    bracketText.push({ text: `${pct(data.tmiRate)}`, bold: true });
    bracketText.push({ text: ', ce qui signifie que tout euro supplémentaire de revenu sera imposé à ce taux.' });
    
    paragraphs.push(bracketText);
  }
  
  // ===== PARAGRAPH 4: Corrections (if applicable) =====
  const hasDecote = data.decote && data.decote > 0;
  const hasQfAdvantage = data.qfAdvantage && data.qfAdvantage > 0;
  const hasCredits = data.creditsTotal && data.creditsTotal > 0;
  
  if (hasDecote || hasQfAdvantage || hasCredits) {
    let correctionText: { text: string; bold?: boolean }[] = [
      { text: 'Plusieurs mécanismes correcteurs s\'appliquent à votre situation : ' },
    ];
    
    const corrections: string[] = [];
    if (hasDecote) {
      corrections.push(`une décote de ${euro(data.decote!)} destinée à alléger l'impôt des foyers modestes`);
    }
    if (hasQfAdvantage) {
      corrections.push(`un avantage lié au quotient familial de ${euro(data.qfAdvantage!)}`);
    }
    if (hasCredits) {
      corrections.push(`des réductions et crédits d'impôt pour un total de ${euro(data.creditsTotal!)}`);
    }
    
    corrections.forEach((c, idx) => {
      if (idx > 0 && idx === corrections.length - 1) {
        correctionText.push({ text: ' et ' });
      } else if (idx > 0) {
        correctionText.push({ text: ', ' });
      }
      correctionText.push({ text: c, bold: true });
    });
    correctionText.push({ text: '.' });
    
    paragraphs.push(correctionText);
  }
  
  // ===== PARAGRAPH 5: Result =====
  if (data.irNet === 0) {
    paragraphs.push([
      { text: 'Après application de l\'ensemble des mécanismes fiscaux, ' },
      { text: 'vous n\'êtes redevable d\'aucun impôt sur le revenu', bold: true },
      { text: ' au titre de cette année.' },
    ]);
  } else {
    paragraphs.push([
      { text: 'Après application du barème et des éventuelles corrections, votre ' },
      { text: 'impôt sur le revenu net s\'élève à ', bold: false },
      { text: euro(data.irNet), bold: true },
      { text: '.' },
    ]);
  }
  
  // ===== PARAGRAPH 6: Contributions (if applicable) =====
  const hasCehr = data.cehr && data.cehr > 0;
  const hasCdhr = data.cdhr && data.cdhr > 0;
  const hasPsFoncier = data.psFoncier && data.psFoncier > 0;
  const hasPsDividends = data.psDividends && data.psDividends > 0;
  const hasContributions = hasCehr || hasCdhr || hasPsFoncier || hasPsDividends;
  
  if (hasContributions) {
    let contribText: { text: string; bold?: boolean }[] = [
      { text: 'À cet impôt s\'ajoutent des contributions complémentaires : ' },
    ];
    
    const contribs: string[] = [];
    if (hasCehr) contribs.push(`la CEHR (${euro(data.cehr!)})`);
    if (hasCdhr) contribs.push(`la CDHR (${euro(data.cdhr!)})`);
    if (hasPsFoncier) contribs.push(`les prélèvements sociaux sur revenus fonciers (${euro(data.psFoncier!)})`);
    if (hasPsDividends) contribs.push(`les prélèvements sociaux sur dividendes (${euro(data.psDividends!)})`);
    
    contribs.forEach((c, idx) => {
      if (idx > 0 && idx === contribs.length - 1) {
        contribText.push({ text: ' et ' });
      } else if (idx > 0) {
        contribText.push({ text: ', ' });
      }
      contribText.push({ text: c, bold: true });
    });
    contribText.push({ text: '.' });
    
    paragraphs.push(contribText);
  }
  
  // ===== PARAGRAPH 7: Total and average rate =====
  if (data.totalTax !== data.irNet && data.totalTax > 0) {
    const tauxMoyen = data.taxableIncome > 0 ? (data.totalTax / data.taxableIncome) * 100 : 0;
    paragraphs.push([
      { text: 'Au total, votre ' },
      { text: `imposition globale s'élève à ${euro(data.totalTax)}`, bold: true },
      { text: ', soit un ' },
      { text: `taux moyen d'imposition de ${pct(tauxMoyen)}`, bold: true },
      { text: ' de vos revenus.' },
    ]);
  } else if (data.irNet > 0 && data.taxableIncome > 0) {
    const tauxMoyen = (data.irNet / data.taxableIncome) * 100;
    paragraphs.push([
      { text: 'Cela représente un ' },
      { text: `taux moyen d'imposition de ${pct(tauxMoyen)}`, bold: true },
      { text: ' de vos revenus.' },
    ]);
  }
  
  return paragraphs;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build IR Annexe slide (detailed calculation prose)
 * 
 * Uses standard SER1 template:
 * - Title (H1, left-aligned, uppercase)
 * - Accent line under title
 * - Subtitle (H2, left-aligned)
 * - Footer (date, disclaimer, slide number)
 * 
 * NEW DESIGN: Single text block with professional prose
 * Written as an ingénieur patrimonial would explain to a client
 * Client-specific values are highlighted in BOLD
 */
export function buildIrAnnexe(
  pptx: PptxGenJS,
  data: IrAnnexeData,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  
  // White background
  slide.background = { color: 'FFFFFF' };
  
  // ========== STANDARD HEADER (from design system) ==========
  
  // Title (H1, ALL CAPS, LEFT-ALIGNED) - using helper
  addTextBox(slide, 'Annexe : Détail du calcul', COORDS_CONTENT.title, {
    fontSize: TYPO.sizes.h1,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Accent line under title - using helper
  addAccentLine(slide, theme, 'content');
  
  // Subtitle (H2) - using helper
  addTextBox(slide, 'Méthode de calcul de l\'impôt sur le revenu', COORDS_CONTENT.subtitle, {
    fontSize: TYPO.sizes.h2,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
  });
  
  // ========== SINGLE TEXT BLOCK (professional prose) ==========
  // Build paragraphs with mixed bold/normal text
  const paragraphs = buildAnnexeProse(data);
  
  // Convert paragraphs to PptxGenJS TextProps format
  // Each paragraph is an array of text segments with optional bold
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
  // Respects margins and stops above footer
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
    lineSpacingMultiple: 1.3, // Comfortable reading spacing
  });
  
  // ========== STANDARD FOOTER (from design system) ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildIrAnnexe;
