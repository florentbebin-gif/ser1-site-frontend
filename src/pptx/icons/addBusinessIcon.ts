/**
 * Business Icon Utility for PPTX Generation
 * 
 * Uses the existing business icon library to add icons to slides.
 * Supports color role mapping for theme-consistent styling.
 */

import PptxGenJS from 'pptxgenjs';
import { getBusinessIconDataUri, type BusinessIconName } from '../../icons/business/businessIconLibrary';
import type { PptxThemeRoles, IconPlacement } from '../theme/types';
import { roleColor, addTextFr } from '../designSystem/serenity';

export type { BusinessIconName, IconPlacement };

/**
 * Get color from theme by role name
 */
function getColorForRole(
  theme: PptxThemeRoles,
  role: 'accent' | 'textMain' | 'textBody' | 'white'
): string {
  switch (role) {
    case 'accent':
      return theme.accent;
    case 'textMain':
      return theme.textMain;
    case 'textBody':
      return theme.textBody;
    case 'white':
      return theme.white;
    default:
      return theme.textBody;
  }
}

/**
 * Add a business icon to a slide
 * 
 * @param slide - PptxGenJS slide
 * @param iconName - Name of the business icon
 * @param placement - Position and size (x, y, w, h in inches)
 * @param theme - PPTX theme for color resolution
 * @param colorRole - Color role to use (defaults to 'textBody')
 */
export function addBusinessIconToSlide(
  slide: PptxGenJS.Slide,
  iconName: BusinessIconName,
  placement: { x: number; y: number; w: number; h: number },
  theme: PptxThemeRoles,
  colorRole: 'accent' | 'textMain' | 'textBody' | 'white' = 'textBody'
): void {
  try {
    const color = getColorForRole(theme, colorRole);
    
    // Get icon as data URI with specified color
    const iconDataUri = getBusinessIconDataUri(iconName, { color });
    
    // Add image to slide
    slide.addImage({
      data: iconDataUri,
      x: placement.x,
      y: placement.y,
      w: placement.w,
      h: placement.h,
    });
  } catch (error) {
    console.error(`[PPTX Icons] Failed to add icon ${iconName}:`, error);
    // Fallback: add placeholder text
    addTextFr(slide, `[${iconName}]`, {
      x: placement.x,
      y: placement.y,
      w: placement.w,
      h: placement.h,
      fontSize: 10,
      color: roleColor(theme, 'textBody'),
      align: 'center',
      valign: 'middle',
    });
  }
}

/**
 * Add multiple business icons to a slide from IconPlacement specs
 * 
 * @param slide - PptxGenJS slide
 * @param icons - Array of icon placements
 * @param theme - PPTX theme
 */
export function addBusinessIconsToSlide(
  slide: PptxGenJS.Slide,
  icons: IconPlacement[],
  theme: PptxThemeRoles
): void {
  for (const icon of icons) {
    addBusinessIconToSlide(
      slide,
      icon.name,
      { x: icon.x, y: icon.y, w: icon.w, h: icon.h },
      theme,
      icon.colorRole || 'textBody'
    );
  }
}

/**
 * Icon size presets (in inches)
 */
export const ICON_SIZE_PRESETS = {
  tiny: { w: 0.3, h: 0.3 },
  small: { w: 0.5, h: 0.5 },
  medium: { w: 0.75, h: 0.75 },
  large: { w: 1.0, h: 1.0 },
  xlarge: { w: 1.5, h: 1.5 },
} as const;

/**
 * Add a business icon with a direct color string (no theme resolution)
 * Backward-compatible API for callers that already have a resolved color.
 */
export function addBusinessIconDirect(
  slide: PptxGenJS.Slide,
  iconName: BusinessIconName,
  options: { x: number | string; y: number | string; w: number; h: number; color?: string }
): void {
  try {
    const iconDataUri = getBusinessIconDataUri(iconName, { color: options.color });
    slide.addImage({
      data: iconDataUri,
      x: options.x as number,
      y: options.y as number,
      w: options.w,
      h: options.h,
    });
  } catch (error) {
    console.error(`[PPTX Icons] Failed to add icon ${iconName}:`, error);
    addTextFr(slide, `[${iconName}]`, {
      x: options.x as number,
      y: options.y as number,
      w: options.w,
      h: options.h,
      fontSize: 10,
      color: options.color || 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });
  }
}

/** Alias for backward compatibility */
export const ICON_SIZES = ICON_SIZE_PRESETS;

export default {
  addBusinessIconToSlide,
  addBusinessIconsToSlide,
  addBusinessIconDirect,
  ICON_SIZE_PRESETS,
  ICON_SIZES,
};
