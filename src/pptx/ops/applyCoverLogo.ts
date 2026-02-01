/**
 * Injection du logo sur la slide de couverture
 * 
 * Le logo provient de Supabase Storage et est centré selon le layout de la cover
 */

import { getBusinessIconDataUri } from '../../icons/business/businessIconLibrary';

export interface LogoPlacement {
  x: number | string;  // Position X (inches ou pourcentage)
  y: number | string;  // Position Y (inches ou pourcentage)
  w: number;          // Largeur (inches)
  h: number;          // Hauteur (inches)
}

export interface CoverLogoOptions {
  logoUrl?: string;     // URL depuis Supabase Storage
  logoData?: string;     // Data URI base64
  placement: LogoPlacement;
}

/**
 * Injecte le logo sur la slide de couverture
 * 
 * @param slide - Slide PPTXGenJS de couverture
 * @param logoUrlOrData - URL du logo ou data URI
 * @param placement - Position et dimensions du logo
 */
export function applyCoverLogo(
  slide: any,
  logoUrlOrData: string,
  placement: LogoPlacement
): void {
  try {
    if (logoUrlOrData.startsWith('data:')) {
      // Data URI direct
      slide.addImage({
        data: logoUrlOrData,
        x: placement.x,
        y: placement.y,
        w: placement.w,
        h: placement.h,
      });
    } else {
      // URL depuis Supabase Storage
      slide.addImage({
        path: logoUrlOrData,
        x: placement.x,
        y: placement.y,
        w: placement.w,
        h: placement.h,
      });
    }
    
    // eslint-disable-next-line no-console
    console.log('✅ Logo applied to cover slide');
  } catch (error) {
    console.error('❌ Failed to apply logo:', error);
    
    // Fallback : icône business par défaut
    const fallbackIcon = getBusinessIconDataUri('bank', { color: '#FFFFFF' });
    slide.addImage({
      data: fallbackIcon,
      x: placement.x,
      y: placement.y,
      w: placement.w * 0.5,
      h: placement.h * 0.5,
    });
    
    // eslint-disable-next-line no-console
    console.log('⚠️ Used fallback icon for logo');
  }
}

/**
 * Placement par défaut pour le logo sur la cover
 */
export const DEFAULT_LOGO_PLACEMENT: LogoPlacement = {
  x: '40%',  // Centré horizontalement
  y: '70%',  // En bas de la slide
  w: 2,      // 2 inches de large
  h: 1,      // 1 inch de hauteur (maintient le ratio)
};

/**
 * Vérifie si une URL de logo est valide
 */
export function isValidLogoUrl(logoUrl: string): boolean {
  if (!logoUrl) return false;
  
  // Data URI
  if (logoUrl.startsWith('data:image/')) return true;
  
  // URL Supabase Storage
  if (logoUrl.includes('supabase') && logoUrl.includes('storage')) return true;
  
  return false;
}

/**
 * Prépare le logo pour l'injection
 * - Convertit si nécessaire
 * - Valide le format
 */
export async function prepareLogoForInjection(logoUrl: string): Promise<string> {
  if (!isValidLogoUrl(logoUrl)) {
    throw new Error('Invalid logo URL format');
  }
  
  // Si c'est déjà une data URI, retourner direct
  if (logoUrl.startsWith('data:image/')) {
    return logoUrl;
  }
  
  // TODO: Charger l'image depuis l'URL et convertir en data URI
  // Pour l'instant, on retourne l'URL directe
  return logoUrl;
}

export default {
  applyCoverLogo,
  DEFAULT_LOGO_PLACEMENT,
  isValidLogoUrl,
  prepareLogoForInjection
};
