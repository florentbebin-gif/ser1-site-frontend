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
  TYPO,
  COORDS_CONTENT,
  COORDS_FOOTER,
  addHeader,
  addFooter,
  addTextFr,
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
  
  // PFU (Prélèvement Forfaitaire Unique)
  pfuIr?: number; // 12.8% sur revenus du capital
  
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
 * 
 * OPTIMIZED: Condensed paragraphs to fit content zone without overflow
 */
function buildAnnexeProse(data: IrAnnexeData): Array<{ text: string; bold?: boolean }[]> {
  const paragraphs: Array<{ text: string; bold?: boolean }[]> = [];
  
  // Foyer description
  const foyerDesc = data.isCouple 
    ? (data.childrenCount && data.childrenCount > 0 
        ? `un couple avec ${data.childrenCount} enfant${data.childrenCount > 1 ? 's' : ''}`
        : 'un couple')
    : 'une personne seule';
  
  // ===== PARAGRAPH 1: Introduction, base imposable et quotient familial (MERGED) =====
  paragraphs.push([
    { text: 'Votre foyer fiscal (' },
    { text: foyerDesc, bold: true },
    { text: ') dispose d\'un revenu net imposable de ' },
    { text: euro(data.taxableIncome), bold: true },
    { text: '. Avec ' },
    { text: `${fmt2(data.partsNb)} part${data.partsNb > 1 ? 's' : ''} fiscale${data.partsNb > 1 ? 's' : ''}`, bold: true },
    { text: ', votre revenu imposable par part s\'établit à ' },
    { text: euro(data.taxablePerPart), bold: true },
    { text: '.' },
  ]);
  
  // ===== PARAGRAPH 2: Barème progressif (CONDENSED) =====
  if (data.tmiRate === 0) {
    paragraphs.push([
      { text: 'Votre revenu par part étant inférieur au seuil d\'imposition, ' },
      { text: 'vous n\'êtes pas imposable', bold: true },
      { text: ' au titre de l\'impôt sur le revenu.' },
    ]);
  } else {
    let bracketText: { text: string; bold?: boolean }[] = [
      { text: 'Le barème progressif s\'applique par tranches : ' },
    ];
    
    if (data.bracketsDetails && data.bracketsDetails.length > 0) {
      const taxedBrackets = data.bracketsDetails.filter(b => b.tax > 0);
      taxedBrackets.forEach((bracket, idx) => {
        if (idx > 0) bracketText.push({ text: ', ' });
        bracketText.push({ text: `${euro(bracket.base)} à ${pct(bracket.rate)}`, bold: true });
      });
      bracketText.push({ text: '. ' });
    }
    
    bracketText.push({ text: 'Votre TMI : ' });
    bracketText.push({ text: `${pct(data.tmiRate)}`, bold: true });
    bracketText.push({ text: ' (tout euro supplémentaire sera imposé à ce taux).' });
    
    paragraphs.push(bracketText);
  }
  
  // ===== PARAGRAPH 3: Corrections (CONDENSED) =====
  const hasDecote = data.decote && data.decote > 0;
  const hasQfAdvantage = data.qfAdvantage && data.qfAdvantage > 0;
  const hasCredits = data.creditsTotal && data.creditsTotal > 0;
  
  if (hasDecote || hasQfAdvantage || hasCredits) {
    let correctionText: { text: string; bold?: boolean }[] = [
      { text: 'Corrections appliquées : ' },
    ];
    
    const corrections: string[] = [];
    if (hasDecote) corrections.push(`décote ${euro(data.decote!)}`);
    if (hasQfAdvantage) corrections.push(`avantage QF ${euro(data.qfAdvantage!)}`);
    if (hasCredits) corrections.push(`réductions/crédits ${euro(data.creditsTotal!)}`);
    
    corrections.forEach((c, idx) => {
      if (idx > 0) correctionText.push({ text: ', ' });
      correctionText.push({ text: c, bold: true });
    });
    correctionText.push({ text: '.' });
    
    paragraphs.push(correctionText);
  }
  
  // ===== PARAGRAPH 4: Result (CONDENSED) =====
  if (data.irNet === 0) {
    paragraphs.push([
      { text: 'Résultat : ' },
      { text: 'vous n\'êtes redevable d\'aucun impôt sur le revenu', bold: true },
      { text: '.' },
    ]);
  } else {
    paragraphs.push([
      { text: 'Votre impôt sur le revenu net s\'élève à ' },
      { text: euro(data.irNet), bold: true },
      { text: '.' },
    ]);
  }
  
  // ===== PARAGRAPH 5: PFU (CONDENSED) =====
  const hasPfuIr = data.pfuIr && data.pfuIr > 0;
  
  if (hasPfuIr) {
    paragraphs.push([
      { text: 'Revenus du capital : ' },
      { text: 'PFU 12,8%', bold: true },
      { text: ' de ' },
      { text: euro(data.pfuIr!), bold: true },
      { text: ' (+ PS 17,2% = flat tax 30%).' },
    ]);
  }
  
  // ===== PARAGRAPH 6: Contributions (CONDENSED) =====
  const hasCehr = data.cehr && data.cehr > 0;
  const hasCdhr = data.cdhr && data.cdhr > 0;
  const hasPsFoncier = data.psFoncier && data.psFoncier > 0;
  const hasPsDividends = data.psDividends && data.psDividends > 0;
  const hasContributions = hasCehr || hasCdhr || hasPsFoncier || hasPsDividends;
  
  if (hasContributions) {
    let contribText: { text: string; bold?: boolean }[] = [
      { text: 'Contributions complémentaires : ' },
    ];
    
    const contribs: string[] = [];
    if (hasCehr) contribs.push(`CEHR ${euro(data.cehr!)}`);
    if (hasCdhr) contribs.push(`CDHR ${euro(data.cdhr!)}`);
    if (hasPsFoncier) contribs.push(`PS fonciers ${euro(data.psFoncier!)}`);
    if (hasPsDividends) contribs.push(`PS dividendes ${euro(data.psDividends!)}`);
    
    contribs.forEach((c, idx) => {
      if (idx > 0) contribText.push({ text: ', ' });
      contribText.push({ text: c, bold: true });
    });
    contribText.push({ text: '.' });
    
    paragraphs.push(contribText);
  }
  
  // ===== PARAGRAPH 7: Total =====
  if (data.totalTax !== data.irNet && data.totalTax > 0) {
    paragraphs.push([
      { text: 'Imposition globale : ' },
      { text: euro(data.totalTax), bold: true },
      { text: '.' },
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
  
  // ========== STANDARD HEADER (centralized) ==========
  addHeader(
    slide,
    'Annexe : Détail du calcul',
    'Méthode de calcul de l\'impôt sur le revenu (Barème 2025 (revenus 2024))',
    theme,
    'content'
  );
  
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
  
  addTextFr(slide, textProps, {
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
