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
    
    // Box dimensions
    const boxW = COORDS_COVER.logo.w;
    const boxH = COORDS_COVER.logo.h;
    
    // Check if logo fits without scaling
    if (W0 <= boxW && H0 <= boxH) {
      // No scaling needed - use original size
      const centerX = COORDS_COVER.logo.x + (boxW - W0) / 2;
      // Position logo with bottom aligned 1.5cm below slide center
      const slideCenterY = 3.75; // Slide height / 2
      const logoBottomY = slideCenterY - 0.5906; // 1.5cm = 0.5906 inches below center
      const centerY = logoBottomY; // Y position for bottom alignment (bottom edge at this position)
      
      slide.addImage({
        data: logoDataUri,
        x: centerX,
        y: centerY,
        w: W0,
        h: H0,
      });
    } else {
      // Scale down proportionally
      const scale = Math.min(boxW / W0, boxH / H0);
      const W = W0 * scale;
      const H = H0 * scale;
      
      const centerX = COORDS_COVER.logo.x + (boxW - W) / 2;
      // Position logo with bottom aligned 1.5cm below slide center
      const slideCenterY = 3.75; // Slide height / 2
      const logoBottomY = slideCenterY - 0.5906; // 1.5cm = 0.5906 inches below center
      const centerY = logoBottomY; // Y position for bottom alignment (bottom edge at this position)
      
      slide.addImage({
        data: logoDataUri,
        x: centerX,
        y: centerY,
        w: W,
        h: H,
      });
    }
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
