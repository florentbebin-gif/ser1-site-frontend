/**
 * Module colorsShadows — paramètres d'ombre et utilitaires couleur/fond
 */

import type PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles } from '../theme/types';

// ============================================================================
// SHADOW PARAMS (premium outer shadow spec)
// Based on: 24% opacity, 23.3pt blur, 14.3pt distance, 74° angle
// ============================================================================

export const SHADOW_PARAMS = {
  /** Shadow type: outer (standard drop shadow) */
  type: 'outer' as const,
  /** Angle in degrees (74° = bottom-right bias) */
  angle: 74,
  /** Blur radius in points (23pt ≈ soft premium shadow) */
  blur: 23,
  /** Offset/distance in points (14pt) */
  offset: 14,
  /** Opacity (0.24 = 24%) */
  opacity: 0.24,
} as const;

export function roleColor(theme: PptxThemeRoles, role: keyof PptxThemeRoles): string {
  const color = theme[role];
  if (typeof color === 'string') {
    return color.replace('#', '');
  }
  throw new Error(`Invalid color role: ${String(role)}`);
}

/**
 * Add solid background to slide
 */
export function addBackground(slide: PptxGenJS.Slide, color: string): void {
  slide.background = { color: color.replace('#', '') };
}
