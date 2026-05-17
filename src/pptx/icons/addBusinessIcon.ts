/**
 * Utilitaires d'icônes métier pour les exports PPTX.
 *
 * S'appuie sur la bibliothèque d'icônes métier existante et résout les
 * couleurs depuis le thème ou depuis une couleur déjà calculée.
 */

import type PptxGenJS from 'pptxgenjs';
import {
  getBusinessIconDataUri,
  type BusinessIconName,
} from '../../icons/business/businessIconLibrary';
import type { PptxThemeRoles, IconPlacement } from '../theme/types';
import { roleColor, addTextFr } from '../designSystem/serenity';

export type { BusinessIconName, IconPlacement };

type IconColorRole = 'accent' | 'textMain' | 'textBody' | 'white';

function getColorForRole(themeOrColor: PptxThemeRoles | string, role: IconColorRole): string {
  if (typeof themeOrColor === 'string') {
    return themeOrColor;
  }

  switch (role) {
    case 'accent':
      return themeOrColor.accent;
    case 'textMain':
      return themeOrColor.textMain;
    case 'textBody':
      return themeOrColor.textBody;
    case 'white':
      return themeOrColor.white;
    default:
      return themeOrColor.textBody;
  }
}

/**
 * Ajoute une icône métier à une slide.
 */
export function addBusinessIconToSlide(
  slide: PptxGenJS.Slide,
  iconName: BusinessIconName,
  placement: { x: number; y: number; w: number; h: number },
  themeOrColor: PptxThemeRoles | string,
  colorRole: IconColorRole = 'textBody',
): void {
  const color = getColorForRole(themeOrColor, colorRole);

  try {
    const iconDataUri = getBusinessIconDataUri(iconName, { color });

    slide.addImage({
      data: iconDataUri,
      x: placement.x,
      y: placement.y,
      w: placement.w,
      h: placement.h,
    });
  } catch (error) {
    console.error(`[PPTX Icons] Failed to add icon ${iconName}:`, error);
    addTextFr(slide, `[${iconName}]`, {
      x: placement.x,
      y: placement.y,
      w: placement.w,
      h: placement.h,
      fontSize: 10,
      color:
        typeof themeOrColor === 'string'
          ? color.replace('#', '')
          : roleColor(themeOrColor, 'textBody'),
      align: 'center',
      valign: 'middle',
    });
  }
}

/**
 * Ajoute plusieurs icônes métier à partir de specs IconPlacement.
 */
export function addBusinessIconsToSlide(
  slide: PptxGenJS.Slide,
  icons: IconPlacement[],
  theme: PptxThemeRoles,
): void {
  for (const icon of icons) {
    addBusinessIconToSlide(
      slide,
      icon.name,
      { x: icon.x, y: icon.y, w: icon.w, h: icon.h },
      theme,
      icon.colorRole || 'textBody',
    );
  }
}

/** Tailles d'icônes en pouces. */
export const ICON_SIZE_PRESETS = {
  tiny: { w: 0.3, h: 0.3 },
  small: { w: 0.5, h: 0.5 },
  medium: { w: 0.75, h: 0.75 },
  large: { w: 1.0, h: 1.0 },
  xlarge: { w: 1.5, h: 1.5 },
} as const;

export const ICON_SIZES = ICON_SIZE_PRESETS;

export default {
  addBusinessIconToSlide,
  addBusinessIconsToSlide,
  ICON_SIZE_PRESETS,
  ICON_SIZES,
};
