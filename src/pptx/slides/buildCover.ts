/**
 * Cover Slide Builder
 * 
 * Layout 1_Diapositive de titre
 * Background: theme.bgMain (color1)
 */

import PptxGenJS from 'pptxgenjs';
import type { CoverSlideSpec, ExportContext } from '../theme/types';
import {
  COORDS_COVER,
  TYPO,
  roleColor,
  addBackground,
  addAccentLine,
  addCornerMarks,
  addTextBox,
} from '../designSystem/serenity';

/**
 * Build a cover slide
 * 
 * @param pptx - PptxGenJS instance
 * @param spec - Cover slide specification
 * @param ctx - Export context with theme
 * @param logoDataUri - Optional logo as data URI (pre-loaded)
 */
export function buildCover(
  pptx: PptxGenJS,
  spec: CoverSlideSpec,
  ctx: ExportContext,
  logoDataUri?: string
): void {
  const slide = pptx.addSlide();
  const { theme } = ctx;
  
  // Background: theme.bgMain (color1)
  addBackground(slide, theme.bgMain);
  
  // Logo (if provided)
  if (logoDataUri) {
    slide.addImage({
      data: logoDataUri,
      x: COORDS_COVER.logo.x,
      y: COORDS_COVER.logo.y,
      sizing: { type: 'contain', w: COORDS_COVER.logo.w, h: COORDS_COVER.logo.h },
    });
  }
  
  // Title (ALL CAPS, centered)
  addTextBox(slide, spec.title, COORDS_COVER.title, {
    fontSize: TYPO.sizes.coverTitle,
    color: theme.textOnMain,
    align: 'center',
    valign: 'bottom',
    isUpperCase: true,
  });
  
  // Divider line (accent color)
  addAccentLine(slide, theme, 'cover');
  
  // Subtitle (centered)
  addTextBox(slide, spec.subtitle, COORDS_COVER.subtitle, {
    fontSize: TYPO.sizes.coverSubtitle,
    color: theme.textOnMain,
    align: 'center',
    valign: 'top',
  });
  
  // Meta blocks (left = date aligned left, right = advisor aligned right)
  const leftMeta = spec.leftMeta || ctx.coverLeftMeta || 'Janvier 2026';
  const rightMeta = spec.rightMeta || ctx.coverRightMeta || 
    'NOM Prénom / Conseiller en gestion de Patrimoine / Bureau';
  
  // Date: font size 14, aligned LEFT
  addTextBox(slide, leftMeta, COORDS_COVER.metaLeft, {
    fontSize: TYPO.sizes.coverMeta, // 14
    color: theme.textOnMain,
    align: 'left',
    valign: 'middle',
  });
  
  // Advisor: font size 14, aligned RIGHT
  addTextBox(slide, rightMeta, COORDS_COVER.metaRight, {
    fontSize: TYPO.sizes.coverMeta, // 14
    color: theme.textOnMain,
    align: 'right',
    valign: 'middle',
  });
  
  // Corner marks (bottom left/right)
  addCornerMarks(slide, theme, 'coverBottom');
}

export default buildCover;
