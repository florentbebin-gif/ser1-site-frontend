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
  addAccentLine,
  addCornerMarks,
  addTextBox,
  calculateLogoPosition,
  DEFAULT_LOGO_PLACEMENT,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

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
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.COVER });
  const { theme } = ctx;
  
  // Logo (if provided)
  if (logoDataUri) {
    // Extract dimensions from dataUri (synchronous approach)
    const getDimensionsFromDataUri = (dataUri: string) => {
      const base64Data = dataUri.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Parse PNG header for dimensions
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
        const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
        return { width, height };
      }
      
      // Parse JPEG header for dimensions
      if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
        let i = 2;
        while (i < bytes.length) {
          if (bytes[i] === 0xFF) {
            const marker = bytes[i + 1];
            if (marker === 0xC0 || marker === 0xC2) {
              const height = (bytes[i + 5] << 8) | bytes[i + 6];
              const width = (bytes[i + 7] << 8) | bytes[i + 8];
              return { width, height };
            }
            const length = (bytes[i + 2] << 8) | bytes[i + 3];
            i += length + 2;
          } else {
            i++;
          }
        }
      }
      
      // Fallback to reasonable default
      return { width: 400, height: 200 };
    };
    
    const { width: imgWidth, height: imgHeight } = getDimensionsFromDataUri(logoDataUri);
    
    // Convert pixel dimensions to inches (96 DPI standard)
    const W0 = imgWidth / 96;
    const H0 = imgHeight / 96;
    
    // Box dimensions (max allowed size)
    const boxW = COORDS_COVER.logo.w;
    const boxH = COORDS_COVER.logo.h;
    
    // Calculate final dimensions (scale down if needed)
    let finalW = W0;
    let finalH = H0;
    
    if (W0 > boxW || H0 > boxH) {
      const scale = Math.min(boxW / W0, boxH / H0);
      finalW = W0 * scale;
      finalH = H0 * scale;
    }
    
    // Get placement from spec or use default
    const placement = spec.logoPlacement || DEFAULT_LOGO_PLACEMENT;
    
    // Calculate position based on placement option
    const { x: logoX, y: logoY } = calculateLogoPosition(placement, finalW, finalH);
    
    slide.addImage({
      data: logoDataUri,
      x: logoX,
      y: logoY,
      w: finalW,
      h: finalH,
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
  
  // Meta blocks (left = date aligned left, right = advisor info aligned right)
  const leftMeta = spec.leftMeta || ctx.coverLeftMeta || 'Janvier 2026';
  
  // Date: font size 12, aligned LEFT (reduced from 14)
  addTextBox(slide, leftMeta, COORDS_COVER.metaLeft, {
    fontSize: 12,
    color: theme.textOnMain,
    align: 'left',
    valign: 'middle',
  });
  
  // Advisor info: 2 lines, font size 12, aligned RIGHT
  // Line 1: "Conseiller en gestion de patrimoine"
  // Line 2: "Bureau de [location]"
  const advisorLine1 = 'Conseiller en gestion de patrimoine';
  const advisorLine2 = 'Bureau de ';
  const advisorText = `${advisorLine1}\n${advisorLine2}`;
  
  addTextBox(slide, advisorText, COORDS_COVER.metaRight, {
    fontSize: 12,
    color: theme.textOnMain,
    align: 'right',
    valign: 'middle',
  });
  
  // Corner marks (bottom left/right)
  addCornerMarks(slide, theme, 'coverBottom');
}

export default buildCover;
