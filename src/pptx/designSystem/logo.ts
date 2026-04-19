/**
 * Module logo — placement du logo sur la slide de couverture
 */

import type { LogoPlacement } from '../theme/types';
import { SLIDE_SIZE } from './layout';
import { COORDS_COVER } from './coords';

// ============================================================================
// LOGO PLACEMENT CONSTANTS
// Safe zone calculations for logo positioning on cover slide
// ============================================================================

export const LOGO_PLACEMENT = {
  /** Margin from top edge for 'top' positions */
  marginTop: 0.5,
  /** Margin before title zone for 'bottom' positions */
  marginBottom: 0.3,
  /** Side margin for left/right positions */
  marginSide: 0.5,
  /** Maximum Y for logo bottom (title zone Y - marginBottom) */
  get maxBottomY() {
    return COORDS_COVER.title.y - this.marginBottom;
  },
  /** Center X of slide */
  centerX: SLIDE_SIZE.width / 2,
} as const;

/** Default logo placement */
export const DEFAULT_LOGO_PLACEMENT: LogoPlacement = 'center-bottom';

/**
 * Calculate logo position based on placement option
 * Ensures logo never overlaps with title zone
 */
export function calculateLogoPosition(
  placement: LogoPlacement,
  logoWidth: number,
  logoHeight: number
): { x: number; y: number } {
  switch (placement) {
    case 'center-top':
      return {
        x: LOGO_PLACEMENT.centerX - logoWidth / 2,
        y: LOGO_PLACEMENT.marginTop,
      };
    case 'top-left':
      return {
        x: LOGO_PLACEMENT.marginSide,
        y: LOGO_PLACEMENT.marginTop,
      };
    case 'top-right':
      return {
        x: SLIDE_SIZE.width - logoWidth - LOGO_PLACEMENT.marginSide,
        y: LOGO_PLACEMENT.marginTop,
      };
    case 'center-bottom':
      return {
        x: LOGO_PLACEMENT.centerX - logoWidth / 2,
        y: LOGO_PLACEMENT.maxBottomY - logoHeight,
      };
    case 'bottom-left':
      return {
        x: LOGO_PLACEMENT.marginSide,
        y: LOGO_PLACEMENT.maxBottomY - logoHeight,
      };
    case 'bottom-right':
      return {
        x: SLIDE_SIZE.width - logoWidth - LOGO_PLACEMENT.marginSide,
        y: LOGO_PLACEMENT.maxBottomY - logoHeight,
      };
    default:
      // Fallback to center-bottom
      return {
        x: LOGO_PLACEMENT.centerX - logoWidth / 2,
        y: LOGO_PLACEMENT.maxBottomY - logoHeight,
      };
  }
}
