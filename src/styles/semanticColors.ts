/**
 * SER1 Semantic Colors - Core module for color tokens and contrast helpers
 * 
 * This module provides:
 * - Semantic color mappings (surface, text, border, status)
 * - Contrast calculation helpers
 * - Constants for allowed exceptions (WHITE, WARNING)
 * 
 * Usage:
 *   import { getSemanticColors, pickTextColorForBackground, WHITE, WARNING } from '@/styles/semanticColors';
 */

// ============================================
// CONSTANTS - Allowed exceptions per governance
// ============================================

/** Pure white - allowed for cards, panels, text on dark backgrounds */
export const WHITE = '#FFFFFF' as const;

/** Warning amber - hardcoded for universal readability on all themes */
export const WARNING = '#996600' as const;

/** Overlay for modals - only allowed rgba per governance */
export const OVERLAY = 'rgba(0,0,0,0.5)' as const;

// ============================================
// TYPES
// ============================================

export interface ThemeTokens {
  c1: string;  // Brand dark
  c2: string;  // Brand primary
  c3: string;  // Brand light
  c4: string;  // Brand faint
  c5: string;  // Neutral medium
  c6: string;  // Warm accent
  c7: string;  // Surface page
  c8: string;  // Border light
  c9: string;  // Text muted
  c10: string; // Text primary
}

export interface SemanticColors {
  // Surfaces
  'surface-page': string;
  'surface-card': string;
  'surface-raised': string;
  'surface-overlay': string;
  
  // Text
  'text-primary': string;
  'text-secondary': string;
  'text-inverse': string;
  
  // Borders
  'border-default': string;
  'border-strong': string;
  
  // Accent
  'accent-line': string;
  
  // Status
  'success': string;
  'danger': string;
  'warning': string;
  'info': string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate luminance of a hex color
 * Uses standard RGB luminance formula: 0.299*R + 0.587*G + 0.114*B
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two hex colors
 * Returns a value between 1 and 21 (21 is max contrast, black on white)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Pick the best text color (black or white) for a given background
 * Returns WHITE (#FFFFFF) for dark backgrounds, black (#000000) for light backgrounds
 * 
 * Threshold at luminance 0.5 ensures WCAG AA compliance in most cases
 */
export function pickTextColorForBackground(bgColor: string): string {
  const luminance = getLuminance(bgColor);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Validate that a color is a proper hex code (3, 4, 6, or 8 digits)
 */
export function isValidHex(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

// ============================================
// MAIN FUNCTION - Get semantic colors from tokens
// ============================================

/**
 * Generate semantic color mappings from C1-C10 tokens
 * 
 * @param tokens - Theme tokens (c1 through c10)
 * @returns Semantic color mappings
 * 
 * @example
 *   const semantic = getSemanticColors({ c1: '#2B3E37', c2: '#709B8B', ... });
 *   console.log(semantic['surface-page']); // '#F5F3F0' (from c7)
 */
export function getSemanticColors(tokens: ThemeTokens): SemanticColors {
  return {
    // Surfaces
    'surface-page': tokens.c7,
    'surface-card': WHITE,
    'surface-raised': tokens.c4,
    'surface-overlay': OVERLAY,
    
    // Text
    'text-primary': tokens.c10,
    'text-secondary': tokens.c9,
    'text-inverse': WHITE,
    
    // Borders
    'border-default': tokens.c8,
    'border-strong': tokens.c5,
    
    // Accent
    'accent-line': tokens.c6,
    
    // Status - per governance decision
    'success': tokens.c3,  // Brand light for success
    'danger': tokens.c1,   // Brand dark for danger (intentional, not red)
    'warning': WARNING,    // Hardcoded #996600 for universal readability
    'info': tokens.c4,     // Brand faint for info
  };
}

/**
 * Get CSS custom properties (variables) from semantic colors
 * Useful for injecting into :root or a specific scope
 */
export function getSemanticCSSVariables(tokens: ThemeTokens): Record<string, string> {
  const semantic = getSemanticColors(tokens);
  const variables: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(semantic)) {
    variables[`--color-${key}`] = value;
  }
  
  // Also add raw C1-C10 tokens
  for (let i = 1; i <= 10; i++) {
    const key = `c${i}` as keyof ThemeTokens;
    variables[`--color-${key}`] = tokens[key];
  }
  
  // Add exceptions
  variables['--color-white'] = WHITE;
  variables['--color-warning'] = WARNING;
  
  return variables;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  WHITE,
  WARNING,
  OVERLAY,
  getSemanticColors,
  getSemanticCSSVariables,
  pickTextColorForBackground,
  getContrastRatio,
  isValidHex,
};
