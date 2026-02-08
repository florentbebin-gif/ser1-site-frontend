/**
 * Chapter Slide Builder
 * 
 * Layout 37_Bloc img gauche
 * White panel with shadow, chapter image on left
 */

import PptxGenJS from 'pptxgenjs';
import type { ChapterSlideSpec, ExportContext } from '../theme/types';
import {
  COORDS_CHAPTER,
  TYPO,
  RADIUS,
  addFooter,
  addCardPanelWithShadow,
  addChapterImage,
  addTextBox,
  addHeader,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

/**
 * Build a chapter slide
 * 
 * CORRECT DRAWING ORDER (z-order):
 * 1. Panel with shadow + border (uses addCardPanelWithShadow)
 * 2. Chapter image ON TOP (with bleed to cover corner gaps)
 * 
 * The image is drawn LAST so it appears ON TOP of the panel.
 * Bleed ensures no "hole" at corners (haut-gauche / bas-gauche).
 * Border color = color 8 (panelBorder role).
 * 
 * @param pptx - PptxGenJS instance
 * @param spec - Chapter slide specification
 * @param ctx - Export context with theme
 * @param chapterImageDataUri - Chapter image as data URI (pre-loaded)
 * @param slideIndex - Slide number for footer
 */
export function buildChapter(
  pptx: PptxGenJS,
  spec: ChapterSlideSpec,
  ctx: ExportContext,
  chapterImageDataUri: string,
  slideIndex: number
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CHAPTER });
  const { theme } = ctx;
  
  // STEP 1: Panel with shadow and border (color 8 = panelBorder)
  // Shadow: premium outer shadow (24% opacity, 23.3pt blur, 14.3pt distance, 74°)
  // Border: uses theme.panelBorder (color 8)
  addCardPanelWithShadow(slide, COORDS_CHAPTER.panel, theme, RADIUS.panel);
  
  // STEP 2: Chapter image ON TOP with BLEED
  // Image is drawn AFTER panel so it appears above it (z-order)
  // Bleed eliminates the "hole" at haut-gauche and bas-gauche corners
  addChapterImage(slide, chapterImageDataUri, COORDS_CHAPTER.image, true);
  
  // Add header (title + accent line + subtitle) with text-based positioning
  // Note: subtitle = short chapter description (displayed once only, no duplication)
  addHeader(slide, spec.title, spec.subtitle || '', theme, 'chapter');
  
  // Body text: client-focused objective (different from subtitle to avoid repetition)
  // Only add if spec.body is provided (optional "objectif client" text)
  if (spec.body) {
    // Calculate position below the header area
    const headerHeight = TYPO.sizes.h1 / 72 + 0.1 + 0.15 + TYPO.sizes.h2 / 72;
    const bodyY = COORDS_CHAPTER.subtitle.y + headerHeight;
    
    addTextBox(slide, spec.body, {
      x: COORDS_CHAPTER.body.x,
      y: bodyY,
      w: COORDS_CHAPTER.body.w,
      h: COORDS_CHAPTER.body.h,
    }, {
      fontSize: TYPO.sizes.body,
      color: theme.textBody,
      align: 'left',
      valign: 'top',
    });
  }
  
  // Footer (onLight variant)
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildChapter;
