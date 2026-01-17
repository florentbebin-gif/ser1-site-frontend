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
 * Build adaptive prose text for the annexe
 * Only includes sections that apply to this client's situation
 */
function buildAnnexeText(data: IrAnnexeData): string[] {
  const sections: string[] = [];
  
  // Section 1: Introduction
  sections.push('DÉTAIL DU CALCUL DE L\'IMPÔT SUR LE REVENU');
  sections.push('');
  
  // Section 2: Base imposable
  sections.push('1. Revenu imposable du foyer');
  sections.push(`Votre revenu net imposable s'élève à ${euro(data.taxableIncome)}.`);
  sections.push('');
  
  // Section 3: Quotient familial
  sections.push('2. Application du quotient familial');
  let qfText = `Votre foyer fiscal dispose de ${fmt2(data.partsNb)} part${data.partsNb > 1 ? 's' : ''} fiscale${data.partsNb > 1 ? 's' : ''}`;
  if (data.isCouple && data.childrenCount && data.childrenCount > 0) {
    qfText += ` (couple avec ${data.childrenCount} enfant${data.childrenCount > 1 ? 's' : ''})`;
  } else if (data.isCouple) {
    qfText += ' (couple)';
  }
  qfText += '.';
  sections.push(qfText);
  sections.push(`Le revenu par part est de ${euro(data.taxablePerPart)}.`);
  sections.push('');
  
  // Section 4: Barème progressif
  sections.push('3. Application du barème progressif');
  if (data.bracketsDetails && data.bracketsDetails.length > 0) {
    sections.push('L\'impôt est calculé par tranche :');
    for (const bracket of data.bracketsDetails) {
      if (bracket.tax > 0) {
        sections.push(`  • Tranche à ${pct(bracket.rate)} : ${euro(bracket.base)} × ${pct(bracket.rate)} = ${euro(bracket.tax)}`);
      }
    }
  } else if (data.tmiRate === 0) {
    sections.push('Votre revenu par part est inférieur au seuil d\'imposition (11 294 €).');
    sections.push('Vous n\'êtes pas imposable au titre de l\'impôt sur le revenu.');
  }
  sections.push('');
  
  // Section 5: TMI
  sections.push('4. Tranche marginale d\'imposition (TMI)');
  if (data.tmiRate === 0) {
    sections.push('Votre TMI est de 0% (non imposable).');
  } else {
    sections.push(`Votre TMI est de ${pct(data.tmiRate)}. Cela signifie que tout revenu supplémentaire sera imposé à ce taux.`);
  }
  sections.push('');
  
  // Section 6: Corrections (only if applicable)
  const hasCorrections = (data.decote && data.decote > 0) || 
                         (data.qfAdvantage && data.qfAdvantage > 0) || 
                         (data.creditsTotal && data.creditsTotal > 0);
  
  if (hasCorrections) {
    sections.push('5. Corrections et réductions');
    
    if (data.decote && data.decote > 0) {
      sections.push(`  • Décote : -${euro(data.decote)}`);
      sections.push('    La décote s\'applique aux foyers modestes pour réduire progressivement l\'impôt.');
    }
    
    if (data.qfAdvantage && data.qfAdvantage > 0) {
      sections.push(`  • Avantage du quotient familial : ${euro(data.qfAdvantage)}`);
    }
    
    if (data.creditsTotal && data.creditsTotal > 0) {
      sections.push(`  • Réductions et crédits d'impôt : -${euro(data.creditsTotal)}`);
    }
    
    sections.push('');
  }
  
  // Section 7: Result
  const sectionNum = hasCorrections ? 6 : 5;
  sections.push(`${sectionNum}. Impôt sur le revenu net`);
  if (data.irNet === 0) {
    sections.push('Vous n\'êtes pas redevable de l\'impôt sur le revenu.');
  } else {
    sections.push(`Votre impôt sur le revenu net s'élève à ${euro(data.irNet)}.`);
  }
  sections.push('');
  
  // Section 8: Contributions (only if applicable)
  const hasContributions = (data.cehr && data.cehr > 0) || 
                           (data.cdhr && data.cdhr > 0) ||
                           (data.psFoncier && data.psFoncier > 0) ||
                           (data.psDividends && data.psDividends > 0);
  
  if (hasContributions) {
    sections.push(`${sectionNum + 1}. Contributions et prélèvements sociaux`);
    
    if (data.cehr && data.cehr > 0) {
      sections.push(`  • Contribution exceptionnelle sur les hauts revenus (CEHR) : ${euro(data.cehr)}`);
    }
    
    if (data.cdhr && data.cdhr > 0) {
      sections.push(`  • Contribution différentielle sur les hauts revenus (CDHR) : ${euro(data.cdhr)}`);
    }
    
    if (data.psFoncier && data.psFoncier > 0) {
      sections.push(`  • Prélèvements sociaux sur revenus fonciers : ${euro(data.psFoncier)}`);
    }
    
    if (data.psDividends && data.psDividends > 0) {
      sections.push(`  • Prélèvements sociaux sur dividendes : ${euro(data.psDividends)}`);
    }
    
    sections.push('');
  }
  
  // Section 9: Total
  if (data.totalTax !== data.irNet) {
    const finalSectionNum = sectionNum + (hasContributions ? 2 : 1);
    sections.push(`${finalSectionNum}. Imposition totale`);
    sections.push(`Votre imposition totale (IR + contributions) s'élève à ${euro(data.totalTax)}.`);
    
    // Average rate
    if (data.taxableIncome > 0) {
      const tauxMoyen = (data.totalTax / data.taxableIncome) * 100;
      sections.push(`Cela représente un taux moyen d'imposition de ${pct(tauxMoyen)}.`);
    }
  }
  
  return sections;
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
 * All visual content is placed within CONTENT_ZONE
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
  
  // ========== CONTENT (within content zone) ==========
  const textLines = buildAnnexeText(data);
  
  let currentY = LAYOUT.contentY;
  const maxY = LAYOUT.maxY; // Stay above footer
  
  for (const line of textLines) {
    if (currentY >= maxY) break; // Prevent overflow into footer
    
    const isSection = /^\d+\./.test(line) || line === 'DÉTAIL DU CALCUL DE L\'IMPÔT SUR LE REVENU';
    const isBullet = line.startsWith('  •');
    const isSubBullet = line.startsWith('    ');
    const isEmpty = line === '';
    
    if (isEmpty) {
      currentY += LAYOUT.sectionSpacing;
      continue;
    }
    
    // Skip the main title from buildAnnexeText (we use the standard header)
    if (line === 'DÉTAIL DU CALCUL DE L\'IMPÔT SUR LE REVENU') {
      continue;
    }
    
    let fontSize: number = TYPO.sizes.body;
    let isBold = false;
    let indent = 0;
    let lineColor = theme.textBody.replace('#', '');
    
    if (isSection) {
      fontSize = 12;
      isBold = true;
      lineColor = theme.textMain.replace('#', '');
    } else if (isBullet) {
      indent = 0.3;
      fontSize = 10;
    } else if (isSubBullet) {
      indent = 0.5;
      fontSize = 9;
      lineColor = '666666';
    } else {
      fontSize = 10;
    }
    
    slide.addText(line, {
      x: LAYOUT.marginX + indent,
      y: currentY,
      w: LAYOUT.contentWidth - indent,
      h: LAYOUT.lineHeight,
      fontSize,
      fontFace: TYPO.fontFace,
      color: lineColor,
      bold: isBold,
      align: 'left',
      valign: 'top',
    });
    
    currentY += LAYOUT.lineHeight;
  }
  
  // ========== STANDARD FOOTER (from design system) ==========
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildIrAnnexe;
