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
  BLEED,
  addFooter,
  addCardPanelWithShadow,
  addChapterImage,
  addTextBox,
  addAccentLine,
} from '../designSystem/serenity';

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
  const slide = pptx.addSlide();
  const { theme } = ctx;
  
  // Background: white (default, but explicit for clarity)
  slide.background = { color: 'FFFFFF' };
  
  // STEP 1: Panel with shadow and border (color 8 = panelBorder)
  // Shadow: premium outer shadow (24% opacity, 23.3pt blur, 14.3pt distance, 74°)
  // Border: uses theme.panelBorder (color 8)
  addCardPanelWithShadow(slide, COORDS_CHAPTER.panel, theme, RADIUS.panel);
  
  // STEP 2: Chapter image ON TOP with BLEED
  // Image is drawn AFTER panel so it appears above it (z-order)
  // Bleed eliminates the "hole" at haut-gauche and bas-gauche corners
  addChapterImage(slide, chapterImageDataUri, COORDS_CHAPTER.image, true);
  
  // Title (H1, ALL CAPS) - Chapter pages only have title + short description
  addTextBox(slide, spec.title, COORDS_CHAPTER.title, {
    fontSize: TYPO.sizes.h1,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Accent line under title (same as content slides)
  addAccentLine(slide, theme, 'chapter');
  
  // Subtitle/Description (short description only, no body text on chapter slides)
  // This replaces both subtitle and body - chapter slides are title + description only
  const description = spec.subtitle || '';
  if (description) {
    addTextBox(slide, description, {
      x: COORDS_CHAPTER.subtitle.x,
      y: COORDS_CHAPTER.subtitle.y,
      w: COORDS_CHAPTER.subtitle.w,
      h: 1.5, // Larger height for description
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
