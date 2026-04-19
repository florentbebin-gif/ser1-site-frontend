/**
 * Module helpers — utilitaires de rendu texte, validation et image de chapitre
 */

import type PptxGenJS from 'pptxgenjs';
import { SLIDE_SIZE, BLEED } from './layout';
import { TYPO } from './typography';

/**
 * Add chapter image from public assets with bleed
 *
 * IMPORTANT: Images are PRE-PROCESSED with rounded corners (in /public/pptx/chapters/)
 * Do NOT apply rounding here - it creates an oval/ellipse effect which is incorrect.
 *
 * BLEED: Image extends slightly under the panel border to eliminate
 * the "hole" caused by anti-aliasing at rounded corners.
 */
export function addChapterImage(
  slide: PptxGenJS.Slide,
  imageDataUri: string,
  rect: { x: number; y: number; w: number; h: number },
  applyBleed: boolean = true
): void {
  // Apply bleed to eliminate anti-aliasing gaps at corners
  const bleed = applyBleed ? BLEED.image : 0;

  slide.addImage({
    data: imageDataUri,
    x: rect.x - bleed,
    y: rect.y - bleed,
    w: rect.w + bleed, // Only extend right edge (left is panel edge)
    h: rect.h + 2 * bleed,
    // NO rounding option - image is pre-processed with rounded corners
  });
}

/**
 * Validate that a rect is within slide bounds (NO OVERFLOW)
 * @throws Error if rect exceeds slide canvas
 */
export function validateNoOverflow(
  rect: { x: number; y: number; w: number; h: number },
  context: string = 'element'
): void {
  const rightEdge = rect.x + rect.w;
  const bottomEdge = rect.y + rect.h;

  if (rect.x < 0 || rect.y < 0) {
    if (import.meta.env.DEV) {
      console.warn(`[Layout Contract] ${context}: Negative position detected (x:${rect.x}, y:${rect.y})`);
    }
  }
  if (rightEdge > SLIDE_SIZE.width) {
    if (import.meta.env.DEV) {
      console.warn(`[Layout Contract] ${context}: Right edge overflow (${rightEdge} > ${SLIDE_SIZE.width})`);
    }
  }
  if (bottomEdge > SLIDE_SIZE.height) {
    if (import.meta.env.DEV) {
      console.warn(`[Layout Contract] ${context}: Bottom edge overflow (${bottomEdge} > ${SLIDE_SIZE.height})`);
    }
  }
}

/**
 * Clamp a rect to stay within slide bounds
 * Used to enforce NO OVERFLOW rule
 */
export function clampToSlide(
  rect: { x: number; y: number; w: number; h: number }
): { x: number; y: number; w: number; h: number } {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const w = Math.min(rect.w, SLIDE_SIZE.width - x);
  const h = Math.min(rect.h, SLIDE_SIZE.height - y);
  return { x, y, w, h };
}

/**
 * Add text with enforced French proofing and default Arial font
 * Use this helper instead of slide.addText directly.
 */
export function addTextFr(
  slide: PptxGenJS.Slide,
  text: string | PptxGenJS.TextProps[],
  options: PptxGenJS.TextPropsOptions & Record<string, unknown>
): void {
  const normalizedText = Array.isArray(text)
    ? text.map((run) => ({
        ...run,
        options: {
          ...run.options,
          lang: 'fr-FR',
          fontFace: run.options?.fontFace || TYPO.fontFace,
        },
      }))
    : text;
  slide.addText(normalizedText, {
    ...options,
    fontFace: options.fontFace || TYPO.fontFace,
    lang: 'fr-FR',
  });
}

/**
 * Add text box with consistent defaults
 * Enforces NO OVERFLOW by clamping to slide bounds
 */
export function addTextBox(
  slide: PptxGenJS.Slide,
  text: string,
  rect: { x: number; y: number; w: number; h: number },
  style: {
    fontSize?: number;
    fontFace?: string;
    color: string;
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    isUpperCase?: boolean;
    lineSpacing?: number; // Line spacing multiplier (e.g., 1.15 for 115%)
    wrap?: boolean; // Enable text wrapping (default: true)
  }
): void {
  const displayText = style.isUpperCase ? text.toUpperCase() : text;

  // Validate and clamp to slide bounds (NO OVERFLOW)
  validateNoOverflow(rect, 'TextBox');
  const safeRect = clampToSlide(rect);

  // Build text options with French proofing language
  const textOptions: PptxGenJS.TextPropsOptions = {
    x: safeRect.x,
    y: safeRect.y,
    w: safeRect.w,
    h: safeRect.h,
    fontSize: style.fontSize || TYPO.sizes.body,
    fontFace: style.fontFace || TYPO.fontFace,
    color: style.color.replace('#', ''),
    bold: style.bold || false,
    align: style.align || 'left',
    valign: style.valign || 'top',
    wrap: style.wrap !== false, // Default to true for text fitting
    lang: 'fr-FR', // French proofing language
  };

  // Add line spacing if specified (PptxGenJS uses lineSpacingMultiple)
  if (style.lineSpacing) {
    textOptions.lineSpacingMultiple = style.lineSpacing;
  }

  slide.addText(displayText, textOptions);
}
