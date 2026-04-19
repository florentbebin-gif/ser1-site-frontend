/**
 * Module typography — police et tailles de texte
 * Font: Arial ONLY
 */

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPO = {
  fontFace: 'Arial',
  sizes: {
    h1: 24,
    h2: 16,
    body: 14,
    bodySmall: 12,
    bodyXSmall: 10,
    legal: 11,
    footer: 8,
    coverTitle: 24,
    coverSubtitle: 18,
    coverMeta: 14, // Changed from 18 to 14 per spec
  },
} as const;
