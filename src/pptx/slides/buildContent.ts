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
  addHeader,
  addFooter,
  addTextBox,
} from '../designSystem/serenity';
import { addBusinessIconsToSlide } from '../icons/addBusinessIcon';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

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
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  
  // Add header (title + accent line + subtitle) with text-based positioning
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');
  
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
