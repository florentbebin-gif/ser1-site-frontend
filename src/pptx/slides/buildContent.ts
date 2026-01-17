/**
 * Content Slide Builder
 * 
 * Layout 29_Bloc Fond Blanc
 * Standard content slide with title, subtitle, body, and optional icons
 */

import PptxGenJS from 'pptxgenjs';
import type { ContentSlideSpec, ExportContext } from '../theme/types';
import {
  COORDS_CONTENT,
  TYPO,
  roleColor,
  addAccentLine,
  addFooter,
  addTextBox,
} from '../designSystem/serenity';
import { addBusinessIconsToSlide } from '../icons/addBusinessIcon';

/**
 * Build a content slide
 * 
 * @param pptx - PptxGenJS instance
 * @param spec - Content slide specification
 * @param ctx - Export context with theme
 * @param slideIndex - Slide number for footer
 */
export function buildContent(
  pptx: PptxGenJS,
  spec: ContentSlideSpec,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  const { theme } = ctx;
  
  // Background: white
  slide.background = { color: 'FFFFFF' };
  
  // Title (H1, ALL CAPS)
  addTextBox(slide, spec.title, COORDS_CONTENT.title, {
    fontSize: TYPO.sizes.h1,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Accent line
  addAccentLine(slide, theme, 'content');
  
  // Subtitle (H2)
  addTextBox(slide, spec.subtitle, COORDS_CONTENT.subtitle, {
    fontSize: TYPO.sizes.h2,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
  });
  
  // Body text (if provided)
  if (spec.body) {
    addTextBox(slide, spec.body, COORDS_CONTENT.content, {
      fontSize: TYPO.sizes.body,
      color: theme.textBody,
      align: 'left',
      valign: 'top',
    });
  }
  
  // Business icons (if provided)
  if (spec.icons && spec.icons.length > 0) {
    addBusinessIconsToSlide(slide, spec.icons, theme);
  }
  
  // Footer (onLight variant)
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildContent;
