/**
 * Types de slides pour le template PPTX Serenity
 * 
 * Chaque type expose une fonction buildSlideX() pour créer le slide correspondant
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxTheme } from '../theme/pptxTheme';
import { applyCoverLogo, DEFAULT_LOGO_PLACEMENT } from '../ops/applyCoverLogo';
import { applyChapterImage } from '../ops/applyChapterImage';
import { addBusinessIcon, ICON_SIZES } from '../ops/addBusinessIcon';
import { addTextFr } from '../designSystem/serenity';

// Types de données pour chaque slide
export interface CoverSlideData {
  title: string;
  subtitle?: string;
  author: string;
  logoUrl?: string;
  theme: PptxTheme;
}

export interface ChapterSlideData {
  chapterNumber: number;
  title: string;
  subtitle?: string;
  theme: PptxTheme;
  showImage?: boolean;
}

export interface ContentSlideData {
  title: string;
  content: string | string[];
  theme: PptxTheme;
  showIcons?: boolean;
  icons?: Array<{
    name: string;
    position: { x: number; y: number };
  }>;
}

export interface EndSlideData {
  title?: string;
  message?: string;
  contact?: string;
  theme: PptxTheme;
}

/**
 * Crée une slide de couverture
 */
export function buildSlideCover(
  pptx: PptxGenJS,
  data: CoverSlideData
): any {
  const slide = pptx.addSlide();
  
  // Fond avec couleur du thème
  slide.background = { color: data.theme.bgMain };
  
  // Titre principal
  addTextFr(slide, data.title, {
    x: 1, y: 1, w: 8, h: 1.5,
    fontSize: 44,
    color: data.theme.textMain,
    bold: true,
    align: 'center',
  });
  
  // Sous-titre optionnel
  if (data.subtitle) {
    addTextFr(slide, data.subtitle, {
      x: 1, y: 2.5, w: 8, h: 1,
      fontSize: 24,
      color: data.theme.accent,
      align: 'center',
    });
  }
  
  // Auteur
  addTextFr(slide, data.author, {
    x: 1, y: 4, w: 8, h: 0.5,
    fontSize: 18,
    color: data.theme.textMain,
    align: 'center',
  });
  
  // Logo si disponible
  if (data.logoUrl) {
    applyCoverLogo(slide, data.logoUrl, DEFAULT_LOGO_PLACEMENT);
  }
  
  return slide;
}

/**
 * Crée une slide de chapitre
 */
export function buildSlideChapter(
  pptx: PptxGenJS,
  data: ChapterSlideData
): any {
  const slide = pptx.addSlide();
  
  // Fond
  slide.background = { color: data.theme.bgMain };
  
  // Image de chapitre (côté gauche)
  if (data.showImage !== false) {
    applyChapterImage(slide, data.chapterNumber, data.theme);
  }
  
  // Titre du chapitre
  const titleX = data.showImage !== false ? 3.5 : 1;
  const titleW = data.showImage !== false ? 5.5 : 8;
  
  addTextFr(slide, `Chapitre ${data.chapterNumber}`, {
    x: titleX, y: 1, w: titleW, h: 0.5,
    fontSize: 20,
    color: data.theme.accent,
    bold: true,
  });
  
  addTextFr(slide, data.title, {
    x: titleX, y: 1.5, w: titleW, h: 1,
    fontSize: 28,
    color: data.theme.textMain,
    bold: true,
  });
  
  // Sous-titre optionnel
  if (data.subtitle) {
    addTextFr(slide, data.subtitle, {
      x: titleX, y: 2.5, w: titleW, h: 0.5,
      fontSize: 18,
      color: data.theme.textMain,
    });
  }
  
  return slide;
}

/**
 * Crée une slide de contenu
 */
export function buildSlideContent(
  pptx: PptxGenJS,
  data: ContentSlideData
): any {
  const slide = pptx.addSlide();
  
  // Fond
  slide.background = { color: data.theme.bgMain };
  
  // Titre
  addTextFr(slide, data.title, {
    x: 1, y: 0.5, w: 8, h: 0.75,
    fontSize: 32,
    color: data.theme.textMain,
    bold: true,
  });
  
  // Contenu
  const contentArray = Array.isArray(data.content) ? data.content : [data.content];
  
  contentArray.forEach((text, index) => {
    addTextFr(slide, text, {
      x: 1, y: 1.5 + (index * 0.75), w: 8, h: 0.5,
      fontSize: 18,
      color: data.theme.textMain,
    });
  });
  
  // Icônes optionnelles
  if (data.showIcons && data.icons) {
    data.icons.forEach(icon => {
      addBusinessIcon(slide, icon.name as any, {
        x: icon.position.x,
        y: icon.position.y,
        w: ICON_SIZES.small.w,
        h: ICON_SIZES.small.h,
        color: data.theme.accent,
      });
    });
  }
  
  return slide;
}

/**
 * Crée une slide de fin
 */
export function buildSlideEnd(
  pptx: PptxGenJS,
  data: EndSlideData
): any {
  const slide = pptx.addSlide();
  
  // Fond
  slide.background = { color: data.theme.bgMain };
  
  // Titre
  const title = data.title || 'Merci';
  addTextFr(slide, title, {
    x: 1, y: 2, w: 8, h: 1,
    fontSize: 44,
    color: data.theme.textMain,
    bold: true,
    align: 'center',
  });
  
  // Message optionnel
  if (data.message) {
    addTextFr(slide, data.message, {
      x: 1, y: 3.5, w: 8, h: 0.75,
      fontSize: 20,
      color: data.theme.textMain,
      align: 'center',
    });
  }
  
  // Contact optionnel
  if (data.contact) {
    addTextFr(slide, data.contact, {
      x: 1, y: 4.5, w: 8, h: 0.5,
      fontSize: 16,
      color: data.theme.accent,
      align: 'center',
    });
  }
  
  return slide;
}

/**
 * Types de slides disponibles
 */
export const SLIDE_TYPES = {
  COVER: 'cover',
  CHAPTER: 'chapter',
  CONTENT: 'content',
  END: 'end',
} as const;

export type SlideType = typeof SLIDE_TYPES[keyof typeof SLIDE_TYPES];

/**
 * Fabrique de slides - crée le slide approprié selon le type
 */
export function buildSlide(
  pptx: PptxGenJS,
  type: SlideType,
  data: CoverSlideData | ChapterSlideData | ContentSlideData | EndSlideData
): any {
  switch (type) {
    case SLIDE_TYPES.COVER:
      return buildSlideCover(pptx, data as CoverSlideData);
    case SLIDE_TYPES.CHAPTER:
      return buildSlideChapter(pptx, data as ChapterSlideData);
    case SLIDE_TYPES.CONTENT:
      return buildSlideContent(pptx, data as ContentSlideData);
    case SLIDE_TYPES.END:
      return buildSlideEnd(pptx, data as EndSlideData);
    default:
      throw new Error(`Unknown slide type: ${type}`);
  }
}

export default {
  buildSlideCover,
  buildSlideChapter,
  buildSlideContent,
  buildSlideEnd,
  buildSlide,
  SLIDE_TYPES,
};
