/**
 * Ajout des icônes business sur les slides de contenu
 * 
 * Utilise la businessIconLibrary pour obtenir les icônes en Data URI
 * Compatible avec PPTXGenJS addImage()
 */

import { getBusinessIconDataUri, type BusinessIconName } from '../../icons/business/businessIconLibrary';

export interface BusinessIconOptions {
  name: BusinessIconName;
  x: number | string;
  y: number | string;
  w: number;
  h: number;
  color?: string;  // Couleur personnalisée (optionnel)
}

/**
 * Ajoute une icône business sur un slide
 * 
 * @param slide - Slide PPTXGenJS
 * @param iconName - Nom de l'icône business
 * @param options - Position, dimensions et couleur
 */
export function addBusinessIcon(
  slide: any,
  iconName: BusinessIconName,
  options: Omit<BusinessIconOptions, 'name'>
): void {
  try {
    // Obtenir le Data URI de l'icône
    const iconDataUri = getBusinessIconDataUri(iconName, { 
      color: options.color 
    });
    
    // Ajouter l'icône au slide
    slide.addImage({
      data: iconDataUri,
      x: options.x,
      y: options.y,
      w: options.w,
      h: options.h,
    });
    
    console.log(`✅ Business icon added: ${iconName}`);
  } catch (error) {
    console.error(`❌ Failed to add business icon ${iconName}:`, error);
    
    // Fallback : texte avec le nom de l'icône
    slide.addText(`[${iconName}]`, {
      x: options.x,
      y: options.y,
      w: options.w,
      h: options.h,
      fontSize: Math.min(options.w, options.h) * 8, // Taille proportionnelle
      color: options.color || '#000000',
      align: 'center',
      valign: 'middle',
    });
    
    console.log(`⚠️ Used text fallback for icon ${iconName}`);
  }
}

/**
 * Ajoute plusieurs icônes business en une seule fois
 */
export function addBusinessIcons(
  slide: any,
  icons: BusinessIconOptions[]
): void {
  icons.forEach(icon => {
    addBusinessIcon(slide, icon.name, icon);
  });
}

/**
 * Tailles prédéfinies pour les icônes
 */
export const ICON_SIZES = {
  tiny: { w: 0.3, h: 0.3 },      // Très petite
  small: { w: 0.5, h: 0.5 },    // Petite
  medium: { w: 0.75, h: 0.75 },  // Moyenne
  large: { w: 1.0, h: 1.0 },    // Grande
  xlarge: { w: 1.5, h: 1.5 },   // Très grande
};

/**
 * Ajoute une icône avec une taille prédéfinie
 */
export function addBusinessIconWithSize(
  slide: any,
  iconName: BusinessIconName,
  x: number | string,
  y: number | string,
  size: keyof typeof ICON_SIZES,
  color?: string
): void {
  const dimensions = ICON_SIZES[size];
  
  addBusinessIcon(slide, iconName, {
    x,
    y,
    w: dimensions.w,
    h: dimensions.h,
    color,
  });
}

/**
 * Positionne une icône dans un coin du slide
 */
export function addBusinessIconInCorner(
  slide: any,
  iconName: BusinessIconName,
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  margin: number = 0.5,
  size: keyof typeof ICON_SIZES = 'small',
  color?: string
): void {
  const dimensions = ICON_SIZES[size];
  
  let x: number | string;
  let y: number | string;
  
  switch (corner) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-right':
      x = `100% - ${dimensions.w + margin}`;
      y = margin;
      break;
    case 'bottom-left':
      x = margin;
      y = `100% - ${dimensions.h + margin}`;
      break;
    case 'bottom-right':
      x = `100% - ${dimensions.w + margin}`;
      y = `100% - ${dimensions.h + margin}`;
      break;
  }
  
  addBusinessIcon(slide, iconName, {
    x,
    y,
    w: dimensions.w,
    h: dimensions.h,
    color,
  });
}

/**
 * Liste toutes les icônes business disponibles
 */
export function getAvailableBusinessIcons(): BusinessIconName[] {
  return [
    'money', 'cheque', 'bank', 'calculator', 'checklist',
    'buildings', 'gauge', 'pen', 'chart-down', 'chart-up',
    'balance', 'tower'
  ];
}

/**
 * Vérifie si une icône business est disponible
 */
export function isBusinessIconAvailable(name: string): name is BusinessIconName {
  return getAvailableBusinessIcons().includes(name as BusinessIconName);
}

export default {
  addBusinessIcon,
  addBusinessIcons,
  addBusinessIconWithSize,
  addBusinessIconInCorner,
  ICON_SIZES,
  getAvailableBusinessIcons,
  isBusinessIconAvailable
};
