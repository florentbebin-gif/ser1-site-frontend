/**
 * Injection des images de chapitre sur les slides
 * 
 * Les images sont "prêtes à poser" : pas de traitement en code
 * Format PNG, ratio 3:4, coins arrondis, saturation ~30%
 */

import type { PptxTheme } from '../theme/pptxTheme';
import { addTextFr } from '../designSystem/serenity';

export interface ChapterImageOptions {
  chapterIndex: number;  // 1-9 (correspond à ch-01.png ... ch-09.png)
  placement?: {
    x: number | string;
    y: number | string;
    w: number;
    h: number;
  };
  theme?: PptxTheme;
}

/**
 * Place l'image de chapitre sur un slide
 * 
 * @param slide - Slide PPTXGenJS
 * @param chapterIndex - Index du chapitre (1-9)
 * @param theme - Thème PPTX (optionnel)
 */
export function applyChapterImage(
  slide: any,
  chapterIndex: number,
  theme?: PptxTheme
): void {
  // Validation de l'index
  if (chapterIndex < 1 || chapterIndex > 9) {
    throw new Error(`Invalid chapter index: ${chapterIndex}. Must be 1-9.`);
  }
  
  // Construction du nom de fichier
  const fileName = `ch-${chapterIndex.toString().padStart(2, '0')}.png`;
  const imagePath = `/pptx/chapters/${fileName}`;
  
  // Placement par défaut (côté gauche du slide)
  const placement = {
    x: 0.5,           // 0.5 inch depuis la gauche
    y: 1.0,           // 1 inch depuis le haut
    w: 2.25,          // 2.25 inches (ratio 3:4)
    h: 3.0,           // 3 inches (ratio 3:4)
  };
  
  try {
    slide.addImage({
      path: imagePath,
      x: placement.x,
      y: placement.y,
      w: placement.w,
      h: placement.h,
    });
    
    // eslint-disable-next-line no-console
    console.debug(`✅ Chapter image applied: ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to apply chapter image ${fileName}:`, error);
    
    // Fallback : placeholder avec texte
    addTextFr(slide, `Image ${chapterIndex}`, {
      x: placement.x,
      y: placement.y,
      w: placement.w,
      h: placement.h,
      fontSize: 14,
      color: theme?.textMain || 'FFFFFF',
      fill: { color: (theme?.bgMain || 'FFFFFF').replace('#', '') },
      align: 'center',
      valign: 'middle',
    });
    
    // eslint-disable-next-line no-console
    console.debug(`⚠️ Used text fallback for chapter ${chapterIndex}`);
  }
}

/**
 * Placement personnalisé pour une image de chapitre
 */
export function applyChapterImageWithPlacement(
  slide: any,
  options: ChapterImageOptions
): void {
  const { chapterIndex, placement } = options;
  
  // Validation
  if (chapterIndex < 1 || chapterIndex > 9) {
    throw new Error(`Invalid chapter index: ${chapterIndex}. Must be 1-9.`);
  }
  
  const fileName = `ch-${chapterIndex.toString().padStart(2, '0')}.png`;
  const imagePath = `/pptx/chapters/${fileName}`;
  
  const defaultPlacement = {
    x: 0.5,
    y: 1.0,
    w: 2.25,
    h: 3.0,
    ...placement,
  };
  
  try {
    slide.addImage({
      path: imagePath,
      x: defaultPlacement.x,
      y: defaultPlacement.y,
      w: defaultPlacement.w,
      h: defaultPlacement.h,
    });
    
    // eslint-disable-next-line no-console
    console.debug(`✅ Chapter image applied with custom placement: ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to apply chapter image ${fileName}:`, error);
  }
}

/**
 * Vérifie la disponibilité d'une image de chapitre
 */
export function isChapterImageAvailable(chapterIndex: number): boolean {
  if (chapterIndex < 1 || chapterIndex > 9) return false;
  
  // TODO(#23): Vérifier la présence réelle du fichier
  // Pour l'instant, on suppose que les images sont disponibles
  // Voir .github/TODOS_TO_CREATE.md pour créer l'issue GitHub
  return true;
}

/**
 * Liste toutes les images de chapitre disponibles
 */
export function getAvailableChapterImages(): number[] {
  return Array.from({ length: 9 }, (_, i) => i + 1);
}

/**
 * Placement pour les slides annexes (droite du slide)
 */
export const ANNEXE_IMAGE_PLACEMENT = {
  x: 7.0,    // Côté droit
  y: 1.0,    // En haut
  w: 2.25,   // Ratio 3:4
  h: 3.0,    // Ratio 3:4
};

/**
 * Placement pour les slides chapitre (gauche du slide)
 */
export const CHAPTER_IMAGE_PLACEMENT = {
  x: 0.5,    // Côté gauche
  y: 1.0,    // En haut
  w: 2.25,   // Ratio 3:4
  h: 3.0,    // Ratio 3:4
};

export default {
  applyChapterImage,
  applyChapterImageWithPlacement,
  isChapterImageAvailable,
  getAvailableChapterImages,
  ANNEXE_IMAGE_PLACEMENT,
  CHAPTER_IMAGE_PLACEMENT
};
