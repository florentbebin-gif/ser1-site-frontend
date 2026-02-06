/**
 * SER1 PPTX Semantic Colors - PPTX-specific color roles and helpers
 * 
 * This module provides:
 * - PPTX semantic color roles (bgMain, accent, textMain, etc.)
 * - Contrast helpers for PPTX slides
 * - Mapping from C1-C10 tokens to PPTX-specific roles
 * 
 * Usage:
 *   import { getPptxSemanticColors, getPptxTextForBackground } from '@/pptx/theme/semanticColors';
 */

import { 
  WHITE, 
  WARNING, 
  pickTextColorForBackground,
  type ThemeTokens 
} from '../../styles/semanticColors';

// Re-export for convenience
export { WHITE, WARNING, pickTextColorForBackground };

// ============================================
// TYPES
// ============================================

/**
 * PPTX Semantic Color Roles
 * These map the generic C1-C10 tokens to PPTX-specific semantic meanings
 */
export interface PptxSemanticColors {
  /** Main background - Cover slides (C1) */
  bgMain: string;
  
  /** Light background - Content slides (WHITE) */
  bgLight: string;
  
  /** Accent background - Info panels (C4) */
  bgAccent: string;
  
  /** Primary text on light backgrounds (C10) */
  textMain: string;
  
  /** Secondary text - body content (C9) */
  textBody: string;
  
  /** Text on dark backgrounds - covers, headers (WHITE) */
  textOnMain: string;
  
  /** Accent color - lines, decorative elements (C6) */
  accent: string;
  
  /** Panel borders - cards, boxes (C8) */
  panelBorder: string;
  
  /** Light borders - subtle dividers (C8) */
  borderLight: string;
  
  /** Shadow base color (C10) */
  shadowBase: string;
  
  /** Warning color - alerts (WARNING) */
  warning: string;
  
  /** Danger/error color (C1) */
  danger: string;
  
  /** Success color (C3) */
  success: string;
  
  /** Info color (C4) */
  info: string;
  
  /** Footer text on light backgrounds (C9/C10) */
  footerOnLight: string;
  
  /** Footer text with accent (C6) */
  footerAccent: string;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Generate PPTX semantic color roles from C1-C10 tokens
 * 
 * @param tokens - Theme tokens (c1 through c10)
 * @returns PPTX-specific semantic color mappings
 * 
 * @example
 *   const pptxColors = getPptxSemanticColors({ c1: '#2B3E37', c2: '#709B8B', ... });
 *   console.log(pptxColors.bgMain); // '#2B3E37' (C1 for covers)
 *   console.log(pptxColors.textOnMain); // '#FFFFFF' (white text on dark covers)
 */
export function getPptxSemanticColors(tokens: ThemeTokens): PptxSemanticColors {
  return {
    // Backgrounds
    bgMain: tokens.c1,      // Cover slides - brand dark
    bgLight: WHITE,         // Content slides - white
    bgAccent: tokens.c4,    // Info panels - brand faint
    
    // Text
    textMain: tokens.c10,   // Primary text on light backgrounds
    textBody: tokens.c9,    // Secondary/body text
    textOnMain: WHITE,      // Text on dark backgrounds (covers)
    
    // Accents & borders
    accent: tokens.c6,      // Accent lines, decorative elements
    panelBorder: tokens.c8, // Card/panel borders
    borderLight: tokens.c8, // Subtle borders
    shadowBase: tokens.c10, // Shadow color
    
    // Status colors
    warning: WARNING,       // Hardcoded warning
    danger: tokens.c1,      // Error states (brand dark, intentional)
    success: tokens.c3,     // Success states (brand light)
    info: tokens.c4,        // Info states (brand faint)
    
    // Footer variants
    footerOnLight: tokens.c9,  // Footer on white/light backgrounds
    footerAccent: tokens.c6,   // Accent footer text
  };
}

// ============================================
// PPTX-SPECIFIC HELPERS
// ============================================

/**
 * Get the appropriate text color for a PPTX background
 * Wrapper around pickTextColorForBackground with PPTX-specific defaults
 */
export function getPptxTextForBackground(
  bgColor: string, 
  options?: { 
    darkFallback?: string;  // Default: #FFFFFF
    lightFallback?: string; // Default: #000000
  }
): string {
  const darkFallback = options?.darkFallback ?? WHITE;
  const lightFallback = options?.lightFallback ?? '#000000';
  
  const textColor = pickTextColorForBackground(bgColor);
  
  // If pickTextColorForBackground returns white, use darkFallback
  // If it returns black, use lightFallback
  return textColor === WHITE ? darkFallback : lightFallback;
}

/**
 * Get Excel-specific colors from tokens
 * Excel has different needs than PPTX (zebra stripes, headers, etc.)
 */
export interface ExcelColors {
  /** Header background (C2) */
  headerFill: string;
  
  /** Header text - calculated for contrast */
  headerText: string;
  
  /** Section background (C4) */
  sectionFill: string;
  
  /** Section text (C10) */
  sectionText: string;
  
  /** Border color (C8) */
  border: string;
  
  /** Zebra odd rows (C7) */
  zebraOdd: string;
  
  /** Zebra even rows (WHITE) */
  zebraEven: string;
  
  /** Warning background */
  warningFill: string;
  
  /** Warning text (WARNING) */
  warningText: string;
}

/**
 * Generate Excel-specific color configuration
 */
export function getExcelColors(tokens: ThemeTokens): ExcelColors {
  const headerFill = tokens.c2;
  
  return {
    headerFill,
    headerText: pickTextColorForBackground(headerFill),
    sectionFill: tokens.c4,
    sectionText: tokens.c10,
    border: tokens.c8,
    zebraOdd: tokens.c7,
    zebraEven: WHITE,
    warningFill: '#FFF7E6', // Light amber background
    warningText: WARNING,
  };
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that all required PPTX colors are present
 * Useful for debugging theme issues
 */
export function validatePptxColors(colors: Partial<PptxSemanticColors>): string[] {
  const required: (keyof PptxSemanticColors)[] = [
    'bgMain', 'bgLight', 'textMain', 'textOnMain', 'accent', 'panelBorder'
  ];
  
  const missing: string[] = [];
  for (const key of required) {
    if (!colors[key]) {
      missing.push(key);
    }
  }
  
  return missing;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  getPptxSemanticColors,
  getPptxTextForBackground,
  getExcelColors,
  validatePptxColors,
  WHITE,
  WARNING,
};
