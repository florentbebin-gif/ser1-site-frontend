/**
 * End/Legal Slide Builder
 * 
 * Layout 55_slide mentions légales
 * White background with legal text and accent corner marks
 */

import PptxGenJS from 'pptxgenjs';
import type { EndSlideSpec, ExportContext } from '../theme/types';
import {
  COORDS_END,
  TYPO,
  roleColor,
  addCornerMarks,
  addFooter,
  addTextBox,
  addBackground,
} from '../designSystem/serenity';

/**
 * Build an end/legal slide
 * 
 * @param pptx - PptxGenJS instance
 * @param spec - End slide specification
 * @param ctx - Export context with theme
 * @param slideIndex - Slide number for footer
 */
export function buildEnd(
  pptx: PptxGenJS,
  spec: EndSlideSpec,
  ctx: ExportContext,
  slideIndex: number
): void {
  const slide = pptx.addSlide();
  const { theme } = ctx;
  
  // Background: color1 (bgMain) instead of white
  addBackground(slide, theme.bgMain);
  
  // Legal text block - centered horizontally and vertically
  // textOnMain is white if bgMain is dark, black if bgMain is light
  // Font size 11pt with 1.15 line spacing for readability
  addTextBox(slide, spec.legalText, COORDS_END.legalBlock, {
    fontSize: TYPO.sizes.legal, // 11pt
    color: theme.textOnMain,
    align: 'center', // Centered horizontally as requested
    valign: 'middle', // Centered vertically in the block
    lineSpacing: 1.15, // Slightly increased for readability
  });
  
  // Corner marks (diagonal placement) - uses accent color
  addCornerMarks(slide, theme, 'endDiagonal');
  
  // Footer (onMain variant - uses textOnMain for text on colored background)
  addFooter(slide, ctx, slideIndex, 'onMain');
}

export default buildEnd;
